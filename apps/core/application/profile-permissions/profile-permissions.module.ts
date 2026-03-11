import { Module } from '@nestjs/common';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { ProfilePermissionRepository } from '@common/database/persistence/repositories/profile-permission.repository';
import { ProfileRepository } from '@common/database/persistence/repositories/profile.repository';

@Module({
  imports: [PrismaModule],
  providers: [
    {
      provide: 'ProfilePermissionRepository',
      useClass: ProfilePermissionRepository,
    },
    {
      provide: 'ProfileRepository',
      useClass: ProfileRepository,
    },
  ],
  exports: ['ProfilePermissionRepository', 'ProfileRepository'],
})
export class ProfilePermissionsModule {}






