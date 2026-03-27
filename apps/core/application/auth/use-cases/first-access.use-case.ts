import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { FirstAccessDto } from '../dto/first-access.dto';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class FirstAccessUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly resetRequestRepository: UserPasswordResetRequestRepository,
  ) {}

  async execute(dto: FirstAccessDto): Promise<{ message: string }> {
    return runWithTenantSchema(dto.cnpj, async () => {
      const resetRequest = await this.resetRequestRepository.findByToken(dto.resetToken);

      if (!resetRequest) {
        throw new NotFoundException('Token de confirmação não encontrado');
      }

      if (!resetRequest.isValid()) {
        throw new BadRequestException('Token de confirmação inválido ou expirado');
      }

      const user = await this.userRepository.findByIdIncludingInactive(resetRequest.userId);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      // Se o usuário não tem senha definida, exigir criação de senha
      if (!user.hasPassword) {
        if (!dto.password) {
          throw new BadRequestException('Senha é obrigatória para ativar esta conta');
        }
        if (dto.password !== dto.passwordConfirmation) {
          throw new BadRequestException('Senhas não conferem');
        }
        const hashedPassword = bcrypt.hashSync(dto.password, 10);
        await this.userRepository.updatePassword(user.id, hashedPassword);
      }

      if (!user.isActive) {
        const activatedUser = user.activate();
        await this.userRepository.update(activatedUser);
      }

      const usedResetRequest = resetRequest.markAsUsed();
      await this.resetRequestRepository.update(usedResetRequest);

      return {
        message: 'Conta ativada com sucesso. Faça login com seu e-mail e senha.',
      };
    });
  }
}
