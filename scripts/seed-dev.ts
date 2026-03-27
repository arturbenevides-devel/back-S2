/**
 * Seed de desenvolvimento — cria dados iniciais para ambiente de dev/staging.
 *
 * Cria:
 *  1. Owner (super admin) no schema público
 *  2. Tenant com empresa, menus, perfis e permissões
 *  3. Admin do tenant (Administrador)
 *  4. Supervisor + equipe
 *  5. Atendente vinculado à equipe
 *
 * Uso:
 *   npx ts-node scripts/seed-dev.ts
 *
 * Todos os usuários ficam com isActive=true (sem necessidade de confirmar email).
 * Senha padrão: S2Viagens@2024
 */
import 'dotenv/config';
import * as path from 'path';
import { Client } from 'pg';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { databaseUrlWithPostgresSchema } from '../common/utils/database-url.util';
import {
  provisionTenantSchemasFromMigrations,
} from '../common/tenant/migrate-tenants.util';

const TENANT_MIGRATIONS_DIR = path.resolve(__dirname, '..', 'prisma', 'tenant-migrations');

// ─── Configuração dos dados de seed ───────────────────────────────────────────

const OWNER = {
  email: 'owner@s2viagens.com',
  fullName: 'Owner S2',
  password: 'S2Viagens@2024',
};

const TENANT = {
  cnpj: '11222333000181', // CNPJ válido (dígitos verificadores corretos)
  companyName: 'S2 Viagens Dev',
};

const ADMIN = {
  email: 'admin@s2viagens.com',
  fullName: 'Admin Dev',
  cpf: '52998224725', // CPF válido para testes
  password: 'S2Viagens@2024',
};

const SUPERVISOR = {
  email: 'supervisor@s2viagens.com',
  fullName: 'Supervisor Dev',
  cpf: '71168849056',
  password: 'S2Viagens@2024',
};

const ATENDENTE = {
  email: 'atendente@s2viagens.com',
  fullName: 'Atendente Dev',
  cpf: '97729484007',
  password: 'S2Viagens@2024',
};

const TEAM = {
  name: 'Equipe Alfa',
};

