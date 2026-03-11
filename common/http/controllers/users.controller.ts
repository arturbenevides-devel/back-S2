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
  Request,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { UserService } from '@apps/core/application/users/services/user.service';
import { CreateUserDto } from '@apps/core/application/users/dto/create-user.dto';
import { UpdateUserDto } from '@apps/core/application/users/dto/update-user.dto';
import { ChangePasswordDto } from '@apps/core/application/users/dto/change-password.dto';
import { SetMyPasswordDto } from '@apps/core/application/users/dto/set-my-password.dto';
import { UserResponseDto } from '@apps/core/application/users/dto/user-response.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { PermissionGuard } from '../guards/permission.guard';
import { AccessControl } from '@common/utils/decorators/access-control.decorator';
import { ConfirmEmailUseCase } from '@apps/core/application/users/use-cases/confirm-email.use-case';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UserService,
    private readonly confirmEmailUseCase: ConfirmEmailUseCase,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { create: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Criar um novo usuário (requer autenticação)' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Usuário com este email já existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async create(@Body() createUserDto: CreateUserDto): Promise<UserResponseDto> {
    return this.userService.create(createUserDto);
  }

  @Get('confirm-email')
  @ApiOperation({ summary: 'Confirmar email do usuário (PÚBLICO)' })
  @ApiResponse({
    status: 200,
    description: 'Email confirmado com sucesso',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Token de confirmação não encontrado',
  })
  @ApiResponse({
    status: 400,
    description: 'Token de confirmação inválido ou expirado',
  })
  async confirmEmail(@Query('token') token: string): Promise<{ success: boolean; message: string }> {
    return this.confirmEmailUseCase.execute(token);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { findAll: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Listar todos os usuários (exclui o usuário logado)' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
    type: [UserResponseDto],
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async findAll(@Request() req: any): Promise<UserResponseDto[]> {
    const excludeUserId = req.user?.sub as string | undefined;
    return this.userService.findAll(excludeUserId);
  }

  @Post('status')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { update: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Ativar ou desativar usuário' })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
    schema: { type: 'object', properties: { id: { type: 'string' }, isActive: { type: 'boolean' } } },
  })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  @ApiResponse({ status: 403, description: 'Token JWT inválido ou sem permissão' })
  async updateStatus(
    @Body() body: { id: string; status: boolean },
  ): Promise<{ id: string; isActive: boolean }> {
    return this.userService.updateStatus(body.id, body.status);
  }

  @Get('my-profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar dados do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Dados do perfil retornados com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Token JWT inválido ou vencido' })
  async getMyProfile(@Request() req: any): Promise<UserResponseDto> {
    if (!req.user?.sub) {
      throw new Error('Token não contém sub (user ID)');
    }
    return this.userService.findOne(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { find: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário encontrado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async findOne(@Param('id') id: string): Promise<UserResponseDto> {
    return this.userService.findOne(id);
  }

  @Put('my-profile/password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Definir nova senha (meu perfil, sem senha atual)' })
  @ApiResponse({ status: 200, description: 'Senha atualizada com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 404, description: 'Usuário não encontrado' })
  async setMyPassword(
    @Body() dto: SetMyPasswordDto,
    @Request() req: any,
  ): Promise<void> {
    if (!req.user?.sub) {
      throw new Error('Token não contém sub (user ID)');
    }
    return this.userService.setMyPassword(req.user.sub, dto);
  }

  @Put('my-profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Atualizar meu perfil' })
  @ApiResponse({
    status: 200,
    description: 'Perfil atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Email já está em uso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token JWT inválido ou vencido',
  })
  @ApiBearerAuth('JWT-auth')
  async updateMyProfile(
    @Body() updateUserDto: UpdateUserDto,
    @Request() req: any,
  ): Promise<UserResponseDto> {
    if (!req.user?.sub) {
      throw new Error('Token não contém sub (user ID)');
    }
    
    return this.userService.updateMyProfile(req.user.sub, updateUserDto);
  }

  @Put('password')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Alterar senha do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  @ApiResponse({
    status: 401,
    description: 'Senha atual incorreta',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiBearerAuth('JWT-auth')
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Request() req: any,
  ): Promise<void> {
    if (!req.user?.sub) {
      throw new Error('Token não contém sub (user ID)');
    }
    
    return this.userService.changePassword(req.user.sub, changePasswordDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { update: true } })
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Atualizar usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 200,
    description: 'Usuário atualizado com sucesso',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 409,
    description: 'Usuário com este email já existe',
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
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionGuard)
  @AccessControl({ permissions: { delete: true } })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remover usuário' })
  @ApiParam({
    name: 'id',
    description: 'ID único do usuário',
    example: 'clx1234567890abcdef',
  })
  @ApiResponse({
    status: 204,
    description: 'Usuário removido com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Usuário não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Token JWT inválido, vencido ou sem permissão',
  })
  async remove(@Param('id') id: string): Promise<void> {
    return this.userService.remove(id);
  }
}




