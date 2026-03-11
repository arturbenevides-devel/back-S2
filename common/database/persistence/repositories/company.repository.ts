import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CompanyRepository as ICompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { Company } from '@common/domain/companies/entities/company.entity';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Company | null> {
    const company = await this.prisma.company.findFirst({
      where: { id, isActive: true },
    });
    if (!company) return null;
    return Company.fromDatabase(
      company.name,
      company.federalRegistration,
      company.id,
      company.createdIn,
      company.isActive,
      company.updatedIn,
    );
  }

  async findByFederalRegistration(federalRegistration: string): Promise<Company | null> {
    const company = await this.prisma.company.findFirst({
      where: { federalRegistration, isActive: true },
    });
    if (!company) return null;
    return Company.fromDatabase(
      company.name,
      company.federalRegistration,
      company.id,
      company.createdIn,
      company.isActive,
      company.updatedIn,
    );
  }

  async save(company: Company): Promise<Company> {
    const created = await this.prisma.company.create({
      data: {
        name: company.name,
        federalRegistration: company.federalRegistration,
        createdIn: company.createdIn,
        isActive: company.isActive,
        updatedIn: company.updatedIn,
      },
    });
    return Company.fromDatabase(
      created.name,
      created.federalRegistration,
      created.id,
      created.createdIn,
      created.isActive,
      created.updatedIn,
    );
  }

  async update(company: Company): Promise<Company> {
    await this.prisma.company.update({
      where: { id: company.id },
      data: {
        name: company.name,
        federalRegistration: company.federalRegistration,
        isActive: company.isActive,
        updatedIn: company.updatedIn,
      },
    });
    return company;
  }

  async delete(id: string): Promise<void> {
    await this.prisma.company.delete({ where: { id } });
  }

  async findAll(): Promise<Company[]> {
    const list = await this.prisma.company.findMany({
      where: { isActive: true },
      orderBy: { createdIn: 'desc' },
    });
    return list.map(c =>
      Company.fromDatabase(
        c.name,
        c.federalRegistration,
        c.id,
        c.createdIn,
        c.isActive,
        c.updatedIn,
      ),
    );
  }
}
