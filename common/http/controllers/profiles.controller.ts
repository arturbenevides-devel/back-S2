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
import { ProfileService } from '@apps/core/application/profiles/services/profile.service';
import { CreateProfileDto } from '@apps/core/application/profiles/dto/create-profile.dto';
import { UpdateProfileDto } from '@apps/core/application/profiles/dto/update-profile.dto';
import { ProfileResponseDto } from '@apps/core/application/profiles/dto/profile-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { AccessControl } from '@common/utils/decorators/access-control.decorator';

@ApiTags('profiles')
@Controller('profiles')
export class ProfilesController {
  constructor(private readonly profileService: ProfileService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { create: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar um novo perfil' })
  @ApiResponse({
    status: 201,
    description: 'Perfil criado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Perfil com este nome já existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async create(@Body() createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
    return this.profileService.create(createProfileDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os perfis (qualquer usuário autenticado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de perfis retornada com sucesso',
    type: [ProfileResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido ou vencido',
  })
  async findAll(): Promise<ProfileResponseDto[]> {
    return this.profileService.findAll();
  }

  @Post('status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { update: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar ou desativar perfil' })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
    schema: { type: 'object', properties: { id: { type: 'string' }, isActive: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 404, description: 'Perfil não encontrado' })
  @ApiResponse({ status: 403, description: 'Token JWT inválido ou sem permissão' })
  async updateStatus(
    @Body() body: { id: string; status: boolean },
  ): Promise<{ id: string; isActive: boolean }> {
    return this.profileService.updateStatus(body.id, body.status);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { find: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar perfil por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único do perfil',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil encontrado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async findOne(@Param('id') id: string): Promise<ProfileResponseDto> {
    return this.profileService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { update: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar perfil' })
  @ApiParam({
    name: 'id',
    description: 'ID único do perfil',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Perfil com este nome já existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async update(
    @Param('id') id: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<ProfileResponseDto> {
    return this.profileService.update(id, updateProfileDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { delete: true } })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover perfil' })
  @ApiParam({
    name: 'id',
    description: 'ID único do perfil',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Perfil removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Perfil não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.profileService.remove(id);
  }
}



