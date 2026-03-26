import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { AccessControl } from '@common/utils/decorators/access-control.decorator';
import { TeamService } from '@apps/core/application/teams/services/team.service';
import { CreateTeamDto } from '@apps/core/application/teams/dto/create-team.dto';
import { UpdateTeamDto } from '@apps/core/application/teams/dto/update-team.dto';
import { TeamResponseDto } from '@apps/core/application/teams/dto/team-response.dto';

@ApiTags('teams')
@Controller('teams')
export class TeamsController {
  constructor(private readonly teamService: TeamService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { create: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar nova equipe' })
  @ApiResponse({ status: 201, description: 'Equipe criada', type: TeamResponseDto })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async create(@Body() dto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.teamService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { findAll: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todas as equipes' })
  @ApiResponse({ status: 200, description: 'Equipes retornadas', type: [TeamResponseDto] })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async findAll(): Promise<TeamResponseDto[]> {
    return this.teamService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { find: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar equipe por ID' })
  @ApiParam({ name: 'id', description: 'ID da equipe' })
  @ApiResponse({ status: 200, description: 'Equipe encontrada', type: TeamResponseDto })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async findOne(@Param('id') id: string): Promise<TeamResponseDto> {
    return this.teamService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { update: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar equipe' })
  @ApiParam({ name: 'id', description: 'ID da equipe' })
  @ApiResponse({ status: 200, description: 'Equipe atualizada', type: TeamResponseDto })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTeamDto,
  ): Promise<TeamResponseDto> {
    return this.teamService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { delete: true } })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover equipe' })
  @ApiParam({ name: 'id', description: 'ID da equipe' })
  @ApiResponse({ status: 204, description: 'Equipe removida' })
  @ApiResponse({ status: 404, description: 'Equipe não encontrada' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async remove(@Param('id') id: string): Promise<void> {
    return this.teamService.remove(id);
  }
}
