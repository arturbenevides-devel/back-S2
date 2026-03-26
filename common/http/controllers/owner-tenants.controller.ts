import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { OwnerOnly } from '@common/utils/decorators/owner-only.decorator';
import { OwnerTenantsService, TenantSummary } from '@apps/core/application/owner/services/owner-tenants.service';

@ApiTags('owner')
@ApiBearerAuth('JWT-auth')
@Controller('owner/tenants')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OwnerTenantsController {
  constructor(private readonly tenantsService: OwnerTenantsService) {}

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
}
