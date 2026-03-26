import { Module } from '@nestjs/common';
import { AuthService } from './services/auth.service';
import { AuthController } from '@common/http/controllers/auth.controller';
import { UserRepository } from '@common/database/persistence/repositories/user.repository';
import { ProfileRepository } from '@common/database/persistence/repositories/profile.repository';
import { UserPasswordResetRequestRepositoryImpl } from '@common/database/persistence/repositories/user-password-reset-request.repository';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { EmailModule } from '@common/email/email.module';
import { ValidateResetTokenUseCase } from './use-cases/validate-reset-token.use-case';
import { FirstAccessUseCase } from './use-cases/first-access.use-case';
import { ChangePasswordByTokenUseCase } from './use-cases/change-password-by-token.use-case';
import { RegisterTenantUseCase } from './use-cases/register-tenant.use-case';

@Module({
  imports: [PrismaModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    ValidateResetTokenUseCase,
    FirstAccessUseCase,
    ChangePasswordByTokenUseCase,
    RegisterTenantUseCase,
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'ProfileRepository',
      useClass: ProfileRepository,
    },
    {
      provide: 'UserPasswordResetRequestRepository',
      useClass: UserPasswordResetRequestRepositoryImpl,
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}






