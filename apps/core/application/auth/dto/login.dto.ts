import { IsEmail, IsString, MinLength, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';

export class LoginDto {
  @ApiProperty({
    description: 'CNPJ da empresa (14 dígitos, válido)',
    example: '04252011000110',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @IsValidCnpj()
  cnpj: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@develcode.com.br',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'Senha@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;
}






