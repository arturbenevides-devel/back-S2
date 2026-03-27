import { IsEmail, IsString, MinLength, Matches, IsObject, ValidateNested, Length } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';

class AuthDto {
  @ApiProperty({ example: 'usuario@exemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Senha@123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  password: string;
}

export class FirstAccessDto {
  @ApiProperty({ description: 'CNPJ da empresa (14 dígitos, válido)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @IsValidCnpj()
  cnpj: string;

  @ApiProperty({ type: AuthDto })
  @IsObject()
  @ValidateNested()
  @Type(() => AuthDto)
  auth: AuthDto;

  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  resetToken: string;
}
