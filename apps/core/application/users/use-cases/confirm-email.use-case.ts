import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly userPasswordResetRequestRepository: UserPasswordResetRequestRepository,
  ) {}

  async execute(token: string, cnpjDigits: string): Promise<{ success: boolean; message: string }> {
    return runWithTenantSchema(cnpjDigits, async () => {
      const resetRequest = await this.userPasswordResetRequestRepository.findByToken(token);

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

      if (user.isActive) {
        return {
          success: true,
          message: 'Conta já estava ativa',
        };
      }

      const activatedUser = user.activate();
      await this.userRepository.update(activatedUser);

      const usedResetRequest = resetRequest.markAsUsed();
      await this.userPasswordResetRequestRepository.update(usedResetRequest);

      return {
        success: true,
        message: 'Email confirmado com sucesso! Sua conta foi ativada.',
      };
    });
  }
}
