import { ApiProperty } from '@nestjs/swagger';

export class CompanyResponseDto {
  @ApiProperty({
    description: 'ID único da empresa',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nome da empresa',
    example: 'Develcode',
  })
  name: string;

  @ApiProperty({
    description: 'CNPJ da empresa',
    example: '21.153.354/0001-46',
  })
  federalRegistration: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdIn: Date;

  @ApiProperty({
    description: 'Status ativo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedIn: Date;

  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  logo?: string | null;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  footerText?: string | null;
  termsText?: string | null;
}
