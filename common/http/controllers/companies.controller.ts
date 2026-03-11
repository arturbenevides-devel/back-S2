import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { CompanyService } from '@apps/core/application/companies/services/company.service';
import { CreateCompanyDto } from '@apps/core/application/companies/dto/create-company.dto';
import { UpdateCompanyDto } from '@apps/core/application/companies/dto/update-company.dto';
import { CompanyResponseDto } from '@apps/core/application/companies/dto/company-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('companies')
@Controller('companies')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class CompaniesController {
  constructor(private readonly companyService: CompanyService) {}

  @Post()
  @ApiOperation({ summary: 'Criar uma nova empresa' })
  @ApiResponse({ status: 201, description: 'Empresa criada com sucesso', type: CompanyResponseDto })
  @ApiResponse({ status: 409, description: 'Empresa com este CNPJ já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async create(@Body() dto: CreateCompanyDto): Promise<CompanyResponseDto> {
    return this.companyService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar todas as empresas' })
  @ApiResponse({ status: 200, description: 'Lista de empresas', type: [CompanyResponseDto] })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async findAll(): Promise<CompanyResponseDto[]> {
    return this.companyService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar empresa por ID' })
  @ApiParam({ name: 'id', description: 'ID único da empresa', example: 'clx1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Empresa encontrada', type: CompanyResponseDto })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async findOne(@Param('id') id: string): Promise<CompanyResponseDto> {
    return this.companyService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Atualizar empresa' })
  @ApiParam({ name: 'id', description: 'ID único da empresa', example: 'clx1234567890abcdef' })
  @ApiResponse({ status: 200, description: 'Empresa atualizada', type: CompanyResponseDto })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 409, description: 'Empresa com este CNPJ já existe' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    return this.companyService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover empresa (soft delete)' })
  @ApiParam({ name: 'id', description: 'ID único da empresa', example: 'clx1234567890abcdef' })
  @ApiResponse({ status: 204, description: 'Empresa removida com sucesso' })
  @ApiResponse({ status: 404, description: 'Empresa não encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.companyService.remove(id);
  }
}
