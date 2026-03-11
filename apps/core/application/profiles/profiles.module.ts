import { Module } from '@nestjs/common';
import { ProfileService } from './services/profile.service';
import { CreateProfileUseCase } from './use-cases/create-profile.use-case';
import { GetProfileUseCase } from './use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { UpdateProfileStatusUseCase } from './use-cases/update-profile-status.use-case';
import { DeleteProfileUseCase } from './use-cases/delete-profile.use-case';
import { ListProfilesUseCase } from './use-cases/list-profiles.use-case';
import { ProfileRepository } from '@common/database/persistence/repositories/profile.repository';
import { MenuRepository } from '@common/database/persistence/repositories/menu.repository';
import { ProfilesController } from '@common/http/controllers/profiles.controller';
import { ProfilePermissionsModule } from '../profile-permissions/profile-permissions.module';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';

@Module({
  imports: [ProfilePermissionsModule],
  controllers: [ProfilesController],
  providers: [
    ProfileService,
    CreateProfileUseCase,
    GetProfileUseCase,
    UpdateProfileUseCase,
    UpdateProfileStatusUseCase,
    DeleteProfileUseCase,
    ListProfilesUseCase,
    JwtAuthGuard,
    PermissionGuard,
    {
      provide: 'ProfileRepository',
      useClass: ProfileRepository,
    },
    {
      provide: 'MenuRepository',
      useClass: MenuRepository,
    },
  ],
  exports: [ProfileService, 'ProfileRepository'],
})
export class ProfilesModule {}






