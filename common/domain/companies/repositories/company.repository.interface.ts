import { Company } from '../entities/company.entity';

export interface CompanyRepository {
  findById(id: string): Promise<Company | null>;
  findByFederalRegistration(federalRegistration: string): Promise<Company | null>;
  save(company: Company): Promise<Company>;
  update(company: Company): Promise<Company>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Company[]>;
}
