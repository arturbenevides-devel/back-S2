import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@common/database/persistence/prisma.service';

interface TenantRow {
  id: string;
  schema_name: string;
  company_name: string;
  created_at: Date;
}

export interface TenantSummary {
  id: string;
  schemaName: string;
  companyName: string;
  createdAt: Date;
}

@Injectable()
export class OwnerTenantsService {
  constructor(private readonly prisma: PrismaService) {}

  async listTenants(): Promise<TenantSummary[]> {
    const rows = await this.prisma.$queryRaw<TenantRow[]>`
      SELECT id, schema_name, company_name, created_at
      FROM "public"."tenant_registry"
      ORDER BY created_at DESC
    `;
    return rows.map((r) => ({
      id: r.id,
      schemaName: r.schema_name,
      companyName: r.company_name,
      createdAt: r.created_at,
    }));
  }

  async getTenant(cnpj: string): Promise<TenantSummary> {
    const rows = await this.prisma.$queryRaw<TenantRow[]>`
      SELECT id, schema_name, company_name, created_at
      FROM "public"."tenant_registry"
      WHERE schema_name = ${cnpj}
      LIMIT 1
    `;
    if (!rows.length) {
      throw new NotFoundException('Tenant não encontrado');
    }
    const r = rows[0];
    return {
      id: r.id,
      schemaName: r.schema_name,
      companyName: r.company_name,
      createdAt: r.created_at,
    };
  }
}
