import { IsString, Length, IsOptional, MinLength, Matches } from 'class-validator';
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

  @ApiProperty({ description: 'Nova senha (obrigatória para usuários sem senha definida)', required: false })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/, {
    message: 'Senha deve conter maiúscula, minúscula, número e caractere especial',
  })
  password?: string;

  @ApiProperty({ description: 'Confirmação de senha', required: false })
  @IsOptional()
  @IsString()
  passwordConfirmation?: string;
}
