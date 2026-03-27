import { IsString, Length } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IsValidCnpj } from '@common/utils/is-valid-cnpj.decorator';

export class FirstAccessDto {
  @ApiProperty({ description: 'CNPJ da empresa (14 dígitos, válido)' })
  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\D/g, '') : value))
  @IsString()
  @Length(14, 14, { message: 'CNPJ deve ter 14 dígitos' })
  @IsValidCnpj()
  cnpj: string;

  @ApiProperty({ description: 'Token recebido por e-mail' })
  @IsString()
  resetToken: string;
}
