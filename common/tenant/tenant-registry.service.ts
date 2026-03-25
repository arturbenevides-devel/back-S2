import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '@common/database/persistence/prisma.service';

@Injectable()
export class TenantRegistryService {
  constructor(private readonly prisma: PrismaService) {}

  async schemaExistsOnDatabase(schemaName: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ exists: boolean }[]>`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.schemata WHERE schema_name = ${schemaName}
      ) AS exists
    `;
    return Boolean(rows[0]?.exists);
  }

  async isRegistered(schemaName: string): Promise<boolean> {
    const rows = await this.prisma.$queryRaw<{ c: bigint }[]>`
      SELECT COUNT(*)::bigint AS c FROM public.tenant_registry WHERE schema_name = ${schemaName}
    `;
    return Number(rows[0]?.c ?? 0) > 0;
  }

  async register(schemaName: string, companyName: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO public.tenant_registry (id, schema_name, company_name) VALUES ($1, $2, $3)`,
      randomUUID(),
      schemaName,
      companyName,
    );
  }

  async cleanupFailedProvision(schemaName: string): Promise<void> {
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.tenant_migration_log WHERE schema_name = $1`,
      schemaName,
    );
    await this.prisma.$executeRawUnsafe(
      `DELETE FROM public.tenant_registry WHERE schema_name = $1`,
      schemaName,
    );
  }
}
