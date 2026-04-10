import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SSE_METADATA } from '@nestjs/common/constants';
import { Observable, from } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { Request } from 'express';
import {
  runWithTenantSchema,
  wrapObservableWithTenantSchema,
} from './tenant-schema.storage';
import { SystemRole } from '@common/utils/decorators/access-control.decorator';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';

@Injectable()
export class TenantSchemaInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

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

    const handler = context.getHandler();
    const isSse = this.reflector.get<boolean | undefined>(SSE_METADATA, handler) === true;

    // SSE: stream longo — não usar firstValueFrom (apenas 1 emissão → quebra o stream).
    if (isSse) {
      return wrapObservableWithTenantSchema(
        tenantSchema,
        next.handle() as Observable<unknown>,
      );
    }

    // Importante: chamar next.handle() dentro do callback (como antes). Reutilizar o mesmo
    // Observable de next.handle() capturado fora do runWithTenantSchema gerou 500 nas rotas.
    return from(
      runWithTenantSchema(tenantSchema, () =>
        firstValueFrom(next.handle() as Observable<unknown>),
      ),
    );
  }
}
