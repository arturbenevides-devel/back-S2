import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import {
  provisionTenantSchemasFromMigrations,
  migrateAllRegisteredTenants,
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

  private getMigrationsDir(): string {
    return path.join(process.cwd(), 'prisma', 'migrations');
  }

  async provisionNewTenant(schemaName: string): Promise<void> {
    await provisionTenantSchemasFromMigrations(
      this.getConnectionString(),
      schemaName,
      this.getMigrationsDir(),
    );
  }

  async migrateAllExistingTenants(): Promise<void> {
    await migrateAllRegisteredTenants(this.getConnectionString(), this.getMigrationsDir());
  }
}
