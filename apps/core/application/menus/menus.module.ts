import { Module } from '@nestjs/common';
import { GetAuthorizedMenusUseCase } from './use-cases/get-authorized-menus.use-case';
import { CreateMenuUseCase } from './use-cases/create-menu.use-case';
import { MenuService } from './services/menu.service';
import { MenuRepository } from '@common/database/persistence/repositories/menu.repository';
import { ProfilePermissionRepository } from '@common/database/persistence/repositories/profile-permission.repository';
import { ProfileRepository } from '@common/database/persistence/repositories/profile.repository';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { MenusController } from '@common/http/controllers/menus.controller';

@Module({
  imports: [PrismaModule],
  controllers: [MenusController],
  providers: [
    GetAuthorizedMenusUseCase,
    CreateMenuUseCase,
    MenuService,
    PermissionGuard,
    {
      provide: 'MenuRepository',
      useClass: MenuRepository,
    },
    {
      provide: 'ProfilePermissionRepository',
      useClass: ProfilePermissionRepository,
    },
    {
      provide: 'ProfileRepository',
      useClass: ProfileRepository,
    },
  ],
  exports: [MenuService],
})
export class MenusModule {}






