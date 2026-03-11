import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCompanyDto {
  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Develcode',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'CNPJ da empresa',
    example: '21.153.354/0001-46',
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  @MaxLength(18, { message: 'CNPJ deve ter no máximo 18 caracteres' })
  federalRegistration: string;
}
