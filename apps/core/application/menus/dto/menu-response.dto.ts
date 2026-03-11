import { ApiProperty } from '@nestjs/swagger';

export class MenuResponseDto {
  @ApiProperty({
    description: 'ID do menu',
    example: 'uuid-do-menu',
  })
  id: string;

  @ApiProperty({
    description: 'Ação/rota do menu',
    example: '/home',
  })
  action: string;

  @ApiProperty({
    description: 'Tipo de dispositivo',
    example: 'DESKTOP',
    enum: ['DESKTOP', 'MOBILE'],
  })
  deviceType: string;

  @ApiProperty({
    description: 'Ordem de exibição',
    example: 1,
  })
  displayOrder: number;

  @ApiProperty({
    description: 'Ícone do menu',
    example: 'FaTachometerAlt',
  })
  icon: string;

  @ApiProperty({
    description: 'Nome do menu',
    example: 'Início',
  })
  name: string;

  @ApiProperty({
    description: 'Nome da seção',
    example: 'Opções',
    required: false,
  })
  sectionName?: string;

  @ApiProperty({
    description: 'Tooltip do menu',
    example: 'Acessar página inicial',
    required: false,
  })
  tooltip?: string;

  @ApiProperty({
    description: 'Tipo do menu',
    example: 'ROOT_MENU',
    enum: ['ROOT_MENU', 'CUSTOM_MENU'],
  })
  type: string;

  @ApiProperty({
    description: 'Permissões do usuário para este menu (null para ROOT_MENU)',
    example: {
      canCreate: true,
      canUpdate: false,
      canDelete: false,
      canFind: true,
      canFindAll: false,
    },
    nullable: true,
  })
  permissions: {
    canCreate: boolean;
    canUpdate: boolean;
    canDelete: boolean;
    canFind: boolean;
    canFindAll: boolean;
  } | null;
}






