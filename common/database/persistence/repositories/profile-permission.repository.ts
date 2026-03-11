import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { ProfilePermissionRepository as IProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';

@Injectable()
export class ProfilePermissionRepository implements IProfilePermissionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByProfileIdAndController(profileId: string, controller: string): Promise<ProfilePermission | null> {
    const permission = await this.prisma.profilePermission.findFirst({
      where: { 
        profileId,
        controller,
        isActive: true,
      },
    });

    if (!permission) {
      return null;
    }

    return ProfilePermission.fromDatabase(
      permission.profileId,
      permission.menuId,
      permission.controller,
      permission.canCreate,
      permission.canUpdate,
      permission.canDelete,
      permission.canFind,
      permission.canFindAll,
      permission.id,
      permission.createdIn,
      permission.isActive,
      permission.updatedIn,
    );
  }

  async findByProfileId(profileId: string): Promise<ProfilePermission[]> {
    const permissions = await this.prisma.profilePermission.findMany({
      where: { 
        profileId,
        isActive: true,
      },
    });

    return permissions.map(permission =>
      ProfilePermission.fromDatabase(
        permission.profileId,
        permission.menuId,
        permission.controller,
        permission.canCreate,
        permission.canUpdate,
        permission.canDelete,
        permission.canFind,
        permission.canFindAll,
        permission.id,
        permission.createdIn,
        permission.isActive,
        permission.updatedIn,
      ),
    );
  }

  async findByProfileAndMenu(profileId: string, menuId: string): Promise<ProfilePermission | null> {
    const permission = await this.prisma.profilePermission.findFirst({
      where: { 
        profileId,
        menuId,
        isActive: true,
      },
    });

    if (!permission) {
      return null;
    }

    return ProfilePermission.fromDatabase(
      permission.profileId,
      permission.menuId,
      permission.controller,
      permission.canCreate,
      permission.canUpdate,
      permission.canDelete,
      permission.canFind,
      permission.canFindAll,
      permission.id,
      permission.createdIn,
      permission.isActive,
      permission.updatedIn,
    );
  }

  async save(profilePermission: ProfilePermission): Promise<ProfilePermission> {
    const createdPermission = await this.prisma.profilePermission.create({
      data: {
        profileId: profilePermission.profileId,
        menuId: profilePermission.menuId,
        controller: profilePermission.controller,
        canCreate: profilePermission.canCreate,
        canUpdate: profilePermission.canUpdate,
        canDelete: profilePermission.canDelete,
        canFind: profilePermission.canFind,
        canFindAll: profilePermission.canFindAll,
        createdIn: profilePermission.createdIn,
        isActive: profilePermission.isActive,
        updatedIn: profilePermission.updatedIn,
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
  }

  async update(profilePermission: ProfilePermission): Promise<ProfilePermission> {
    const updatedPermission = await this.prisma.profilePermission.update({
      where: { id: profilePermission.id },
      data: {
        profileId: profilePermission.profileId,
        menuId: profilePermission.menuId,
        controller: profilePermission.controller,
        canCreate: profilePermission.canCreate,
        canUpdate: profilePermission.canUpdate,
        canDelete: profilePermission.canDelete,
        canFind: profilePermission.canFind,
        canFindAll: profilePermission.canFindAll,
        isActive: profilePermission.isActive,
        updatedIn: profilePermission.updatedIn,
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
  }

  async delete(id: string): Promise<void> {
    await this.prisma.profilePermission.delete({
      where: { id },
    });
  }

  async findAll(): Promise<ProfilePermission[]> {
    const permissions = await this.prisma.profilePermission.findMany({
      where: { isActive: true },
    });

    return permissions.map(permission =>
      ProfilePermission.fromDatabase(
        permission.profileId,
        permission.menuId,
        permission.controller,
        permission.canCreate,
        permission.canUpdate,
        permission.canDelete,
        permission.canFind,
        permission.canFindAll,
        permission.id,
        permission.createdIn,
        permission.isActive,
        permission.updatedIn,
      ),
    );
  }
}


