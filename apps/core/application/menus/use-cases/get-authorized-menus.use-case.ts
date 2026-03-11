import { Injectable, Inject } from '@nestjs/common';
import { MenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { MenuResponseDto } from '../dto/menu-response.dto';
import { DeviceType } from '@common/domain/menus/entities/menu.entity';

@Injectable()
export class GetAuthorizedMenusUseCase {
  constructor(
    @Inject('MenuRepository')
    private readonly menuRepository: MenuRepository,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(deviceType: DeviceType, profileId: string): Promise<MenuResponseDto[]> {
    const profile = await this.profileRepository.findById(profileId);
    const isDefaultProfile = profile?.isDefault === true;

    const menus = await this.menuRepository.findByDeviceType(deviceType);

    const results = await Promise.all(menus.map(async menu => {
      // Menus ROOT_MENU não precisam de permissões específicas
      if (menu.type === 'ROOT_MENU') {
        return {
          id: menu.id,
          action: menu.action,
          deviceType: menu.deviceType,
          displayOrder: menu.displayOrder,
          icon: menu.icon,
          name: menu.name,
          sectionName: menu.sectionName,
          tooltip: menu.tooltip,
          type: menu.type,
          permissions: null,
        };
      }

      // Para CUSTOM_MENU, buscar permissão do usuário
      const permission = await this.profilePermissionRepository.findByProfileAndMenu(
        profileId,
        menu.id,
      );

      const dto = {
        id: menu.id,
        action: menu.action,
        deviceType: menu.deviceType,
        displayOrder: menu.displayOrder,
        icon: menu.icon,
        name: menu.name,
        sectionName: menu.sectionName,
        tooltip: menu.tooltip,
        type: menu.type,
        permissions: permission ? {
          canCreate: permission.canCreate,
          canUpdate: permission.canUpdate,
          canDelete: permission.canDelete,
          canFind: permission.canFind,
          canFindAll: permission.canFindAll,
        } : null,
      };

      return dto;
    }));

    // Perfil default (is_default = true): retorna todos os menus
    if (isDefaultProfile) return results;

    // Só retornar CUSTOM_MENU se o usuário tiver ao menos uma permissão (ex.: findAll para listar)
    return results.filter((item) => {
      if (item.type === 'ROOT_MENU') return true;
      if (!item.permissions) return false;
      const p = item.permissions;
      return p.canFindAll || p.canFind || p.canCreate || p.canUpdate || p.canDelete;
    });
  }
}






