import { Module } from '@nestjs/common';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { EmailModule } from '@common/email/email.module';
import { OwnerTenantsService } from './services/owner-tenants.service';
import { OwnerUsersService } from './services/owner-users.service';
import { OwnerTenantsController } from '@common/http/controllers/owner-tenants.controller';
import { OwnerUsersController } from '@common/http/controllers/owner-users.controller';
import { OwnerUserRepositoryImpl } from '@common/database/persistence/repositories/owner-user.repository';
import { ProfilePermissionsModule } from '@apps/core/application/profile-permissions/profile-permissions.module';
import { RegisterTenantUseCase } from '@apps/core/application/auth/use-cases/register-tenant.use-case';

@Module({
  imports: [PrismaModule, ProfilePermissionsModule, EmailModule],
  controllers: [OwnerTenantsController, OwnerUsersController],
  providers: [
    OwnerTenantsService,
    OwnerUsersService,
    RegisterTenantUseCase,
    {
      provide: 'OwnerUserRepository',
      useClass: OwnerUserRepositoryImpl,
    },
  ],
  exports: [
    {
      provide: 'OwnerUserRepository',
      useClass: OwnerUserRepositoryImpl,
    },
  ],
})
export class OwnerModule {}
