import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UserPasswordResetRequest } from '@common/domain/users/entities/user-password-reset-request.entity';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class UserPasswordResetRequestRepositoryImpl implements UserPasswordResetRequestRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async save(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest> {
    return this.run(async (tx) => {
      const created = await tx.userPasswordResetRequest.create({
        data: {
          resetToken: resetRequest.resetToken,
          expiresIn: resetRequest.expiresIn,
          isUsed: resetRequest.isUsed,
          requestIn: resetRequest.requestIn,
          userId: resetRequest.userId,
        },
      });

      return UserPasswordResetRequest.fromDatabase(created);
    });
  }

  async findByResetToken(resetToken: string): Promise<UserPasswordResetRequest | null> {
    return this.run(async (tx) => {
      const resetRequest = await tx.userPasswordResetRequest.findUnique({
        where: { resetToken },
      });

      if (!resetRequest) {
        return null;
      }

      return UserPasswordResetRequest.fromDatabase(resetRequest);
    });
  }

  async findByToken(token: string): Promise<UserPasswordResetRequest | null> {
    return this.run(async (tx) => {
      const resetRequest = await tx.userPasswordResetRequest.findUnique({
        where: { resetToken: token },
      });

      if (!resetRequest) {
        return null;
      }

      return UserPasswordResetRequest.fromDatabase(resetRequest);
    });
  }

  async findByUserId(userId: string): Promise<UserPasswordResetRequest[]> {
    return this.run(async (tx) => {
      const resetRequests = await tx.userPasswordResetRequest.findMany({
        where: { userId },
        orderBy: { requestIn: 'desc' },
      });

      return resetRequests.map((resetRequest) =>
        UserPasswordResetRequest.fromDatabase(resetRequest),
      );
    });
  }

  async update(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest> {
    return this.run(async (tx) => {
      const updated = await tx.userPasswordResetRequest.update({
        where: { resetToken: resetRequest.resetToken },
        data: {
          expiresIn: resetRequest.expiresIn,
          isUsed: resetRequest.isUsed,
          requestIn: resetRequest.requestIn,
          userId: resetRequest.userId,
        },
      });

      return UserPasswordResetRequest.fromDatabase(updated);
    });
  }

  async deleteByUserId(userId: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.userPasswordResetRequest.deleteMany({
        where: { userId },
      });
    });
  }
}
