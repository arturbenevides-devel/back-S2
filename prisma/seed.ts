import { PrismaClient, Prisma } from '@prisma/client';
import { config } from 'dotenv';
import { databaseUrlWithPostgresSchema } from '../common/utils/database-url.util';

config();

const prisma = new PrismaClient();

async function seedMenusIfEmpty(tx: Prisma.TransactionClient): Promise<void> {
  const existingMenus = await tx.menu.findFirst();
  if (existingMenus) {
    return;
  }
  const menus = [
    {
      action: '/users',
      deviceType: 'DESKTOP',
      displayOrder: 2,
      icon: 'FaUser',
      name: 'Usuários',
      sectionName: null as string | null,
      tooltip: null as string | null,
      type: 'CUSTOM_MENU',
    },
    {
      action: '/users',
      deviceType: 'MOBILE',
      displayOrder: 2,
      icon: 'FaUser',
      name: 'Usuários',
      sectionName: null,
      tooltip: null,
      type: 'CUSTOM_MENU',
    },
    {
      action: '/profiles',
      deviceType: 'DESKTOP',
      displayOrder: 3,
      icon: 'FaUserLock',
      name: 'Perfis de Acesso',
      sectionName: null,
      tooltip: null,
      type: 'CUSTOM_MENU',
    },
    {
      action: '/profiles',
      deviceType: 'MOBILE',
      displayOrder: 3,
      icon: 'FaUserLock',
      name: 'Perfis de Acesso',
      sectionName: null,
      tooltip: null,
      type: 'CUSTOM_MENU',
    },
  ];
  for (const menu of menus) {
    await tx.menu.create({
      data: {
        action: menu.action,
        deviceType: menu.deviceType,
        displayOrder: menu.displayOrder,
        icon: menu.icon,
        name: menu.name,
        sectionName: menu.sectionName,
        tooltip: menu.tooltip,
        type: menu.type,
        isActive: true,
      },
    });
  }
}

async function main() {
  const baseUrl = process.env.DATABASE_URL;
  if (!baseUrl) {
    process.exit(1);
  }
  const rows = await prisma.$queryRaw<{ schema_name: string }[]>`
    SELECT schema_name FROM public.tenant_registry ORDER BY schema_name
  `;
  if (rows.length === 0) {
    console.log(
      'Seed: nenhum tenant em public.tenant_registry. Cadastre empresas via POST /api/v1/auth/register-tenant.',
    );
    return;
  }
  for (const row of rows) {
    const schemaName = row.schema_name;
    const tenantPrisma = new PrismaClient({
      datasources: {
        db: { url: databaseUrlWithPostgresSchema(baseUrl, schemaName) },
      },
    });
    try {
      await tenantPrisma.$transaction(async (tx) => {
        await seedMenusIfEmpty(tx);
      });
    } finally {
      await tenantPrisma.$disconnect();
    }
    console.log(`Seed: menus verificados no tenant ${schemaName}.`);
  }
}

main()
  .catch(() => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
