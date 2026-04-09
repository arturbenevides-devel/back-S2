import { Injectable, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';

@Injectable()
export class JwtOrQueryAuthGuard extends JwtAuthGuard {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      query?: Record<string, unknown>;
      headers: { authorization?: string };
    }>();
    const q = request.query?.access_token;
    if (typeof q === 'string' && q && !request.headers.authorization) {
      request.headers.authorization = `Bearer ${q}`;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
