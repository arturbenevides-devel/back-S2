import { Module } from '@nestjs/common';
import { UserService } from './services/user.service';
import { CreateUserUseCase } from './use-cases/create-user.use-case';
import { GetUserUseCase } from './use-cases/get-user.use-case';
import { UpdateUserUseCase } from './use-cases/update-user.use-case';
import { UpdateMyProfileUseCase } from './use-cases/update-my-profile.use-case';
import { ChangePasswordUseCase } from './use-cases/change-password.use-case';
import { DeleteUserUseCase } from './use-cases/delete-user.use-case';
import { ListUsersUseCase } from './use-cases/list-users.use-case';
import { ConfirmEmailUseCase } from './use-cases/confirm-email.use-case';
import { UpdateUserStatusUseCase } from './use-cases/update-user-status.use-case';
import { SetMyPasswordUseCase } from './use-cases/set-my-password.use-case';
import { UserRepository } from '@common/database/persistence/repositories/user.repository';
import { CompanyRepository } from '@common/database/persistence/repositories/company.repository';
import { UserPasswordResetRequestRepositoryImpl } from '@common/database/persistence/repositories/user-password-reset-request.repository';
import { TeamRepository } from '@common/database/persistence/repositories/team.repository';
import { UsersController } from '@common/http/controllers/users.controller';
import { ProfilePermissionsModule } from '../profile-permissions/profile-permissions.module';
import { EmailModule } from '@common/email/email.module';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';

@Module({
  imports: [PrismaModule, ProfilePermissionsModule, EmailModule],
  controllers: [UsersController],
  providers: [
    UserService,
    CreateUserUseCase,
    GetUserUseCase,
    UpdateUserUseCase,
    UpdateMyProfileUseCase,
    ChangePasswordUseCase,
    DeleteUserUseCase,
    ListUsersUseCase,
    ConfirmEmailUseCase,
    UpdateUserStatusUseCase,
    SetMyPasswordUseCase,
    JwtAuthGuard,
    PermissionGuard,
    {
      provide: 'UserRepository',
      useClass: UserRepository,
    },
    {
      provide: 'CompanyRepository',
      useClass: CompanyRepository,
    },
    {
      provide: 'UserPasswordResetRequestRepository',
      useClass: UserPasswordResetRequestRepositoryImpl,
    },
    {
      provide: 'TeamRepository',
      useClass: TeamRepository,
    },
  ],
  exports: [UserService],
})
export class UsersModule {}






