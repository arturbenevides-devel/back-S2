import { ApiProperty } from '@nestjs/swagger';

export class UserProfileResponseDto {
  @ApiProperty({
    description: 'ID do perfil',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do perfil',
    example: 'Administrador',
  })
  name: string;

  @ApiProperty({
    description: 'Descrição do perfil',
    example: 'Perfil com acesso total ao sistema',
  })
  description: string;

  @ApiProperty({
    description: 'Data de criação do perfil',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdIn: Date;

  @ApiProperty({
    description: 'Indica se o perfil está ativo',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data da última atualização do perfil',
    example: '2024-01-01T00:00:00.000Z',
    nullable: true,
  })
  updatedIn: Date | null;

  @ApiProperty({
    description: 'Indica se é o perfil padrão (administrador)',
    example: true,
  })
  isDefault: boolean;
}






