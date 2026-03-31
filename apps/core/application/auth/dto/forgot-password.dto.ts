import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';

export class ForgotPasswordDto {
  @ApiProperty({ example: '04252011000110' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @IsValidCnpj()
  cnpj: string;

  @ApiProperty({ example: 'usuario@empresa.com' })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(254, { message: 'Email deve ter no máximo 254 caracteres' })
  email: string;
}
