import {
  Injectable,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { TenantRegistryService } from '@common/tenant/tenant-registry.service';
import { TenantMigrationService } from '@common/tenant/tenant-migration.service';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { formatCnpjDisplay } from '@common/utils/cnpj.util';
import { dropTenantSchema } from '@common/tenant/migrate-tenants.util';
import { DateUtil } from '@common/utils/date.util';
import { EmailService } from '@common/email/services/email.service';
import { RegisterTenantDto } from '../dto/register-tenant.dto';

const DEFAULT_MENUS = [
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
  {
    action: '/teams',
    deviceType: 'DESKTOP',
    displayOrder: 4,
    icon: 'FaUsers',
    name: 'Equipes',
    sectionName: null,
    tooltip: null,
    type: 'CUSTOM_MENU',
  },
  {
    action: '/teams',
    deviceType: 'MOBILE',
    displayOrder: 4,
    icon: 'FaUsers',
    name: 'Equipes',
    sectionName: null,
    tooltip: null,
    type: 'CUSTOM_MENU',
  },
];

@Injectable()
export class RegisterTenantUseCase {
  private readonly logger = new Logger(RegisterTenantUseCase.name);

  constructor(
    private readonly registry: TenantRegistryService,
    private readonly migrationService: TenantMigrationService,
    private readonly runner: TenantPrismaRunner,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async execute(dto: RegisterTenantDto): Promise<{ message: string }> {
    const schemaName = dto.cnpj;
    const existsSchema = await this.registry.schemaExistsOnDatabase(schemaName);
    const existsReg = await this.registry.isRegistered(schemaName);
    if (existsSchema || existsReg) {
      throw new ConflictException('Esta empresa já possui cadastro');
    }
    const url = this.config.get<string>('DATABASE_URL');
    if (!url) {
      throw new BadRequestException('DATABASE_URL não configurada');
    }
    let confirmationData: { token: string; email: string; fullName: string } | null = null;
    try {
      await this.migrationService.provisionNewTenant(schemaName);
      await this.runner.run(schemaName, async (tx) => {
        const profile = await tx.profile.create({
          data: {
            name: 'Administrador',
            description: 'Perfil com acesso total ao sistema',
            isDefault: true,
            isActive: true,
            updatedIn: null,
          },
        });
        const company = await tx.company.create({
          data: {
            name: dto.companyName,
            federalRegistration: formatCnpjDisplay(schemaName),
            isActive: true,
            updatedIn: null,
          },
        });
        const createdMenus: { id: string; action: string; deviceType: string }[] = [];
        for (const m of DEFAULT_MENUS) {
          const menu = await tx.menu.create({
            data: {
              action: m.action,
              deviceType: m.deviceType,
              displayOrder: m.displayOrder,
              icon: m.icon,
              name: m.name,
              sectionName: m.sectionName,
              tooltip: m.tooltip,
              type: m.type,
              isActive: true,
              updatedIn: null,
            },
          });
          createdMenus.push({ id: menu.id, action: m.action, deviceType: m.deviceType });
        }

        // Perfis adicionais com permissões granulares
        const desktopMenus = createdMenus.filter((m) => m.deviceType === 'DESKTOP');

        const gerenteProfile = await tx.profile.create({
          data: {
            name: 'Gerente',
            description: 'Gerencia supervisores e usuários, acesso total a usuários e leitura de perfis',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });

        const supervisorProfile = await tx.profile.create({
          data: {
            name: 'Supervisor',
            description: 'Gerencia usuários da equipe, pode criar e editar mas não excluir',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });

        const operadorProfile = await tx.profile.create({
          data: {
            name: 'Operador',
            description: 'Acesso somente leitura, visualiza colegas',
            isDefault: false,
            isActive: true,
            updatedIn: null,
          },
        });

        for (const menu of desktopMenus) {
          const controller = menu.action.replace(/^\//, '');

          // Administrador: acesso total
          await tx.profilePermission.create({
            data: {
              profileId: profile.id,
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

          // Gerente: CRUD em users e teams, leitura em profiles
          await tx.profilePermission.create({
            data: {
              profileId: gerenteProfile.id,
              menuId: menu.id,
              controller,
              canCreate: controller === 'users' || controller === 'teams',
              canUpdate: controller === 'users' || controller === 'teams',
              canDelete: controller === 'users' || controller === 'teams',
              canFind: true,
              canFindAll: true,
              updatedIn: null,
            },
          });

          // Supervisor: cria e edita users, leitura em teams, sem excluir
          await tx.profilePermission.create({
            data: {
              profileId: supervisorProfile.id,
              menuId: menu.id,
              controller,
              canCreate: controller === 'users',
              canUpdate: controller === 'users',
              canDelete: false,
              canFind: true,
              canFindAll: true,
              updatedIn: null,
            },
          });

          // Operador: somente leitura em users
          await tx.profilePermission.create({
            data: {
              profileId: operadorProfile.id,
              menuId: menu.id,
              controller,
              canCreate: false,
              canUpdate: false,
              canDelete: false,
              canFind: controller === 'users',
              canFindAll: controller === 'users',
              updatedIn: null,
            },
          });
        }
        const hashed = await bcrypt.hash(dto.password, 10);
        const user = await tx.user.create({
          data: {
            email: dto.email,
            fullName: dto.fullName,
            password: hashed,
            profileId: profile.id,
            companyId: company.id,
            isActive: false,
            updatedIn: null,
          },
        });

        const resetToken = crypto.randomUUID();
        await tx.userPasswordResetRequest.create({
          data: {
            resetToken,
            expiresIn: DateUtil.addHours(DateUtil.now(), 24),
            isUsed: false,
            requestIn: DateUtil.now(),
            userId: user.id,
          },
        });

        confirmationData = { token: resetToken, email: dto.email, fullName: dto.fullName };
      });
      await this.registry.register(schemaName, dto.companyName);

      if (confirmationData) {
        try {
          await this.emailService.sendWelcomeEmail(
            confirmationData.email,
            confirmationData.fullName,
            confirmationData.token,
            schemaName,
          );
        } catch (error) {
          this.logger.error('Erro ao enviar email de confirmação:', error);
          this.logger.warn(
            `URL de ativação: ${this.config.get('FRONTEND_URL') || 'http://localhost:8080'}/activate/${confirmationData.token}?cnpj=${schemaName}`,
          );
        }
      }
    } catch (e) {
      await dropTenantSchema(url, schemaName).catch(() => undefined);
      await this.registry.cleanupFailedProvision(schemaName).catch(() => undefined);
      throw e;
    }
    return { message: 'Cadastro realizado com sucesso. Verifique seu e-mail para ativar a conta.' };
  }
}
