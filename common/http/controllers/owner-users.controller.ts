import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { OwnerOnly } from '@common/utils/decorators/owner-only.decorator';
import { OwnerUsersService, OwnerUserResponse } from '@apps/core/application/owner/services/owner-users.service';
import { CreateOwnerDto } from '@apps/core/application/owner/dto/create-owner.dto';

@ApiTags('owner')
@ApiBearerAuth('JWT-auth')
@Controller('owner/users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class OwnerUsersController {
  constructor(private readonly ownerUsersService: OwnerUsersService) {}

  @Get()
  @OwnerOnly()
  @ApiOperation({ summary: 'Listar todos os owners (somente Owner)' })
  async list(): Promise<OwnerUserResponse[]> {
    return this.ownerUsersService.list();
  }

  @Post()
  @OwnerOnly()
  @ApiOperation({ summary: 'Criar novo owner (somente Owner)' })
  async create(@Body() dto: CreateOwnerDto): Promise<OwnerUserResponse> {
    return this.ownerUsersService.create(dto.email, dto.fullName, dto.password);
  }

  @Delete(':id')
  @OwnerOnly()
  @ApiOperation({ summary: 'Desativar um owner (somente Owner)' })
  @ApiParam({ name: 'id', description: 'ID do owner' })
  async deactivate(@Param('id') id: string): Promise<{ message: string }> {
    return this.ownerUsersService.deactivate(id);
  }
}
