import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength, Length, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';
import { IsValidCpf } from '@common/utils/is-valid-cpf.decorator';

export class RegisterTenantDto {
  @ApiProperty({ example: '04.252.011/0001-10' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @IsValidCnpj()
  cnpj: string;

  @ApiProperty({ example: 'Minha Empresa LTDA' })
  @IsString()
  @MinLength(2)
  @MaxLength(150, { message: 'Nome da empresa deve ter no máximo 150 caracteres' })
  companyName: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  @MaxLength(120, { message: 'Nome completo deve ter no máximo 120 caracteres' })
  fullName: string;

  @ApiProperty({ example: '123.456.789-09' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(11, 11, { message: 'CPF deve ter 11 dígitos' })
  @IsValidCpf()
  cpf: string;

  @ApiProperty({ example: 'admin@empresa.com.br' })
  @IsEmail()
  @MaxLength(254, { message: 'Email deve ter no máximo 254 caracteres' })
  email: string;

  @ApiProperty({ example: 'Senha@123' })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  password: string;
}
