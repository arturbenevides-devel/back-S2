import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { MenuRepository } from '@common/domain/menus/repositories/menu.repository.interface';
import { Profile } from '@common/domain/profiles/entities/profile.entity';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';

@Injectable()
export class CreateProfileUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
    @Inject('MenuRepository')
    private readonly menuRepository: MenuRepository,
  ) {}

  async execute(createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
    const existingProfile = await this.profileRepository.findByName(createProfileDto.name);
    
    if (existingProfile) {
      throw new ConflictException('Perfil com este nome já existe');
    }

    const profile = Profile.create(
      createProfileDto.name,
      createProfileDto.description,
      false, // isDefault sempre false para perfis criados via API
    );

    // Usar transação para garantir atomicidade
    try {
      return await this.profileRepository.transaction(async (transaction) => {
        // Salvar perfil
        const savedProfile = await transaction.profileRepository.save(profile);

        // Processar permissões para cada menu
        if (createProfileDto.permissions && createProfileDto.permissions.length > 0) {
          for (const permissionDto of createProfileDto.permissions) {
            // Verificar se o menu existe
            const menu = await this.menuRepository.findById(permissionDto.menuId);
            if (!menu) {
              throw new ConflictException(`Menu com ID ${permissionDto.menuId} não encontrado`);
            }

            // Upsert permissão para o menu específico
            await this.upsertMenuPermission(
              transaction,
              savedProfile.id,
              permissionDto.menuId,
              menu.action,
              [permissionDto]
            );
          }
        }

        return await this.mapToResponseDto(savedProfile);
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Perfil com este nome já existe');
      }
      throw error;
    }
  }

  private async upsertMenuPermission(
    transaction: any,
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
      await transaction.profilePermissionRepository.update(existingPermission);
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
      await transaction.profilePermissionRepository.save(menuPermission);
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






