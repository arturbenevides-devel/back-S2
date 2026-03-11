import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class GetCompanyUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(id: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
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
