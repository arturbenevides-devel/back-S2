import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserRepository as IUserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { User } from '@common/domain/users/entities/user.entity';
import { DateUtil } from '@common/utils/date.util';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async findById(id: string): Promise<User | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          id,
          isActive: true,
        },
      });

      if (!user) {
        return null;
      }

      return User.fromDatabase(
        user.email,
        user.fullName,
        user.password,
        user.profileId,
        user.id,
        user.createdIn,
        user.isActive,
        user.updatedIn,
        user.profileImage || undefined,
        user.companyId || undefined,
      );
    });
  }

  async findByIdIncludingInactive(id: string): Promise<User | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id },
      });

      if (!user) {
        return null;
      }

      return User.fromDatabase(
        user.email,
        user.fullName,
        user.password,
        user.profileId,
        user.id,
        user.createdIn,
        user.isActive,
        user.updatedIn,
        user.profileImage || undefined,
        user.companyId || undefined,
      );
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: {
          email,
          isActive: true,
        },
      });

      if (!user) {
        return null;
      }

      return User.fromDatabase(
        user.email,
        user.fullName,
        user.password,
        user.profileId,
        user.id,
        user.createdIn,
        user.isActive,
        user.updatedIn,
        user.profileImage || undefined,
        user.companyId || undefined,
      );
    });
  }

  async findByEmailIncludingInactive(email: string): Promise<User | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: { email },
      });

      if (!user) {
        return null;
      }

      return User.fromDatabase(
        user.email,
        user.fullName,
        user.password,
        user.profileId,
        user.id,
        user.createdIn,
        user.isActive,
        user.updatedIn,
        user.profileImage || undefined,
        user.companyId || undefined,
      );
    });
  }

  async save(user: User): Promise<User> {
    return this.run(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: user.email,
          fullName: user.fullName,
          password: user.hashedPassword,
          profileImage: user.profileImage,
          profileId: user.profileId,
          companyId: user.companyId,
          createdIn: user.createdIn,
          isActive: user.isActive,
          updatedIn: user.updatedIn,
        },
      });

      return User.fromDatabase(
        createdUser.email,
        createdUser.fullName,
        createdUser.password,
        createdUser.profileId,
        createdUser.id,
        createdUser.createdIn,
        createdUser.isActive,
        createdUser.updatedIn,
        createdUser.profileImage || undefined,
        createdUser.companyId || undefined,
      );
    });
  }

  async update(user: User): Promise<User> {
    return this.run(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          fullName: user.fullName,
          profileImage: user.profileImage,
          profileId: user.profileId,
          companyId: user.companyId,
          isActive: user.isActive,
          updatedIn: user.updatedIn,
        },
      });

      return user;
    });
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          password: hashedPassword,
          updatedIn: DateUtil.now(),
        },
      });
    });
  }

  async updateIsActive(userId: string, isActive: boolean): Promise<void> {
    return this.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          isActive,
          updatedIn: DateUtil.now(),
        },
      });
    });
  }

  async delete(id: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.user.delete({
        where: { id },
      });
    });
  }

  async findAll(): Promise<User[]> {
    return this.run(async (tx) => {
      const users = await tx.user.findMany({
        orderBy: { createdIn: 'desc' },
      });

      return users.map((user) =>
        User.create(
          user.email,
          user.fullName,
          user.password,
          user.profileId,
          user.id,
          user.createdIn,
          user.isActive,
          user.updatedIn,
          user.profileImage || undefined,
          user.companyId || undefined,
        ),
      );
    });
  }
}
