import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';

@Injectable()
export class UpdateProfileStatusUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(
    profileId: string,
    isActive: boolean,
  ): Promise<{ id: string; isActive: boolean }> {
    const profile = await this.profileRepository.findByIdIncludingInactive(profileId);
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }
    await this.profileRepository.updateIsActive(profileId, isActive);
    return { id: profileId, isActive };
  }
}
