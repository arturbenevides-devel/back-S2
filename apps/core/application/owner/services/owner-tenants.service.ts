import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '@common/database/persistence/prisma.service';
import { TenantRegistryService } from '@common/tenant/tenant-registry.service';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { dropTenantSchema } from '@common/tenant/migrate-tenants.util';

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
  private readonly logger = new Logger(OwnerTenantsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: TenantRegistryService,
    private readonly config: ConfigService,
    private readonly runner: TenantPrismaRunner,
  ) {}

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

  async updateTenant(cnpj: string, companyName: string): Promise<TenantSummary> {
    const exists = await this.registry.isRegistered(cnpj);
    if (!exists) {
      throw new NotFoundException('Tenant não encontrado');
    }
    await this.prisma.$executeRawUnsafe(
      `UPDATE "public"."tenant_registry" SET company_name = $1 WHERE schema_name = $2`,
      companyName,
      cnpj,
    );
    return this.getTenant(cnpj);
  }

  async deleteTenant(cnpj: string): Promise<void> {
    const exists = await this.registry.isRegistered(cnpj);
    if (!exists) {
      throw new NotFoundException('Tenant não encontrado');
    }
    const url = this.config.get<string>('DATABASE_URL');
    if (url) {
      await dropTenantSchema(url, cnpj);
      this.logger.warn(`Schema "${cnpj}" removido do banco de dados`);
    }
    await this.registry.cleanupFailedProvision(cnpj);
    this.logger.warn(`Tenant "${cnpj}" removido do registro`);
  }

  /** Cria perfis padrão (Gerente, Atendente) caso não existam no tenant. Idempotente. */
  async seedDefaultProfiles(cnpj: string): Promise<{ created: string[] }> {
    const exists = await this.registry.isRegistered(cnpj);
    if (!exists) {
      throw new NotFoundException('Tenant não encontrado');
    }

    const created: string[] = [];

    await this.runner.run(cnpj, async (tx) => {
      // Garantir que menus de equipes existam
      const teamsMenuDesktop = await tx.menu.findFirst({
        where: { action: '/teams', deviceType: 'DESKTOP' },
      });
      if (!teamsMenuDesktop) {
        await tx.menu.create({
          data: {
            action: '/teams',
            deviceType: 'DESKTOP',
            displayOrder: 4,
            icon: 'FaUsers',
            name: 'Equipes',
            sectionName: null,
            tooltip: null,
            type: 'CUSTOM_MENU',
            isActive: true,
            updatedIn: null,
          },
        });
      }
      const teamsMenuMobile = await tx.menu.findFirst({
        where: { action: '/teams', deviceType: 'MOBILE' },
      });
      if (!teamsMenuMobile) {
        await tx.menu.create({
          data: {
            action: '/teams',
            deviceType: 'MOBILE',
            displayOrder: 4,
            icon: 'FaUsers',
            name: 'Equipes',
            sectionName: null,
            tooltip: null,
            type: 'CUSTOM_MENU',
            isActive: true,
            updatedIn: null,
          },
        });
      }

      // Renomear "Operador" → "Atendente" em tenants antigos
      const operadorProfile = await tx.profile.findFirst({ where: { name: 'Operador' } });
      if (operadorProfile) {
        await tx.profile.update({ where: { id: operadorProfile.id }, data: { name: 'Atendente' } });
      }

      const existingProfiles = await tx.profile.findMany({ select: { name: true } });
      const existingNames = new Set(existingProfiles.map((p) => p.name));

      // Buscar menus DESKTOP para vincular permissões
      const desktopMenus = await tx.menu.findMany({
        where: { deviceType: 'DESKTOP', isActive: true },
        select: { id: true, action: true },
      });

      const profilesToCreate = [
        {
          name: 'Gerente',
          description: 'Gerencia supervisores e usuários, acesso total a usuários e leitura de perfis',
          permissions: (controller: string) => ({
            canCreate: controller === 'users' || controller === 'teams',
            canUpdate: controller === 'users' || controller === 'teams',
            canDelete: controller === 'users' || controller === 'teams',
            canFind: true,
            canFindAll: true,
          }),
        },
        {
          name: 'Supervisor',
          description: 'Gerencia usuários da equipe, pode criar e editar mas não excluir',
          permissions: (controller: string) => ({
            canCreate: controller === 'users',
            canUpdate: controller === 'users',
            canDelete: false,
            canFind: true,
            canFindAll: true,
          }),
        },
        {
          name: 'Atendente',
          description: 'Acesso somente leitura, visualiza colegas',
          permissions: (controller: string) => ({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canFind: controller === 'users' || controller === 'teams',
            canFindAll: controller === 'users' || controller === 'teams',
          }),
        },
      ];

      // Verificar/criar permissões do Administrador também
      const adminProfile = await tx.profile.findFirst({ where: { isDefault: true } });
      if (adminProfile) {
        for (const menu of desktopMenus) {
          const controller = menu.action.replace(/^\//, '');
          const existing = await tx.profilePermission.findFirst({
            where: { profileId: adminProfile.id, controller },
          });
          if (!existing) {
            await tx.profilePermission.create({
              data: {
                profileId: adminProfile.id,
                menuId: menu.id,
                controller,
                canCreate: true,
                canUpdate: true,
                canDelete: true,
                canFind: true,
                canFindAll: true,
                updatedIn: null,
              },
            });
          }
        }
      }

      for (const def of profilesToCreate) {
        if (existingNames.has(def.name)) continue;

        const profile = await tx.profile.create({
          data: {
            name: def.name,
            description: def.description,
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });

        for (const menu of desktopMenus) {
          const controller = menu.action.replace(/^\//, '');
          const perms = def.permissions(controller);
          await tx.profilePermission.create({
            data: {
              profileId: profile.id,
              menuId: menu.id,
              controller,
              ...perms,
              updatedIn: null,
            },
          });
        }

        created.push(def.name);
      }
    });

    if (created.length) {
      this.logger.log(`Perfis criados no tenant "${cnpj}": ${created.join(', ')}`);
    }

    return { created };
  }
}
