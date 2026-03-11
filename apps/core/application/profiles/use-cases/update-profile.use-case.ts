import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { MenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { Profile } from '@common/domain/profiles/entities/profile.entity';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';

@Injectable()
export class UpdateProfileUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
    @Inject('MenuRepository')
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(id: string, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    const profile = await this.profileRepository.findById(id);
    
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (updateProfileDto.name && updateProfileDto.name !== profile.name) {
      const existingProfile = await this.profileRepository.findByName(updateProfileDto.name);
      if (existingProfile) {
        throw new ConflictException('Perfil com este nome já existe');
      }
      profile.updateName(updateProfileDto.name);
    }

    if (updateProfileDto.description) {
      profile.updateDescription(updateProfileDto.description);
    }

    // Atualizar perfil
    try {
      const updatedProfile = await this.profileRepository.update(profile);

    // Processar apenas as permissões fornecidas no request
    if (updateProfileDto.permissions && updateProfileDto.permissions.length > 0) {
      for (const permissionDto of updateProfileDto.permissions) {
        // Verificar se o menu existe
        const menu = await this.menuRepository.findById(permissionDto.menuId);
        if (!menu) {
          throw new ConflictException(`Menu com ID ${permissionDto.menuId} não encontrado`);
        }

        // Upsert permissão para o menu específico
        await this.upsertMenuPermission(
          updatedProfile.id,
          permissionDto.menuId,
          menu.action,
          [permissionDto]
        );
      }
    }

    return await this.mapToResponseDto(updatedProfile);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Perfil com este nome já existe');
      }
      throw error;
    }
  }


  private async upsertMenuPermission(
    profileId: string,
    menuId: string,
    menuAction: string,
    permissions?: any[]
  ): Promise<void> {
    // Usar o action do menu como controller (removendo a / inicial)
    const controller = menuAction.startsWith('/') ? menuAction.substring(1) : menuAction;

    // Verificar se já existe permissão para este perfil e menu
    const existingPermission = await this.profilePermissionRepository.findByProfileAndMenu(
      profileId,
      menuId,
    );

    // Usar as permissões fornecidas diretamente (sem filtrar por controller)
    const canCreate = permissions?.[0]?.canCreate || false;
    const canUpdate = permissions?.[0]?.canUpdate || false;
    const canDelete = permissions?.[0]?.canDelete || false;
    const canFind = permissions?.[0]?.canFind || false;
    const canFindAll = permissions?.[0]?.canFindAll || false;

    if (existingPermission) {
      // Atualizar permissão existente
      existingPermission.updatePermissions(canCreate, canUpdate, canDelete, canFind, canFindAll);
      await this.profilePermissionRepository.update(existingPermission);
    } else {
      // Criar nova permissão
      const menuPermission = ProfilePermission.create(
        profileId,
        menuId,
        controller,
        canCreate,
        canUpdate,
        canDelete,
        canFind,
        canFindAll,
      );
      await this.profilePermissionRepository.save(menuPermission);
    }
  }

  private async mapToResponseDto(profile: Profile): Promise<ProfileResponseDto> {
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      createdIn: profile.createdIn,
      isActive: profile.isActive,
      updatedIn: profile.updatedIn,
      isDefault: profile.isDefault,
    };
  }
}






