import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { CompanyRepository as ICompanyRepository } from '@common/domain/companies/repositories/company.repository.interface';
import { Company } from '@common/domain/companies/entities/company.entity';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class CompanyRepository implements ICompanyRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async findById(id: string): Promise<Company | null> {
    return this.run(async (tx) => {
      const company = await tx.company.findFirst({
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
    });
  }

  async findByFederalRegistration(federalRegistration: string): Promise<Company | null> {
    return this.run(async (tx) => {
      const company = await tx.company.findFirst({
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
    });
  }

  async save(company: Company): Promise<Company> {
    return this.run(async (tx) => {
      const created = await tx.company.create({
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
    });
  }

  async update(company: Company): Promise<Company> {
    return this.run(async (tx) => {
      await tx.company.update({
        where: { id: company.id },
        data: {
          name: company.name,
          federalRegistration: company.federalRegistration,
          isActive: company.isActive,
          updatedIn: company.updatedIn,
        },
      });
      return company;
    });
  }

  async delete(id: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.company.delete({ where: { id } });
    });
  }

  async findAll(): Promise<Company[]> {
    return this.run(async (tx) => {
      const list = await tx.company.findMany({
        where: { isActive: true },
        orderBy: { createdIn: 'desc' },
      });
      return list.map((c) =>
        Company.fromDatabase(
          c.name,
          c.federalRegistration,
          c.id,
          c.createdIn,
          c.isActive,
          c.updatedIn,
        ),
      );
    });
  }
}
