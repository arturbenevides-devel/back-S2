import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UserRepository as IUserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { User } from '@common/domain/users/entities/user.entity';
import { DateUtil } from '@common/utils/date.util';

@Injectable()
export class UserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { 
        id,
        isActive: true, // Apenas usuários ativos
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
  }

  async findByIdIncludingInactive(id: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { 
        id,
        // Inclui usuários inativos
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
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.prisma.user.findFirst({
      where: { 
        email,
        isActive: true, // Apenas usuários ativos
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
  }

  async save(user: User): Promise<User> {
    const createdUser = await this.prisma.user.create({
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
  }

  async update(user: User): Promise<User> {
    await this.prisma.user.update({
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
  }

  async updatePassword(userId: string, hashedPassword: string): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
        updatedIn: DateUtil.now(),
      },
    });
  }

  async updateIsActive(userId: string, isActive: boolean): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        isActive,
        updatedIn: DateUtil.now(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findAll(): Promise<User[]> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdIn: 'desc' },
    });

    return users.map(user =>
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
  }
}



