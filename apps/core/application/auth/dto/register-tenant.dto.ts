import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';

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
  companyName: string;

  @ApiProperty({ example: 'João Silva' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: 'admin@empresa.com.br' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senhaSegura1' })
  @IsString()
  @MinLength(6)
  password: string;
}
