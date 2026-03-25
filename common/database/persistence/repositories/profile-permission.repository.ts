import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ProfilePermissionRepository as IProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfilePermission } from '@common/domain/profile-permissions/entities/profile-permission.entity';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class ProfilePermissionRepository implements IProfilePermissionRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async findByProfileIdAndController(profileId: string, controller: string): Promise<ProfilePermission | null> {
    return this.run(async (tx) => {
      const permission = await tx.profilePermission.findFirst({
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
    });
  }

  async findByProfileId(profileId: string): Promise<ProfilePermission[]> {
    return this.run(async (tx) => {
      const permissions = await tx.profilePermission.findMany({
        where: {
          profileId,
          isActive: true,
        },
      });

      return permissions.map((permission) =>
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
    });
  }

  async findByProfileAndMenu(profileId: string, menuId: string): Promise<ProfilePermission | null> {
    return this.run(async (tx) => {
      const permission = await tx.profilePermission.findFirst({
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
    });
  }

  async save(profilePermission: ProfilePermission): Promise<ProfilePermission> {
    return this.run(async (tx) => {
      const createdPermission = await tx.profilePermission.create({
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
    });
  }

  async update(profilePermission: ProfilePermission): Promise<ProfilePermission> {
    return this.run(async (tx) => {
      const updatedPermission = await tx.profilePermission.update({
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
    });
  }

  async delete(id: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.profilePermission.delete({
        where: { id },
      });
    });
  }

  async findAll(): Promise<ProfilePermission[]> {
    return this.run(async (tx) => {
      const permissions = await tx.profilePermission.findMany({
        where: { isActive: true },
      });

      return permissions.map((permission) =>
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
    });
  }
}
