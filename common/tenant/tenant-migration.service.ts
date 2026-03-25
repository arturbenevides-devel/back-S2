import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  provisionTenantSchemasFromMigrations,
  migrateAllRegisteredTenants,
  resolveTenantMigrationsDir,
} from './migrate-tenants.util';

@Injectable()
export class TenantMigrationService {
  constructor(private readonly config: ConfigService) {}

  private getConnectionString(): string {
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new Error('DATABASE_URL não configurada');
    }
    return url;
  }

  private getTenantMigrationsDir(): string {
    return resolveTenantMigrationsDir(process.cwd());
  }

  async provisionNewTenant(schemaName: string): Promise<void> {
    await provisionTenantSchemasFromMigrations(
      this.getConnectionString(),
      schemaName,
      this.getTenantMigrationsDir(),
    );
  }

  async migrateAllExistingTenants(): Promise<void> {
    await migrateAllRegisteredTenants(this.getConnectionString(), this.getTenantMigrationsDir());
  }
}
