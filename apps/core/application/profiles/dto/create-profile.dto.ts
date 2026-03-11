import { IsString, MinLength, MaxLength, IsArray, ValidateNested, IsOptional, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { ProfilePermissionDto } from './profile-permission.dto';

export class CreateProfileDto {
  @ApiProperty({
    description: 'Nome do perfil',
    example: 'Administrador',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Descrição do perfil',
    example: 'Perfil com acesso total ao sistema',
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @MinLength(10, { message: 'Descrição deve ter pelo menos 10 caracteres' })
  description: string;


  @ApiProperty({
    description: 'Lista de permissões do perfil',
    type: [ProfilePermissionDto],
    example: [
      {
        controller: 'users',
        canCreate: true,
        canUpdate: true,
        canDelete: false,
        canFind: true,
        canFindAll: true
      }
    ],
  })
  @IsArray({ message: 'Permissions deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => ProfilePermissionDto)
  @IsOptional()
  permissions?: ProfilePermissionDto[];
}






