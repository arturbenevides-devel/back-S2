import { Injectable, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { Company } from '@common/domain/companies/entities/company.entity';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class CreateCompanyUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    const existing = await this.companyRepository.findByFederalRegistration(dto.federalRegistration);
    if (existing) {
      throw new ConflictException('Empresa com este CNPJ já existe');
    }

    const company = Company.create(dto.name, dto.federalRegistration);
    try {
      const saved = await this.companyRepository.save(company);
      return this.mapToResponse(saved);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Empresa com este CNPJ já existe');
      }
      throw error;
    }
  }

  private mapToResponse(company: Company): CompanyResponseDto {
    return {
      id: company.id,
      name: company.name,
      federalRegistration: company.federalRegistration,
      createdIn: company.createdIn,
      isActive: company.isActive,
      updatedIn: company.updatedIn,
    };
  }
}
