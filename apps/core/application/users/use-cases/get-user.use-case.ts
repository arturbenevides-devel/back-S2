import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return await this.mapToResponseDto(user);
  }

  private async mapToResponseDto(user: any): Promise<UserResponseDto> {
    // Buscar perfil do usuário
    const profile = await this.profileRepository.findById(user.profileId);
    if (!profile) {
      throw new NotFoundException('Perfil do usuário não encontrado');
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






