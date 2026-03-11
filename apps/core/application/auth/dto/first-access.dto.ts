import { IsEmail, IsString, MinLength, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class AuthDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123', minLength: 6 })
  @IsString()
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  password: string;
}

export class FirstAccessDto {
  @ApiProperty({ type: AuthDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AuthDto)
  auth: AuthDto;

  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  resetToken: string;
}
