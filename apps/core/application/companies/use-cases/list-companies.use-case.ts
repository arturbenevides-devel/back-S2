import { Injectable } from '@nestjs/common';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class ListCompaniesUseCase {
  constructor(private readonly runner: TenantPrismaRunner) {}

  async execute(): Promise<CompanyResponseDto[]> {
    const companies = await this.runner.run(getRequiredTenantSchema(), (tx) =>
      tx.company.findMany({ where: { isActive: true }, orderBy: { createdIn: 'desc' } }),
    );
    return companies.map((c) => ({
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
    }));
  }
}
