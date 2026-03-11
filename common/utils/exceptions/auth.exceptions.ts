import { HttpException, HttpStatus } from '@nestjs/common';

export class InvalidTokenException extends HttpException {
  constructor() {
    super('Token JWT inválido', HttpStatus.FORBIDDEN);
  }
}

export class ExpiredTokenException extends HttpException {
  constructor() {
    super('Token JWT vencido', HttpStatus.FORBIDDEN);
  }
}

export class AccessDeniedException extends HttpException {
  constructor(action: string, controller: string) {
    super(`Acesso negado: Você não tem permissão para ${action} ${controller}`, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedException extends HttpException {
  constructor() {
    super('Token de acesso não fornecido', HttpStatus.UNAUTHORIZED);
  }
}



