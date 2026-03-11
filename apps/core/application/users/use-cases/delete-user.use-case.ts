import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete - apenas desativar
    user.deactivate();
    await this.userRepository.update(user);
  }
}






