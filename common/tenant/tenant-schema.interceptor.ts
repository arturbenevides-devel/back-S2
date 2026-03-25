import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from } from 'rxjs';
import { Request } from 'express';
import { firstValueFrom } from 'rxjs';
import { runWithTenantSchema } from './tenant-schema.storage';

@Injectable()
export class TenantSchemaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as { tenantSchema?: string } | undefined;
    const tenantSchema = user?.tenantSchema;
    if (!tenantSchema) {
      return next.handle();
    }
    return from(
      runWithTenantSchema(tenantSchema, () => firstValueFrom(next.handle())),
    );
  }
}
