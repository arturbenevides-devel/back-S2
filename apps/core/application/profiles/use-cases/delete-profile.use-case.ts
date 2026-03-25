import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
} from '@nestjs/common';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';

@Injectable()
export class DeleteProfileUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  /** Exclusão física do perfil e permissões; ativar/desativar usa POST /profiles/status. */
  async execute(id: string): Promise<void> {
    const profile = await this.profileRepository.findByIdIncludingInactive(id);

    if (!profile) {
      throw new NotFoundException('Perfil não encontrado');
    }

    if (profile.isDefault) {
      throw new BadRequestException('O perfil padrão não pode ser excluído.');
    }

    const usersWithProfile = await this.userRepository.countByProfileId(id);
    if (usersWithProfile > 0) {
      throw new ConflictException(
        'Existem usuários vinculados a este perfil. Reatribua-os a outro perfil antes de excluir.',
      );
    }

    await this.profileRepository.delete(id);
  }
}






