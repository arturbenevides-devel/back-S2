import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { InvalidTokenException, ExpiredTokenException } from '@common/utils/exceptions/auth.exceptions';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';
import { SystemRole, OWNER_SENTINEL } from '@common/utils/decorators/access-control.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = (await this.jwtService.verifyAsync(token)) as {
        tenantSchema?: string;
        role?: string;
      };

      if (payload.role === SystemRole.OWNER) {
        if (payload.tenantSchema !== OWNER_SENTINEL) {
          throw new UnauthorizedException('Token de Owner inválido');
        }
        request['user'] = payload;
        return true;
      }

      if (
        !payload.tenantSchema ||
        typeof payload.tenantSchema !== 'string' ||
        !isValidCnpjDigits(payload.tenantSchema)
      ) {
        throw new UnauthorizedException('Token inválido: refaça o login informando o CNPJ da empresa');
      }
      request['user'] = payload;
      return true;
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      const name = error && typeof error === 'object' && 'name' in error ? String((error as { name: string }).name) : '';
      if (name === 'TokenExpiredError') {
        throw new ExpiredTokenException();
      }
      throw new InvalidTokenException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
