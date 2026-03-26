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
import { SystemRole } from '@common/utils/decorators/access-control.decorator';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';

@Injectable()
export class TenantSchemaInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const user = req['user'] as { tenantSchema?: string; role?: string } | undefined;

    let tenantSchema: string | undefined;

    if (user?.role === SystemRole.OWNER) {
      const headerSchema = req.headers['x-tenant-schema'] as string | undefined;
      if (headerSchema && isValidCnpjDigits(headerSchema)) {
        tenantSchema = headerSchema;
      }
    } else {
      tenantSchema = user?.tenantSchema;
    }

    if (!tenantSchema) {
      return next.handle();
    }
    return from(
      runWithTenantSchema(tenantSchema, () => firstValueFrom(next.handle())),
    );
  }
}
