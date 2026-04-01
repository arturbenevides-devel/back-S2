import { Injectable, Inject, Logger } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { UserPasswordResetRequest } from '@common/domain/users/entities/user-password-reset-request.entity';
import { DateUtil } from '@common/utils/date.util';
import { EmailService } from '@common/email/services/email.service';
import { TenantRegistryService } from '@common/tenant/tenant-registry.service';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';
import { ForgotPasswordDto } from '../dto/forgot-password.dto';

@Injectable()
export class ForgotPasswordUseCase {
  private readonly logger = new Logger(ForgotPasswordUseCase.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly resetRequestRepository: UserPasswordResetRequestRepository,
    private readonly emailService: EmailService,
    private readonly tenantRegistry: TenantRegistryService,
  ) {}

  async execute(dto: ForgotPasswordDto): Promise<{ message: string }> {
    // Sempre retorna sucesso para não revelar se os dados existem
    const successMessage =
      'Se os dados informados estiverem corretos, você receberá um link para redefinir sua senha.';

    const registered = await this.tenantRegistry.isRegistered(dto.cnpj);
    if (!registered) {
      return { message: successMessage };
    }

    const active = await this.tenantRegistry.isTenantActive(dto.cnpj);
    if (!active) {
      return { message: successMessage };
    }

    await runWithTenantSchema(dto.cnpj, async () => {
      const user = await this.userRepository.findByEmail(dto.email);
      if (!user) return;

      const resetRequest = UserPasswordResetRequest.create(
        crypto.randomUUID(),
        DateUtil.addHours(DateUtil.now(), 2),
        false,
        DateUtil.now(),
        user.id,
      );

      await this.resetRequestRepository.save(resetRequest);

      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          user.fullName,
          resetRequest.resetToken,
          dto.cnpj,
        );
      } catch (error) {
        this.logger.error('Erro ao enviar email de redefinição:', error);
        this.logger.warn(
          `URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password/${resetRequest.resetToken}?cnpj=${dto.cnpj}`,
        );
      }
    });

    return { message: successMessage };
  }
}
