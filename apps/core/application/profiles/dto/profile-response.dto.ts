import { ApiProperty } from '@nestjs/swagger';

export class ProfileMenuPermissionDto {
  @ApiProperty() canCreate: boolean;
  @ApiProperty() canUpdate: boolean;
  @ApiProperty() canDelete: boolean;
  @ApiProperty() canFind: boolean;
  @ApiProperty() canFindAll: boolean;
}

export class ProfileMenuResponseDto {
  @ApiProperty({ description: 'UUID do menu' }) id: string;
  @ApiProperty() name: string;
  @ApiProperty() type: string;
  @ApiProperty({ required: false }) action?: string;
  @ApiProperty({ required: false }) deviceType?: string;
  @ApiProperty({ required: false }) displayOrder?: number;
  @ApiProperty({ required: false }) icon?: string;
  @ApiProperty({ required: false }) sectionName?: string;
  @ApiProperty({ required: false }) tooltip?: string;
  @ApiProperty({ type: [ProfileMenuPermissionDto], description: 'Permissões do perfil para este menu' })
  permissions: ProfileMenuPermissionDto[];
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'ID único do perfil',
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
    description: 'Status ativo do perfil',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data da última atualização do perfil',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedIn: Date;

  @ApiProperty({
    description: 'Indica se é o perfil padrão (administrador)',
    example: false,
  })
  isDefault: boolean;

  @ApiProperty({
    description: 'Menus com permissões do perfil (para edição)',
    type: [ProfileMenuResponseDto],
    required: false,
  })
  menuResponses?: ProfileMenuResponseDto[];
}






