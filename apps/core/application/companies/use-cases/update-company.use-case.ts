import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { CompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { Company } from '@common/domain/companies/entities/company.entity';
import { UpdateCompanyDto } from '../dto/update-company.dto';
import { CompanyResponseDto } from '../dto/company-response.dto';

@Injectable()
export class UpdateCompanyUseCase {
  constructor(
    @Inject('CompanyRepository')
    private readonly companyRepository: CompanyRepository,
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
      const updated = await this.companyRepository.update(company);
      return {
        id: updated.id,
        name: updated.name,
        federalRegistration: updated.federalRegistration,
        createdIn: updated.createdIn,
        isActive: updated.isActive,
        updatedIn: updated.updatedIn,
      };
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Empresa com este CNPJ já existe');
      }
      throw error;
    }
  }
}
