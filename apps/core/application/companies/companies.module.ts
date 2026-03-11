import { Module } from '@nestjs/common';
import { CompanyService } from './services/company.service';
import { CreateCompanyUseCase } from './use-cases/create-company.use-case';
import { GetCompanyUseCase } from './use-cases/get-company.use-case';
import { UpdateCompanyUseCase } from './use-cases/update-company.use-case';
import { DeleteCompanyUseCase } from './use-cases/delete-company.use-case';
import { ListCompaniesUseCase } from './use-cases/list-companies.use-case';
import { CompanyRepository } from '@common/database/persistence/repositories/company.repository';
import { CompaniesController } from '@common/http/controllers/companies.controller';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PrismaModule } from '@common/database/persistence/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CompaniesController],
  providers: [
    CompanyService,
    CreateCompanyUseCase,
    GetCompanyUseCase,
    UpdateCompanyUseCase,
    DeleteCompanyUseCase,
    ListCompaniesUseCase,
    JwtAuthGuard,
    {
      provide: 'CompanyRepository',
      useClass: CompanyRepository,
    },
  ],
  exports: [CompanyService],
})
export class CompaniesModule {}
