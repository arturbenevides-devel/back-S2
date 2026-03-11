import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';

@Injectable()
export class ConfirmEmailUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly userPasswordResetRequestRepository: UserPasswordResetRequestRepository,
  ) {}

  async execute(token: string): Promise<{ success: boolean; message: string }> {
    // Buscar o reset request pelo token
    const resetRequest = await this.userPasswordResetRequestRepository.findByToken(token);
    
    if (!resetRequest) {
      throw new NotFoundException('Token de confirmação não encontrado');
    }

    // Verificar se o token é válido (não foi usado e não expirou)
    if (!resetRequest.isValid()) {
      throw new BadRequestException('Token de confirmação inválido ou expirado');
    }

    // Buscar o usuário (incluindo inativos)
    const user = await this.userRepository.findByIdIncludingInactive(resetRequest.userId);
    
    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o usuário já está ativo
    if (user.isActive) {
      return {
        success: true,
        message: 'Conta já estava ativa'
      };
    }

    // Ativar o usuário
    const activatedUser = user.activate();
    await this.userRepository.update(activatedUser);

    // Marcar o token como usado
    const usedResetRequest = resetRequest.markAsUsed();
    await this.userPasswordResetRequestRepository.update(usedResetRequest);

    return {
      success: true,
      message: 'Email confirmado com sucesso! Sua conta foi ativada.'
    };
  }
}






