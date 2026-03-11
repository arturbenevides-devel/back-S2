import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserPasswordResetRequest } from '@common/domain/users/entities/user-password-reset-request.entity';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';

@Injectable()
export class UserPasswordResetRequestRepositoryImpl implements UserPasswordResetRequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest> {
    const created = await this.prisma.userPasswordResetRequest.create({
      data: {
        resetToken: resetRequest.resetToken,
        expiresIn: resetRequest.expiresIn,
        isUsed: resetRequest.isUsed,
        requestIn: resetRequest.requestIn,
        userId: resetRequest.userId,
      },
    });

    return UserPasswordResetRequest.fromDatabase(created);
  }

  async findByResetToken(resetToken: string): Promise<UserPasswordResetRequest | null> {
    const resetRequest = await this.prisma.userPasswordResetRequest.findUnique({
      where: { resetToken },
    });

    if (!resetRequest) {
      return null;
    }

    return UserPasswordResetRequest.fromDatabase(resetRequest);
  }

  async findByToken(token: string): Promise<UserPasswordResetRequest | null> {
    const resetRequest = await this.prisma.userPasswordResetRequest.findUnique({
      where: { resetToken: token },
    });

    if (!resetRequest) {
      return null;
    }

    return UserPasswordResetRequest.fromDatabase(resetRequest);
  }

  async findByUserId(userId: string): Promise<UserPasswordResetRequest[]> {
    const resetRequests = await this.prisma.userPasswordResetRequest.findMany({
      where: { userId },
      orderBy: { requestIn: 'desc' },
    });

    return resetRequests.map(resetRequest => 
      UserPasswordResetRequest.fromDatabase(resetRequest)
    );
  }

  async update(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest> {
    const updated = await this.prisma.userPasswordResetRequest.update({
      where: { resetToken: resetRequest.resetToken },
      data: {
        expiresIn: resetRequest.expiresIn,
        isUsed: resetRequest.isUsed,
        requestIn: resetRequest.requestIn,
        userId: resetRequest.userId,
      },
    });

    return UserPasswordResetRequest.fromDatabase(updated);
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.userPasswordResetRequest.deleteMany({
      where: { userId },
    });
  }
}



