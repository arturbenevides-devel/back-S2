import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
    private readonly runner: TenantPrismaRunner,
  ) {}

  async execute(id: string, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }

    if (dto.name !== undefined) {
      company.updateName(dto.name);
    }
    if (dto.federalRegistration !== undefined && dto.federalRegistration !== company.federalRegistration) {
      const existing = await this.companyRepository.findByFederalRegistration(dto.federalRegistration);
      if (existing) {
        throw new ConflictException('Empresa com este CNPJ já existe');
      }
      company.updateFederalRegistration(dto.federalRegistration);
    }

    try {
      await this.companyRepository.update(company);

      // Branding fields — update directly via Prisma
      const brandingData: Record<string, unknown> = {};
      if (dto.phone !== undefined) brandingData.phone = dto.phone;
      if (dto.email !== undefined) brandingData.email = dto.email;
      if (dto.website !== undefined) brandingData.website = dto.website;
      if (dto.address !== undefined) brandingData.address = dto.address;
      if (dto.logo !== undefined) brandingData.logo = dto.logo;
      if (dto.primaryColor !== undefined) brandingData.primaryColor = dto.primaryColor;
      if (dto.secondaryColor !== undefined) brandingData.secondaryColor = dto.secondaryColor;
      if (dto.footerText !== undefined) brandingData.footerText = dto.footerText;
      if (dto.termsText !== undefined) brandingData.termsText = dto.termsText;

      let result: any;
      if (Object.keys(brandingData).length > 0) {
        result = await this.runner.run(getRequiredTenantSchema(), (tx) =>
          tx.company.update({ where: { id }, data: brandingData }),
        );
      } else {
        result = await this.runner.run(getRequiredTenantSchema(), (tx) =>
          tx.company.findUnique({ where: { id } }),
        );
      }

      return {
        id: result.id,
        name: result.name,
        federalRegistration: result.federalRegistration,
        createdIn: result.createdIn,
        isActive: result.isActive,
        updatedIn: result.updatedIn,
        phone: result.phone,
        email: result.email,
        website: result.website,
        address: result.address,
        logo: result.logo,
        primaryColor: result.primaryColor,
        secondaryColor: result.secondaryColor,
        footerText: result.footerText,
        termsText: result.termsText,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Empresa com este CNPJ já existe');
      }
      throw error;
    }
  }
}
