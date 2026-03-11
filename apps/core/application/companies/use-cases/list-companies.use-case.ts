import { Injectable, Inject } from '@nestjs/common';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class ListCompaniesUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(): Promise<CompanyResponseDto[]> {
    const companies = await this.companyRepository.findAll();
    return companies.map(c => ({
      id: c.id,
      name: c.name,
      federalRegistration: c.federalRegistration,
      createdIn: c.createdIn,
      isActive: c.isActive,
      updatedIn: c.updatedIn,
    }));
  }
}
