import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProfileRepository as IProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { Profile } from '@common/domain/profiles/entities/profile.entity';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';
import { DateUtil } from '@common/utils/date.util';

@Injectable()
export class ProfileRepository implements IProfileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findFirst({
      where: {
        id,
        isActive: true,
      },
    });

    if (!profile) {
      return null;
    }

    return Profile.create(
      profile.name,
      profile.description,
      profile.isDefault,
      profile.id,
      profile.createdIn,
      profile.isActive,
      profile.updatedIn,
    );
  }

  async findByIdIncludingInactive(id: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findFirst({
      where: { id },
    });

    if (!profile) {
      return null;
    }

    return Profile.create(
      profile.name,
      profile.description,
      profile.isDefault,
      profile.id,
      profile.createdIn,
      profile.isActive,
      profile.updatedIn,
    );
  }

  async updateIsActive(profileId: string, isActive: boolean): Promise<void> {
    await this.prisma.profile.update({
      where: { id: profileId },
      data: { isActive, updatedIn: DateUtil.now() },
    });
  }

  async findByName(name: string): Promise<Profile | null> {
    const profile = await this.prisma.profile.findFirst({
      where: { 
        name,
        isActive: true, // Apenas perfis ativos
      },
    });

    if (!profile) {
      return null;
    }

    return Profile.create(
      profile.name,
      profile.description,
      profile.isDefault,
      profile.id,
      profile.createdIn,
      profile.isActive,
      profile.updatedIn,
    );
  }

  async save(profile: Profile): Promise<Profile> {
    const createdProfile = await this.prisma.profile.create({
      data: {
        name: profile.name,
        description: profile.description,
        createdIn: profile.createdIn,
        isActive: profile.isActive,
        updatedIn: profile.updatedIn,
      },
    });

    return Profile.create(
      createdProfile.name,
      createdProfile.description,
      createdProfile.isDefault,
      createdProfile.id,
      createdProfile.createdIn,
      createdProfile.isActive,
      createdProfile.updatedIn,
    );
  }

  async update(profile: Profile): Promise<Profile> {
    const updatedProfile = await this.prisma.profile.update({
      where: { id: profile.id },
      data: {
        name: profile.name,
        description: profile.description,
        isActive: profile.isActive,
        updatedIn: profile.updatedIn,
      },
    });

    return Profile.create(
      updatedProfile.name,
      updatedProfile.description,
      updatedProfile.isDefault,
      updatedProfile.id,
      updatedProfile.createdIn,
      updatedProfile.isActive,
      updatedProfile.updatedIn,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.profile.delete({
      where: { id },
    });
  }

  async findAll(): Promise<Profile[]> {
    const profiles = await this.prisma.profile.findMany({
      where: {
        isDefault: false, // Não retornar perfil padrão do sistema na listagem; ativos e inativos
      },
      orderBy: { createdIn: 'desc' },
    });

    return profiles.map(profile =>
      Profile.create(
        profile.name,
        profile.description,
        profile.isDefault,
        profile.id,
        profile.createdIn,
        profile.isActive,
        profile.updatedIn,
      ),
    );
  }

  async saveWithPermissions(profile: Profile, permissions: ProfilePermission[]): Promise<Profile> {
    return await this.prisma.$transaction(async (tx) => {
      // Criar perfil
      const createdProfile = await tx.profile.create({
        data: {
          name: profile.name,
          description: profile.description,
          isDefault: profile.isDefault,
          createdIn: profile.createdIn,
          isActive: profile.isActive,
          updatedIn: profile.updatedIn,
        },
      });

      // Criar permissões
      if (permissions.length > 0) {
        await tx.profilePermission.createMany({
          data: permissions.map(permission => ({
            profileId: createdProfile.id,
            controller: permission.controller,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canFind: permission.canFind,
            canFindAll: permission.canFindAll,
            createdIn: permission.createdIn,
            isActive: permission.isActive,
            updatedIn: permission.updatedIn,
          })),
        });
      }

      return Profile.create(
        createdProfile.name,
        createdProfile.description,
        createdProfile.isDefault,
        createdProfile.id,
        createdProfile.createdIn,
        createdProfile.isActive,
        createdProfile.updatedIn,
      );
    });
  }

  async updateWithPermissions(profile: Profile, permissions: ProfilePermission[]): Promise<Profile> {
    return await this.prisma.$transaction(async (tx) => {
      // Atualizar perfil
      const updatedProfile = await tx.profile.update({
        where: { id: profile.id },
        data: {
          name: profile.name,
          description: profile.description,
          isActive: profile.isActive,
          updatedIn: profile.updatedIn,
        },
      });

      // Upsert permissões (update se existir, create se não existir)
      for (const permission of permissions) {
        await tx.profilePermission.upsert({
          where: {
            profileId_controller: {
              profileId: profile.id,
              controller: permission.controller,
            },
          },
          update: {
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canFind: permission.canFind,
            canFindAll: permission.canFindAll,
            isActive: permission.isActive,
            updatedIn: DateUtil.now(),
          },
          create: {
            profileId: profile.id,
            controller: permission.controller,
            canCreate: permission.canCreate,
            canUpdate: permission.canUpdate,
            canDelete: permission.canDelete,
            canFind: permission.canFind,
            canFindAll: permission.canFindAll,
            createdIn: permission.createdIn,
            isActive: permission.isActive,
            updatedIn: permission.updatedIn,
          },
        });
      }

      return Profile.create(
        updatedProfile.name,
        updatedProfile.description,
        updatedProfile.isDefault,
        updatedProfile.id,
        updatedProfile.createdIn,
        updatedProfile.isActive,
        updatedProfile.updatedIn,
      );
    });
  }

  async transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T> {
    return await this.prisma.$transaction(async (tx) => {
      const transaction = {
        profileRepository: {
          save: async (profile: Profile) => {
            const createdProfile = await tx.profile.create({
              data: {
                name: profile.name,
                description: profile.description,
                isDefault: profile.isDefault,
                createdIn: profile.createdIn,
                isActive: profile.isActive,
                updatedIn: profile.updatedIn,
              },
            });

            return Profile.create(
              createdProfile.name,
              createdProfile.description,
              createdProfile.isDefault,
              createdProfile.id,
              createdProfile.createdIn,
              createdProfile.isActive,
              createdProfile.updatedIn,
            );
          },
        },
        profilePermissionRepository: {
          save: async (permission: ProfilePermission) => {
            const createdPermission = await tx.profilePermission.create({
              data: {
                profileId: permission.profileId,
                menuId: permission.menuId,
                controller: permission.controller,
                canCreate: permission.canCreate,
                canUpdate: permission.canUpdate,
                canDelete: permission.canDelete,
                canFind: permission.canFind,
                canFindAll: permission.canFindAll,
                createdIn: permission.createdIn,
                isActive: permission.isActive,
                updatedIn: permission.updatedIn,
              },
            });

            return ProfilePermission.fromDatabase(
              createdPermission.profileId,
              createdPermission.menuId,
              createdPermission.controller,
              createdPermission.canCreate,
              createdPermission.canUpdate,
              createdPermission.canDelete,
              createdPermission.canFind,
              createdPermission.canFindAll,
              createdPermission.id,
              createdPermission.createdIn,
              createdPermission.isActive,
              createdPermission.updatedIn,
            );
          },
          update: async (permission: ProfilePermission) => {
            const updatedPermission = await tx.profilePermission.update({
              where: { id: permission.id },
              data: {
                profileId: permission.profileId,
                menuId: permission.menuId,
                controller: permission.controller,
                canCreate: permission.canCreate,
                canUpdate: permission.canUpdate,
                canDelete: permission.canDelete,
                canFind: permission.canFind,
                canFindAll: permission.canFindAll,
                isActive: permission.isActive,
                updatedIn: permission.updatedIn,
              },
            });

            return ProfilePermission.fromDatabase(
              updatedPermission.profileId,
              updatedPermission.menuId,
              updatedPermission.controller,
              updatedPermission.canCreate,
              updatedPermission.canUpdate,
              updatedPermission.canDelete,
              updatedPermission.canFind,
              updatedPermission.canFindAll,
              updatedPermission.id,
              updatedPermission.createdIn,
              updatedPermission.isActive,
              updatedPermission.updatedIn,
            );
          },
        },
      };

      return await callback(transaction);
    });
  }
}



