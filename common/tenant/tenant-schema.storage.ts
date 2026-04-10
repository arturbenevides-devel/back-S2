import { AsyncLocalStorage } from 'async_hooks';
import { InternalServerErrorException } from '@nestjs/common';
import { Observable, Subscription } from 'rxjs';

const storage = new AsyncLocalStorage<string>();

/**
 * Envolve um Observable longo (ex.: SSE) para que todo o ciclo de vida rode no
 * AsyncLocalStorage do tenant. O interceptor antigo usava `firstValueFrom`, o que
 * encerrava o stream após o primeiro evento e quebrava `/whatsapp/stream`.
 */
export function wrapObservableWithTenantSchema<T>(
  schema: string,
  source: Observable<T>,
): Observable<T> {
  return new Observable((subscriber) => {
    let sub: Subscription | undefined;
    storage.run(schema, () => {
      sub = source.subscribe({
        next: (v) => {
          storage.run(schema, () => subscriber.next(v));
        },
        error: (e) => {
          storage.run(schema, () => subscriber.error(e));
        },
        complete: () => {
          storage.run(schema, () => subscriber.complete());
        },
      });
    });
    return () => sub?.unsubscribe();
  });
}

export function runWithTenantSchema<T>(schema: string, fn: () => Promise<T>): Promise<T> {
  return storage.run(schema, fn);
}

export function setTenantSchema(schema: string): void {
  storage.enterWith(schema);
}

export function getTenantSchemaOrNull(): string | undefined {
  return storage.getStore();
}

export function getRequiredTenantSchema(): string {
  const s = storage.getStore();
  if (!s) {
    throw new InternalServerErrorException('Contexto do tenant não definido');
  }
  return s;
}
 