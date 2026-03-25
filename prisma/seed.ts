import { PrismaClient, Prisma } from '@prisma/client';
import { config } from 'dotenv';

config();

const prisma = new PrismaClient();

function quoteSchema(schemaName: string): string {
  if (!/^\d{14}$/.test(schemaName)) {
    throw new Error(`schema_name inválido no tenant_registry: ${schemaName}`);
  }
  return `"${schemaName.replace(/"/g, '""')}"`;
}

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
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${quoteSchema(schemaName)}, public`);
      await seedMenusIfEmpty(tx);
    });
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
