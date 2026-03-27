import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { ChangePasswordByTokenDto } from '../dto/change-password-by-token.dto';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class ChangePasswordByTokenUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly resetRequestRepository: UserPasswordResetRequestRepository,
  ) {}

  async execute(dto: ChangePasswordByTokenDto): Promise<{ message: string }> {
    return runWithTenantSchema(dto.cnpj, async () => {
      const resetRequest = await this.resetRequestRepository.findByToken(dto.resetToken);

      if (!resetRequest) {
        throw new NotFoundException('Token não encontrado');
      }

      if (!resetRequest.isValid()) {
        throw new BadRequestException('Token inválido ou expirado');
      }

      const user = await this.userRepository.findByIdIncludingInactive(resetRequest.userId);

      if (!user) {
        throw new NotFoundException('Usuário não encontrado');
      }

      if (user.email !== dto.auth.email) {
        throw new BadRequestException('E-mail não corresponde ao token');
      }

      const hashedPassword = bcrypt.hashSync(dto.auth.password, 10);
      await this.userRepository.updatePassword(user.id, hashedPassword);

      const usedResetRequest = resetRequest.markAsUsed();
      await this.resetRequestRepository.update(usedResetRequest);

      return {
        message: 'Senha alterada com sucesso. Faça login com sua nova senha.',
      };
    });
  }
}
