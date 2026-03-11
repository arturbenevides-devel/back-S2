import { Injectable, NotFoundException, UnauthorizedException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ChangePasswordDto } from '../dto/change-password.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
  ) {}

  async execute(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    if (!userId) {
      throw new Error('User ID não fornecido');
    }
    
    const user = await this.userRepository.findById(userId);
    
    if (!user) {
      throw new NotFoundException(`Usuário não encontrado com ID: ${userId}`);
    }

    const isOldPasswordValid = await bcrypt.compare(changePasswordDto.oldPassword, user.password);
    
    if (!isOldPasswordValid) {
      throw new UnauthorizedException('Senha atual incorreta');
    }

    const newHashedPassword = bcrypt.hashSync(changePasswordDto.newPassword, 10);
    
    await this.userRepository.updatePassword(userId, newHashedPassword);
  }
}






