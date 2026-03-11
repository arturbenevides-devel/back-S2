import { Injectable, CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { AccessControlOptions } from '@common/utils/decorators/access-control.decorator';
import { AccessDeniedException } from '@common/utils/exceptions/auth.exceptions';
import { ADMIN_ONLY_KEY } from '@common/utils/decorators/admin-only.decorator';

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
    const user = request['user'] as any;

    if (!user || !user.profileId) {
      throw new AccessDeniedException('acessar', 'este recurso');
    }

    // Verificar se o perfil é isDefault (acesso total)
    const profile = await this.profileRepository.findById(user.profileId);
    if (profile && profile.isDefault) {
      return true; // Perfil padrão tem acesso total
    }

    // Verificar se o endpoint é exclusivo de admin
    const isAdminOnly = this.reflector.get<boolean>(ADMIN_ONLY_KEY, context.getHandler());
    if (isAdminOnly) {
      throw new AccessDeniedException('acessar', 'este recurso');
    }

    const accessControl = this.reflector.get<AccessControlOptions>('access-control', context.getHandler());
    
    if (!accessControl) {
      return true; // Se não há controle de acesso definido, permite
    }

    const controller = this.getControllerName(context);
    const action = this.getActionFromMethod(request.method, context);

    // Buscar permissões do perfil para o controller
    const permission = await this.profilePermissionRepository.findByProfileIdAndController(
      user.profileId,
      controller,
    );

    if (!permission) {
      throw new AccessDeniedException(action, controller);
    }

    // Verificar se tem permissão para a ação específica
    if (!permission.hasPermission(action)) {
      throw new AccessDeniedException(action, controller);
    }

    return true;
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



