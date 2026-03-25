import { Injectable, ConflictException, Inject, BadRequestException, Logger } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { randomBytes } from 'crypto';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { UserPasswordResetRequestRepository } from '@common/domain/users/repositories/user-password-reset-request.repository.interface';
import { User } from '@common/domain/users/entities/user.entity';
import { UserPasswordResetRequest } from '@common/domain/users/entities/user-password-reset-request.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserResponseDto } from '../dto/user-response.dto';
import { DateUtil } from '@common/utils/date.util';
import { EmailService } from '@common/email/services/email.service';

@Injectable()
export class CreateUserUseCase {
  private readonly logger = new Logger(CreateUserUseCase.name);

  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('UserPasswordResetRequestRepository')
    private readonly userPasswordResetRequestRepository: UserPasswordResetRequestRepository,
    private readonly emailService: EmailService,
  ) {}

  async execute(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    const existingUser = await this.userRepository.findByEmail(createUserDto.email);
    
    if (existingUser) {
      throw new ConflictException('Usuário com este email já existe');
    }

    const profile = await this.profileRepository.findById(createUserDto.profileId);
    if (!profile) {
      throw new BadRequestException(
        'Perfil não encontrado ou inativo.',
      );
    }

    const tempPassword =
      createUserDto.password && createUserDto.password.length >= 6
        ? createUserDto.password
        : randomBytes(32).toString('hex');
    const user = User.create(
      createUserDto.email,
      createUserDto.fullName,
      tempPassword,
      createUserDto.profileId,
      '',
      undefined,
      false,
      undefined,
      createUserDto.profileImage,
      createUserDto.companyId,
    );

    try {
      const savedUser = await this.userRepository.save(user);

      // Criar reset request para confirmação de email
      const resetRequest = UserPasswordResetRequest.create(
        crypto.randomUUID(),
        DateUtil.addHours(DateUtil.now(), 2), // 2 horas
        false,
        DateUtil.now(),
        savedUser.id,
      );

      await this.userPasswordResetRequestRepository.save(resetRequest);

      // Enviar email de boas-vindas
      try {
        await this.emailService.sendWelcomeEmail(
          savedUser.email,
          savedUser.fullName,
          resetRequest.resetToken
        );
      } catch (error) {
        this.logger.error('Erro ao enviar email de boas-vindas:', error);
        // Não falha a criação do usuário se o email falhar
        this.logger.warn('Usuário criado, mas email não foi enviado. Token de confirmação:');
        this.logger.warn(`Token: ${resetRequest.resetToken}`);
        this.logger.warn(`URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}/new-password/${resetRequest.resetToken}`);
      }

      return await this.mapToResponseDto(savedUser);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Usuário com este email já existe');
      }
      throw error;
    }
  }


  private async mapToResponseDto(user: User): Promise<UserResponseDto> {
    // Buscar perfil do usuário
    const profile = await this.profileRepository.findById(user.profileId);
    if (!profile) {
      throw new Error(`Perfil do usuário ${user.id} não encontrado`);
    }
    
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      companyId: user.companyId,
      createdIn: user.createdIn,
      isActive: user.isActive,
      updatedIn: user.updatedIn,
      profile: {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        createdIn: profile.createdIn,
        isActive: profile.isActive,
        updatedIn: profile.updatedIn,
        isDefault: profile.isDefault,
      },
    };
  }
}






