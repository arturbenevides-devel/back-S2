import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { OwnerOnly } from '@common/utils/decorators/owner-only.decorator';
import { OwnerTenantsService, TenantSummary } from '@apps/core/application/owner/services/owner-tenants.service';
import { RegisterTenantUseCase } from '@apps/core/application/auth/use-cases/register-tenant.use-case';
import { RegisterTenantDto } from '@apps/core/application/auth/dto/register-tenant.dto';
import { UpdateTenantDto } from '@apps/core/application/owner/dto/update-tenant.dto';

@ApiTags('owner')
@ApiBearerAuth('JWT-auth')
@Controller('owner/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OwnerTenantsController {
  constructor(
    private readonly tenantsService: OwnerTenantsService,
    private readonly registerTenantUseCase: RegisterTenantUseCase,
  ) {}

  @Get()
  @OwnerOnly()
  @ApiOperation({ summary: 'Listar todos os tenants (somente Owner)' })
  async listTenants(): Promise<TenantSummary[]> {
    return this.tenantsService.listTenants();
  }

  @Get(':cnpj')
  @OwnerOnly()
  @ApiOperation({ summary: 'Detalhes de um tenant (somente Owner)' })
  @ApiParam({ name: 'cnpj', description: 'CNPJ (14 dígitos) do tenant' })
  async getTenant(@Param('cnpj') cnpj: string): Promise<TenantSummary> {
    return this.tenantsService.getTenant(cnpj);
  }

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Criar novo tenant (somente Owner)' })
  async createTenant(@Body() dto: RegisterTenantDto): Promise<{ message: string }> {
    return this.registerTenantUseCase.execute(dto);
  }

  @Put(':cnpj')
  @OwnerOnly()
  @ApiOperation({ summary: 'Atualizar tenant (somente Owner)' })
  @ApiParam({ name: 'cnpj', description: 'CNPJ (14 dígitos) do tenant' })
  async updateTenant(
    @Param('cnpj') cnpj: string,
    @Body() dto: UpdateTenantDto,
  ): Promise<TenantSummary> {
    return this.tenantsService.updateTenant(cnpj, dto.companyName);
  }

  @Post(':cnpj/seed-profiles')
  @OwnerOnly()
  @ApiOperation({ summary: 'Criar perfis padrão no tenant (idempotente, somente Owner)' })
  @ApiParam({ name: 'cnpj', description: 'CNPJ (14 dígitos) do tenant' })
  async seedProfiles(@Param('cnpj') cnpj: string): Promise<{ created: string[] }> {
    return this.tenantsService.seedDefaultProfiles(cnpj);
  }

  @Delete(':cnpj')
  @OwnerOnly()
  @ApiOperation({ summary: 'Excluir tenant e todos os dados (somente Owner)' })
  @ApiParam({ name: 'cnpj', description: 'CNPJ (14 dígitos) do tenant' })
  async deleteTenant(@Param('cnpj') cnpj: string): Promise<{ message: string }> {
    await this.tenantsService.deleteTenant(cnpj);
    return { message: 'Tenant excluído com sucesso' };
  }
}
