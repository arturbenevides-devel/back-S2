import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { UserPasswordResetRequest } from '@common/domain/users/entities/user-password-reset-request.entity';
import { DateUtil } from '@common/utils/date.util';
import { EmailService } from '@common/email/services/email.service';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class ResetUserPasswordUseCase {
  private readonly logger = new Logger(ResetUserPasswordUseCase.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly resetRequestRepository: UserPasswordResetRequestRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(userId: string): Promise<{ message: string }> {
    const user = await this.userRepository.findByIdIncludingInactive(userId);

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Limpar a senha do usuário (sentinela "!" = sem senha)
    await this.userRepository.updatePassword(userId, '!');

    // Criar token de redefinição (24h)
    const resetRequest = UserPasswordResetRequest.create(
      crypto.randomUUID(),
      DateUtil.addHours(DateUtil.now(), 24),
      false,
      DateUtil.now(),
      userId,
    );

    await this.resetRequestRepository.save(resetRequest);

    // Enviar email
    const cnpj = getRequiredTenantSchema();
    try {
      await this.emailService.sendWelcomeEmail(
        user.email,
        user.fullName,
        resetRequest.resetToken,
        cnpj,
      );
    } catch (error) {
      this.logger.error('Erro ao enviar email de redefinição:', error);
      this.logger.warn(`Token: ${resetRequest.resetToken}`);
      this.logger.warn(
        `URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/activate/${resetRequest.resetToken}?cnpj=${cnpj}`,
      );
    }

    return { message: 'Email de redefinição de senha enviado com sucesso.' };
  }
}
