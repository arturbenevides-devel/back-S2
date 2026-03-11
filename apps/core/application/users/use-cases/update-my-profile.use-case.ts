import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { User } from '@common/domain/users/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdateMyProfileUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(userId: string, updateMyProfileDto: UpdateUserDto): Promise<UserResponseDto> {
    if (!userId) {
      throw new Error('User ID não fornecido');
    }
    
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuário não encontrado com ID: ${userId}`);
    }

    // Verificar se o email já existe em outro usuário
    if (updateMyProfileDto.email && updateMyProfileDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateMyProfileDto.email);
      if (existingUser) {
        throw new ConflictException('Email já está em uso por outro usuário');
      }
    }

    // Atualizar campos do usuário
    if (updateMyProfileDto.fullName !== undefined) {
      user.updateFullName(updateMyProfileDto.fullName);
    }
    if (updateMyProfileDto.email !== undefined) {
      user.updateEmail(updateMyProfileDto.email);
    }
    if (updateMyProfileDto.profileImage !== undefined) {
      user.updateProfileImage(updateMyProfileDto.profileImage);
    }
    if (updateMyProfileDto.companyId !== undefined) {
      user.updateCompanyId(updateMyProfileDto.companyId);
    }

    try {
      const updatedUser = await this.userRepository.update(user);
      return await this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Email já está em uso por outro usuário');
      }
      throw error;
    }
  }

  private async mapToResponseDto(user: User): Promise<UserResponseDto> {
    // Buscar perfil do usuário
    const profile = await this.profileRepository.findById(user.profileId);
    if (!profile) {
      throw new Error(`Perfil do usuário ${user.id} não encontrado`);
    }
    
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      companyId: user.companyId,
      createdIn: user.createdIn,
      isActive: user.isActive,
      updatedIn: user.updatedIn,
      profile: {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        createdIn: profile.createdIn,
        isActive: profile.isActive,
        updatedIn: profile.updatedIn,
        isDefault: profile.isDefault,
      },
    };
  }
}






