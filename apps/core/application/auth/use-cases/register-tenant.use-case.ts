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
        for (const m of DEFAULT_MENUS) {
          await tx.menu.create({
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
