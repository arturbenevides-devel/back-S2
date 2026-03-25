import { Injectable, CanActivate, ExecutionContext, Inject, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { AccessControlOptions } from '@common/utils/decorators/access-control.decorator';
import { AccessDeniedException } from '@common/utils/exceptions/auth.exceptions';
import { ADMIN_ONLY_KEY } from '@common/utils/decorators/admin-only.decorator';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';
import { isValidCnpjDigits } from '@common/utils/cnpj.util';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as { tenantSchema?: string; profileId?: string } | undefined;

    if (
      !user?.tenantSchema ||
      typeof user.tenantSchema !== 'string' ||
      !isValidCnpjDigits(user.tenantSchema)
    ) {
      throw new UnauthorizedException('Token inválido: refaça o login informando o CNPJ da empresa');
    }

    return runWithTenantSchema(user.tenantSchema, async () => {
      if (!user.profileId) {
        throw new AccessDeniedException('acessar', 'este recurso');
      }

      const profile = await this.profileRepository.findById(user.profileId);
      if (profile && profile.isDefault) {
        return true;
      }

      const isAdminOnly = this.reflector.get<boolean>(ADMIN_ONLY_KEY, context.getHandler());
      if (isAdminOnly) {
        throw new AccessDeniedException('acessar', 'este recurso');
      }

      const accessControl = this.reflector.get<AccessControlOptions>('access-control', context.getHandler());

      if (!accessControl) {
        return true;
      }

      const controller = this.getControllerName(context);
      const action = this.getActionFromMethod(request.method, context);

      const permission = await this.profilePermissionRepository.findByProfileIdAndController(
        user.profileId,
        controller,
      );

      if (!permission) {
        throw new AccessDeniedException(action, controller);
      }

      if (!permission.hasPermission(action)) {
        throw new AccessDeniedException(action, controller);
      }

      return true;
    });
  }

  private getControllerName(context: ExecutionContext): string {
    const controller = context.getClass().name;
    return controller.replace('Controller', '').toLowerCase();
  }

  private getActionFromMethod(method: string, context: ExecutionContext): 'create' | 'update' | 'delete' | 'find' | 'findAll' {
    switch (method.toUpperCase()) {
      case 'POST':
        return 'create';
      case 'PUT':
      case 'PATCH':
        return 'update';
      case 'DELETE':
        return 'delete';
      case 'GET':
        // Para GET, precisamos verificar se é find ou findAll baseado na presença de ID na URL
        const request = context.switchToHttp().getRequest<Request>();
        const hasId = request.params && request.params.id;
        return hasId ? 'find' : 'findAll';
      default:
        return 'findAll';
    }
  }
}



