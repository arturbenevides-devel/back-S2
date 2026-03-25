import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const schema = process.env.SEED_TENANT_SCHEMA?.replace(/\D/g, '');

if (!schema || schema.length !== 14) {
  console.error('Defina SEED_TENANT_SCHEMA com 14 dígitos (CNPJ do schema do tenant).');
  process.exit(1);
}

const prisma = new PrismaClient();
const qSchema = `"${schema.replace(/"/g, '""')}"`;

async function main() {
  await prisma.$transaction(async (tx) => {
    await tx.$executeRawUnsafe(`SET LOCAL search_path TO ${qSchema}, public`);

    let adminProfile = await tx.profile.findFirst({
      where: { name: 'Administrador Develcode' },
    });

    if (!adminProfile) {
      adminProfile = await tx.profile.create({
        data: {
          name: 'Administrador Develcode',
          description: 'Perfil com acesso total ao sistema',
          isActive: true,
          isDefault: true,
          updatedIn: null,
        },
      });
    }

    const federalRegistration = '21.153.354/0001-46';

    let develcodeCompany = await tx.company.findFirst({
      where: { federalRegistration },
    });

    if (!develcodeCompany) {
      develcodeCompany = await tx.company.create({
        data: {
          name: 'Develcode',
          federalRegistration,
          isActive: true,
          updatedIn: null,
        },
      });
    }

    const adminEmail = 'admin@develcode.com.br';
    const existingAdminUser = await tx.user.findFirst({
      where: { email: adminEmail },
    });

    if (!existingAdminUser) {
      const hashedPassword = await bcrypt.hash('Devel@123', 10);

      await tx.user.create({
        data: {
          email: adminEmail,
          fullName: 'Administrador',
          password: hashedPassword,
          profileId: adminProfile.id,
          companyId: develcodeCompany.id,
          isActive: true,
        },
      });
    }

    const existingMenus = await tx.menu.findFirst();
    if (!existingMenus) {
      const menus = [
        {
          action: '/users',
          deviceType: 'DESKTOP',
          displayOrder: 2,
          icon: 'FaUser',
          name: 'Usuários',
          sectionName: null,
          tooltip: null,
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
  });
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
