import { IsString, IsBoolean, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ProfilePermissionDto {
  @ApiProperty({
    description: 'ID do menu',
    example: 'uuid-do-menu',
  })
  @IsString({ message: 'Menu ID deve ser uma string' })
  @IsNotEmpty({ message: 'Menu ID é obrigatório' })
  menuId: string;

  @ApiProperty({
    description: 'Pode criar registros',
    example: true,
  })
  @IsBoolean({ message: 'canCreate deve ser um boolean' })
  canCreate: boolean;

  @ApiProperty({
    description: 'Pode atualizar registros',
    example: true,
  })
  @IsBoolean({ message: 'canUpdate deve ser um boolean' })
  canUpdate: boolean;

  @ApiProperty({
    description: 'Pode deletar registros',
    example: false,
  })
  @IsBoolean({ message: 'canDelete deve ser um boolean' })
  canDelete: boolean;

  @ApiProperty({
    description: 'Pode buscar por ID',
    example: true,
  })
  @IsBoolean({ message: 'canFind deve ser um boolean' })
  canFind: boolean;

  @ApiProperty({
    description: 'Pode listar todos',
    example: true,
  })
  @IsBoolean({ message: 'canFindAll deve ser um boolean' })
  canFindAll: boolean;
}






