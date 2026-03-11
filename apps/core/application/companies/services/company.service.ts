import { Injectable } from '@nestjs/common';
import { CreateCompanyUseCase } from '../use-cases/create-company.use-case';
import { GetCompanyUseCase } from '../use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from '../use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from '../use-cases/delete-company.use-case';
import { ListCompaniesUseCase } from '../use-cases/list-companies.use-case';
import { CreateCompanyDto } from '../dto/create-company.dto';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class CompanyService {
  constructor(
    private readonly createCompanyUseCase: CreateCompanyUseCase,
    private readonly getCompanyUseCase: GetCompanyUseCase,
    private readonly updateCompanyUseCase: UpdateCompanyUseCase,
    private readonly deleteCompanyUseCase: DeleteCompanyUseCase,
    private readonly listCompaniesUseCase: ListCompaniesUseCase,
  ) {}

  async create(dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.createCompanyUseCase.execute(dto);
  }

  async findOne(id: string): Promise<CompanyResponseDto> {
    return this.getCompanyUseCase.execute(id);
  }

  async update(id: string, dto: UpdateCompanyDto): Promise<CompanyResponseDto> {
    return this.updateCompanyUseCase.execute(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.deleteCompanyUseCase.execute(id);
  }

  async findAll(): Promise<CompanyResponseDto[]> {
    return this.listCompaniesUseCase.execute();
  }
}
