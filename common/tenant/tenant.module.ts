import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { TenantPrismaRunner } from './tenant-prisma.runner';
import { TenantRegistryService } from './tenant-registry.service';
import { TenantMigrationService } from './tenant-migration.service';

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TenantPrismaRunner, TenantRegistryService, TenantMigrationService],
  exports: [TenantPrismaRunner, TenantRegistryService, TenantMigrationService],
})
export class TenantModule {}
