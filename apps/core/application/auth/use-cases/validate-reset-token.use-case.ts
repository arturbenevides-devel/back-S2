import { Injectable, NotFoundException, BadRequestException, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';

export interface ValidateResetTokenResult {
  userId: string;
  email: string;
  firstAccess: boolean;
}

@Injectable()
export class ValidateResetTokenUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly resetRequestRepository: UserPasswordResetRequestRepository,
  ) {}

  async execute(token: string): Promise<ValidateResetTokenResult> {
    const resetRequest = await this.resetRequestRepository.findByToken(token);

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

    return {
      userId: user.id,
      email: user.email,
      firstAccess: !user.isActive,
    };
  }
}
