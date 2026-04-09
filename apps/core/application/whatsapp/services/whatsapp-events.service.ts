import { Injectable } from '@nestjs/common';
import { Observable, Subject, map } from 'rxjs';

export type WhatsAppSsePayload =
  | { type: 'message'; conversationId: string }
  | { type: 'conversation'; conversationId: string }
  | { type: 'ping' };

@Injectable()
export class WhatsappEventsService {
  private readonly subjects = new Map<string, Subject<WhatsAppSsePayload>>();

  private key(schema: string, userId: string): string {
    return `${schema}::${userId}`;
  }

  userStream(schema: string, userId: string): Observable<{ data: string }> {
    const k = this.key(schema, userId);
    let sub = this.subjects.get(k);
    if (!sub) {
      sub = new Subject<WhatsAppSsePayload>();
      this.subjects.set(k, sub);
    }
    return sub.asObservable().pipe(
      map((payload) => ({ data: JSON.stringify(payload) })),
    );
  }

  notifyUsers(schema: string, userIds: string[], payload: WhatsAppSsePayload): void {
    const seen = new Set<string>();
    for (const uid of userIds) {
      if (seen.has(uid)) continue;
      seen.add(uid);
      this.subjects.get(this.key(schema, uid))?.next(payload);
    }
  }

  notifyTenant(schema: string, payload: WhatsAppSsePayload): void {
    const prefix = `${schema}::`;
    for (const [k, subject] of this.subjects.entries()) {
      if (k.startsWith(prefix)) {
        subject.next(payload);
      }
    }
  }

  pingUser(schema: string, userId: string): void {
    this.subjects.get(this.key(schema, userId))?.next({ type: 'ping' });
  }
}
