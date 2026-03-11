import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, isActive: boolean): Promise<{ id: string; isActive: boolean }> {
    const user = await this.userRepository.findByIdIncludingInactive(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    await this.userRepository.updateIsActive(userId, isActive);
    return { id: userId, isActive };
  }
}
