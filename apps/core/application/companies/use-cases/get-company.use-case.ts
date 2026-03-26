import { Injectable, NotFoundException } from '@nestjs/common';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class GetCompanyUseCase {
  constructor(private readonly runner: TenantPrismaRunner) {}

  async execute(id: string): Promise<CompanyResponseDto> {
    const c = await this.runner.run(getRequiredTenantSchema(), (tx) =>
      tx.company.findFirst({ where: { id, isActive: true } }),
    );
    if (!c) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return {
      id: c.id,
      name: c.name,
      federalRegistration: c.federalRegistration,
      createdIn: c.createdIn,
      isActive: c.isActive,
      updatedIn: c.updatedIn,
      phone: c.phone,
      email: c.email,
      website: c.website,
      address: c.address,
      logo: c.logo,
      primaryColor: c.primaryColor,
      secondaryColor: c.secondaryColor,
      footerText: c.footerText,
      termsText: c.termsText,
    };
  }
}
