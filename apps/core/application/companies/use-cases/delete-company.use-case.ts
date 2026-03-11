import { Injectable, NotFoundException, Inject } from '@nestjs/common';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';

@Injectable()
export class DeleteCompanyUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const company = await this.companyRepository.findById(id);
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    company.deactivate();
    await this.companyRepository.update(company);
  }
}
