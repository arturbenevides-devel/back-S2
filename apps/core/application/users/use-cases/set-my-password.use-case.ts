import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { SetMyPasswordDto } from '../dto/set-my-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SetMyPasswordUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, dto: SetMyPasswordDto): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }
    const hashedPassword = bcrypt.hashSync(dto.newPassword, 10);
    await this.userRepository.updatePassword(userId, hashedPassword);
  }
}
