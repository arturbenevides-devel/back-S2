import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Criar perfil Administrador
  let adminProfile = await prisma.profile.findFirst({
    where: { name: 'Administrador Develcode' },
  });

  if (!adminProfile) {
    adminProfile = await prisma.profile.create({
      data: {
        name: 'Administrador Develcode',
        description: 'Perfil com acesso total ao sistema',
        isActive: true,
        isDefault: true,
        updatedIn: null,
      },
    });
  }

  // Criar empresa Develcode
  const federalRegistration = '21.153.354/0001-46';

  let develcodeCompany = await prisma.company.findFirst({
    where: { federalRegistration },
  });

  if (!develcodeCompany) {
    develcodeCompany = await prisma.company.create({
      data: {
        name: 'Develcode',
        federalRegistration,
        isActive: true,
        updatedIn: null,
      },
    });
  }

  // Criar usuário admin da Develcode
  const adminEmail = 'admin@develcode.com.br';
  const existingAdminUser = await prisma.user.findFirst({
    where: { email: adminEmail },
  });

  if (!existingAdminUser) {
    const hashedPassword = await bcrypt.hash('Devel@123', 10);

    await prisma.user.create({
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

  // Criar menus padrão
  const existingMenus = await prisma.menu.findFirst();
  if (!existingMenus) {
    const menus = [
      // Colaboradores - DESKTOP
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
      // Colaboradores - MOBILE
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
      // Profiles - DESKTOP
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
      // Profiles - MOBILE
      {
        action: '/profiles',
        deviceType: 'MOBILE',
        displayOrder: 3,
        icon: 'FaUserLock',
        name: 'Perfis de Acesso',
        sectionName: null,
        tooltip: null,
        type: 'CUSTOM_MENU',
      }
    ];

    for (const menu of menus) {
      await prisma.menu.create({
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
}

main()
  .catch((e) => {
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


