import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { MenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { ProfileResponseDto, ProfileMenuResponseDto } from '../dto/profile-response.dto';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';

const DEFAULT_DEVICE_TYPE = 'DESKTOP';

@Injectable()
export class GetProfileUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
    @Inject('MenuRepository')
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(id: string): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findByIdIncludingInactive(id);

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    const [menus, profilePermissions] = await Promise.all([
      this.menuRepository.findByDeviceType(DEFAULT_DEVICE_TYPE),
      this.profilePermissionRepository.findByProfileId(profile.id),
    ]);

    const permissionByMenuId = new Map<string, ProfilePermission>();
    for (const pp of profilePermissions) {
      if (pp.menuId) {
        permissionByMenuId.set(pp.menuId, pp);
      }
    }

    const menuResponses: ProfileMenuResponseDto[] = menus.map((menu) => {
      const perm = permissionByMenuId.get(menu.id);
      return {
        id: menu.id,
        name: menu.name,
        type: menu.type,
        action: menu.action,
        deviceType: menu.deviceType,
        displayOrder: menu.displayOrder,
        icon: menu.icon,
        sectionName: menu.sectionName,
        tooltip: menu.tooltip,
        permissions: [
          {
            canCreate: perm?.canCreate ?? false,
            canUpdate: perm?.canUpdate ?? false,
            canDelete: perm?.canDelete ?? false,
            canFind: perm?.canFind ?? false,
            canFindAll: perm?.canFindAll ?? false,
          },
        ],
      };
    });

    return this.mapToResponseDto(profile, menuResponses);
  }

  private mapToResponseDto(
    profile: { id: string; name: string; description: string; createdIn: Date; isActive: boolean; updatedIn: Date | null; isDefault: boolean },
    menuResponses: ProfileMenuResponseDto[],
  ): ProfileResponseDto {
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      createdIn: profile.createdIn,
      isActive: profile.isActive,
      updatedIn: profile.updatedIn,
      isDefault: profile.isDefault,
      menuResponses,
    };
  }
}






