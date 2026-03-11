import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';

@Injectable()
export class DeleteProfileUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const profile = await this.profileRepository.findById(id);
    
    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    // Soft delete - apenas desativar
    profile.deactivate();
    await this.profileRepository.update(profile);
  }
}






