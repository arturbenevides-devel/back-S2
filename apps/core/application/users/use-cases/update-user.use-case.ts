import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { User } from '@common/domain/users/entities/user.entity';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(id: string, updateUserDto: UpdateUserDto): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
      if (existingUser) {
        throw new ConflictException('Usuário com este email já existe');
      }
      user.updateEmail(updateUserDto.email);
    }

    if (updateUserDto.fullName) {
      user.updateFullName(updateUserDto.fullName);
    }
    if (updateUserDto.profileImage) {
      user.updateProfileImage(updateUserDto.profileImage);
    }
    if (updateUserDto.profileId) {
      user.updateProfileId(updateUserDto.profileId);
    }
    if (updateUserDto.companyId !== undefined) {
      user.updateCompanyId(updateUserDto.companyId);
    }

    try {
      const updatedUser = await this.userRepository.update(user);
      return await this.mapToResponseDto(updatedUser);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Usuário com este email já existe');
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