const DEFAULT_MENUS = [
  { action: '/users', deviceType: 'DESKTOP', displayOrder: 2, icon: 'FaUser', name: 'Usuários' },
  { action: '/users', deviceType: 'MOBILE', displayOrder: 2, icon: 'FaUser', name: 'Usuários' },
  { action: '/profiles', deviceType: 'DESKTOP', displayOrder: 3, icon: 'FaUserLock', name: 'Perfis de Acesso' },
  { action: '/profiles', deviceType: 'MOBILE', displayOrder: 3, icon: 'FaUserLock', name: 'Perfis de Acesso' },
  { action: '/teams', deviceType: 'DESKTOP', displayOrder: 4, icon: 'FaUsers', name: 'Equipes' },
  { action: '/teams', deviceType: 'MOBILE', displayOrder: 4, icon: 'FaUsers', name: 'Equipes' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatCnpj(cnpj: string): string {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL não configurada');
    process.exit(1);
  }

  const pg = new Client({ connectionString: databaseUrl });
  await pg.connect();

  // ── 1. Criar Owner ──────────────────────────────────────────────────────────
  console.log('\n🔑 Criando Owner...');
  const existingOwner = await pg.query(
    'SELECT id FROM "public"."owner_users" WHERE email = $1',
    [OWNER.email],
  );

  if (existingOwner.rows.length) {
    console.log(`   Owner já existe (id: ${existingOwner.rows[0].id})`);
  } else {
    const ownerHash = await hashPassword(OWNER.password);
    const ownerResult = await pg.query(
      `INSERT INTO "public"."owner_users" (id, email, full_name, password, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
       RETURNING id`,
      [OWNER.email, OWNER.fullName, ownerHash],
    );
    console.log(`   Owner criado (id: ${ownerResult.rows[0].id})`);
  }

  // ── 2. Criar schema do tenant ───────────────────────────────────────────────
  console.log('\n🏢 Provisionando tenant...');
  const schemaExists = await pg.query(
    `SELECT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = $1) AS exists`,
    [TENANT.cnpj],
  );

  if (schemaExists.rows[0]?.exists) {
    console.log(`   Schema "${TENANT.cnpj}" já existe, pulando provisionamento`);
  } else {
    await provisionTenantSchemasFromMigrations(databaseUrl, TENANT.cnpj, TENANT_MIGRATIONS_DIR);
    console.log(`   Schema "${TENANT.cnpj}" criado com migrations aplicadas`);
  }

  // Registrar no tenant_registry se ainda não existe
  const registryExists = await pg.query(
    'SELECT id FROM "public"."tenant_registry" WHERE schema_name = $1',
    [TENANT.cnpj],
  );

  if (!registryExists.rows.length) {
    await pg.query(
      `INSERT INTO "public"."tenant_registry" (id, schema_name, company_name, is_active)
       VALUES (gen_random_uuid(), $1, $2, true)`,
      [TENANT.cnpj, TENANT.companyName],
    );
    console.log(`   Tenant registrado no registry`);
  } else {
    console.log(`   Tenant já registrado no registry`);
  }

  await pg.end();

  // ── 3. Seed dentro do tenant ────────────────────────────────────────────────
  console.log('\n👥 Populando dados do tenant...');
  const tenantPrisma = new PrismaClient({
    datasources: {
      db: { url: databaseUrlWithPostgresSchema(databaseUrl, TENANT.cnpj) },
    },
  });

  try {
    await tenantPrisma.$transaction(async (tx) => {
      // ── Empresa ─────────────────────────────────────────────────────────────
      let company = await tx.company.findFirst();
      if (!company) {
        company = await tx.company.create({
          data: {
            name: TENANT.companyName,
            federalRegistration: formatCnpj(TENANT.cnpj),
            isActive: true,
            updatedIn: null,
          },
        });
        console.log(`   Empresa criada: ${company.name}`);
      } else {
        console.log(`   Empresa já existe: ${company.name}`);
      }

      // ── Menus ───────────────────────────────────────────────────────────────
      const existingMenus = await tx.menu.findFirst();
      const createdMenus: { id: string; action: string; deviceType: string }[] = [];

      if (!existingMenus) {
        for (const m of DEFAULT_MENUS) {
          const menu = await tx.menu.create({
            data: {
              action: m.action,
              deviceType: m.deviceType,
              displayOrder: m.displayOrder,
              icon: m.icon,
              name: m.name,
              sectionName: null,
              tooltip: null,
              type: 'CUSTOM_MENU',
              isActive: true,
              updatedIn: null,
            },
          });
          createdMenus.push({ id: menu.id, action: m.action, deviceType: m.deviceType });
        }
        console.log(`   ${createdMenus.length} menus criados`);
      } else {
        const allMenus = await tx.menu.findMany({ select: { id: true, action: true, deviceType: true } });
        createdMenus.push(...allMenus);
        console.log(`   Menus já existem (${allMenus.length})`);
      }

      const desktopMenus = createdMenus.filter((m) => m.deviceType === 'DESKTOP');

      // ── Perfis ──────────────────────────────────────────────────────────────
      const existingProfiles = await tx.profile.findMany({ select: { id: true, name: true, isDefault: true } });
      const profileMap = new Map(existingProfiles.map((p) => [p.name, p]));

      // Administrador
      let adminProfile = existingProfiles.find((p) => p.isDefault);
      if (!adminProfile) {
        adminProfile = await tx.profile.create({
          data: {
            name: 'Administrador',
            description: 'Perfil com acesso total ao sistema',
            isDefault: true,
            isActive: true,
            updatedIn: null,
          },
        });
        profileMap.set('Administrador', adminProfile);
        console.log(`   Perfil criado: Administrador`);
      }

      // Gerente
      let gerenteProfile = profileMap.get('Gerente');
      if (!gerenteProfile) {
        gerenteProfile = await tx.profile.create({
          data: {
            name: 'Gerente',
            description: 'Gerencia supervisores e usuários, acesso total a usuários e leitura de perfis',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });
        profileMap.set('Gerente', gerenteProfile);
        console.log(`   Perfil criado: Gerente`);
      }

      // Supervisor
      let supervisorProfile = profileMap.get('Supervisor');
      if (!supervisorProfile) {
        supervisorProfile = await tx.profile.create({
          data: {
            name: 'Supervisor',
            description: 'Gerencia usuários da equipe, pode criar e editar mas não excluir',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });
        profileMap.set('Supervisor', supervisorProfile);
        console.log(`   Perfil criado: Supervisor`);
      }

      // Atendente
      let atendenteProfile = profileMap.get('Atendente');
      if (!atendenteProfile) {
        atendenteProfile = await tx.profile.create({
          data: {
            name: 'Atendente',
            description: 'Acesso somente leitura, visualiza colegas',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });
        profileMap.set('Atendente', atendenteProfile);
        console.log(`   Perfil criado: Atendente`);
      }

      // ── Permissões ──────────────────────────────────────────────────────────
      const permissionDefs = [
        {
          profileId: adminProfile.id,
          permissions: () => ({
            canCreate: true, canUpdate: true, canDelete: true, canFind: true, canFindAll: true,
          }),
        },
        {
          profileId: gerenteProfile.id,
          permissions: (ctrl: string) => ({
            canCreate: ctrl === 'users' || ctrl === 'teams',
            canUpdate: ctrl === 'users' || ctrl === 'teams',
            canDelete: ctrl === 'users' || ctrl === 'teams',
            canFind: true,
            canFindAll: true,
          }),
        },
        {
          profileId: supervisorProfile.id,
          permissions: (ctrl: string) => ({
            canCreate: ctrl === 'users',
            canUpdate: ctrl === 'users',
            canDelete: false,
            canFind: true,
            canFindAll: true,
          }),
        },
        {
          profileId: atendenteProfile.id,
          permissions: (ctrl: string) => ({
            canCreate: false,
            canUpdate: false,
            canDelete: false,
            canFind: ctrl === 'users' || ctrl === 'teams',
            canFindAll: ctrl === 'users' || ctrl === 'teams',
          }),
        },
      ];

      for (const def of permissionDefs) {
        for (const menu of desktopMenus) {
          const controller = menu.action.replace(/^\//, '');
          const existing = await tx.profilePermission.findFirst({
            where: { profileId: def.profileId, controller },
          });
          if (!existing) {
            await tx.profilePermission.create({
              data: {
                profileId: def.profileId,
                menuId: menu.id,
                controller,
                ...def.permissions(controller),
                updatedIn: null,
              },
            });
          }
        }
      }
      console.log(`   Permissões verificadas/criadas`);

      // ── Usuários ────────────────────────────────────────────────────────────
      const hash = await hashPassword(ADMIN.password); // mesma senha pra todos no dev

      // Admin
      let adminUser = await tx.user.findFirst({ where: { email: ADMIN.email } });
      if (!adminUser) {
        adminUser = await tx.user.create({
          data: {
            email: ADMIN.email,
            fullName: ADMIN.fullName,
            cpf: ADMIN.cpf,
            password: hash,
            profileId: adminProfile.id,
            companyId: company.id,
            isActive: true,
            updatedIn: null,
          },
        });
        console.log(`   Usuário criado: ${ADMIN.fullName} (${ADMIN.email}) — Administrador`);
      } else {
        console.log(`   Usuário já existe: ${ADMIN.email}`);
      }

      // Supervisor
      let supervisorUser = await tx.user.findFirst({ where: { email: SUPERVISOR.email } });
      if (!supervisorUser) {
        supervisorUser = await tx.user.create({
          data: {
            email: SUPERVISOR.email,
            fullName: SUPERVISOR.fullName,
            cpf: SUPERVISOR.cpf,
            password: hash,
            profileId: supervisorProfile.id,
            companyId: company.id,
            isActive: true,
            updatedIn: null,
          },
        });
        console.log(`   Usuário criado: ${SUPERVISOR.fullName} (${SUPERVISOR.email}) — Supervisor`);
      } else {
        console.log(`   Usuário já existe: ${SUPERVISOR.email}`);
      }

      // Atendente
      let atendenteUser = await tx.user.findFirst({ where: { email: ATENDENTE.email } });
      if (!atendenteUser) {
        atendenteUser = await tx.user.create({
          data: {
            email: ATENDENTE.email,
            fullName: ATENDENTE.fullName,
            cpf: ATENDENTE.cpf,
            password: hash,
            profileId: atendenteProfile.id,
            companyId: company.id,
            isActive: true,
            updatedIn: null,
          },
        });
        console.log(`   Usuário criado: ${ATENDENTE.fullName} (${ATENDENTE.email}) — Atendente`);
      } else {
        console.log(`   Usuário já existe: ${ATENDENTE.email}`);
      }

      // ── Equipe ──────────────────────────────────────────────────────────────
      let team = await tx.team.findFirst({ where: { name: TEAM.name } });
      if (!team) {
        team = await tx.team.create({
          data: {
            name: TEAM.name,
            supervisorId: supervisorUser.id,
            isActive: true,
            updatedIn: null,
          },
        });
        console.log(`   Equipe criada: ${TEAM.name} (supervisor: ${SUPERVISOR.fullName})`);
      } else {
        console.log(`   Equipe já existe: ${team.name}`);
      }

      // Vincular atendente à equipe
      if (!atendenteUser.teamId || atendenteUser.teamId !== team.id) {
        await tx.user.update({
          where: { id: atendenteUser.id },
          data: { teamId: team.id },
        });
        console.log(`   ${ATENDENTE.fullName} vinculado à equipe ${TEAM.name}`);
      }
    });
  } finally {
    await tenantPrisma.$disconnect();
  }

  // ── Resumo ──────────────────────────────────────────────────────────────────
  console.log('\n✅ Seed de desenvolvimento concluído!\n');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  Credenciais de acesso                                      │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│  Owner:       ${OWNER.email.padEnd(40)}    │`);
  console.log(`│  Senha:       ${OWNER.password.padEnd(40)}    │`);
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│  Tenant CNPJ: ${TENANT.cnpj.padEnd(40)}    │`);
  console.log(`│  Empresa:     ${TENANT.companyName.padEnd(40)}    │`);
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│  Admin:       ${ADMIN.email.padEnd(40)}    │`);
  console.log(`│  Supervisor:  ${SUPERVISOR.email.padEnd(40)}    │`);
  console.log(`│  Atendente:   ${ATENDENTE.email.padEnd(40)}    │`);
  console.log(`│  Senha (todos): ${ADMIN.password.padEnd(38)}    │`);
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log(`│  Equipe:      ${TEAM.name.padEnd(40)}    │`);
  console.log('└──────────────────────────────────────────────────────────────┘');
}

main().catch((err) => {
  console.error('\n❌ Erro no seed:', err);
  process.exit(1);
});
