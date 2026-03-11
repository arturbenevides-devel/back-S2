import { Controller, Post, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { AuthService } from '@apps/core/application/auth/services/auth.service';
import { LoginDto } from '@apps/core/application/auth/dto/login.dto';
import { AuthResponseDto } from '@apps/core/application/auth/dto/auth-response.dto';
import { FirstAccessDto } from '@apps/core/application/auth/dto/first-access.dto';
import { ValidateResetTokenUseCase } from '@apps/core/application/auth/use-cases/validate-reset-token.use-case';
import { FirstAccessUseCase } from '@apps/core/application/auth/use-cases/first-access.use-case';
import { ChangePasswordByTokenUseCase } from '@apps/core/application/auth/use-cases/change-password-by-token.use-case';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly validateResetTokenUseCase: ValidateResetTokenUseCase,
    private readonly firstAccessUseCase: FirstAccessUseCase,
    private readonly changePasswordByTokenUseCase: ChangePasswordByTokenUseCase,
  ) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fazer login e obter token JWT' })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciais inválidas',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos',
  })
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(loginDto);
  }

  @Post('validate-reset-token/:token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validar token de ativação/recuperação e retornar e-mail e se é primeiro acesso' })
  @ApiParam({ name: 'token', description: 'Token recebido por e-mail' })
  @ApiResponse({
    status: 200,
    description: 'Token válido',
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        email: { type: 'string' },
        firstAccess: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Token não encontrado' })
  @ApiResponse({ status: 400, description: 'Token inválido ou expirado' })
  async validateResetToken(
    @Param('token') token: string,
  ): Promise<{ userId: string; email: string; firstAccess: boolean }> {
    return this.validateResetTokenUseCase.execute(token);
  }

  @Post('first-access')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Primeiro acesso: ativar conta e definir senha (token de criação de usuário)' })
  @ApiResponse({
    status: 200,
    description: 'Conta ativada com sucesso',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou token inválido' })
  @ApiResponse({ status: 404, description: 'Token ou usuário não encontrado' })
  async firstAccess(@Body() dto: FirstAccessDto): Promise<{ message: string }> {
    return this.firstAccessUseCase.execute(dto);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Alterar senha por token (recuperação de senha)' })
  @ApiResponse({
    status: 200,
    description: 'Senha alterada com sucesso',
    schema: { type: 'object', properties: { message: { type: 'string' } } },
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos ou token inválido' })
  @ApiResponse({ status: 404, description: 'Token ou usuário não encontrado' })
  async changePasswordByToken(@Body() dto: FirstAccessDto): Promise<{ message: string }> {
    return this.changePasswordByTokenUseCase.execute(dto);
  }
}



