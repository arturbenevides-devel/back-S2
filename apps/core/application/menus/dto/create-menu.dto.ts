import { IsString, IsEnum, IsNumber, IsOptional, MinLength, MaxLength, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DeviceType, MenuType } from '@common/domain/menus/entities/menu.entity';

export class CreateMenuDto {
  @ApiProperty({
    description: 'Ação/rota do menu',
    example: '/home',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Ação deve ser uma string' })
  @MinLength(1, { message: 'Ação deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Ação deve ter no máximo 255 caracteres' })
  action: string;

  @ApiProperty({
    description: 'Tipo de dispositivo (opcional - será criado para ambos se não informado)',
    example: 'DESKTOP',
    enum: DeviceType,
    required: false,
  })
  @IsOptional()
  @IsEnum(DeviceType, { message: 'Tipo de dispositivo deve ser DESKTOP ou MOBILE' })
  deviceType?: DeviceType;

  @ApiProperty({
    description: 'Ordem de exibição',
    example: 1,
    minimum: 1,
  })
  @IsNumber({}, { message: 'Ordem de exibição deve ser um número' })
  @Min(1, { message: 'Ordem de exibição deve ser pelo menos 1' })
  displayOrder: number;

  @ApiProperty({
    description: 'Ícone do menu',
    example: 'FaTachometerAlt',
    minLength: 1,
    maxLength: 50,
  })
  @IsString({ message: 'Ícone deve ser uma string' })
  @MinLength(1, { message: 'Ícone deve ter pelo menos 1 caractere' })
  @MaxLength(50, { message: 'Ícone deve ter no máximo 50 caracteres' })
  icon: string;

  @ApiProperty({
    description: 'Nome do menu',
    example: 'Início',
    minLength: 1,
    maxLength: 255,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(1, { message: 'Nome deve ter pelo menos 1 caractere' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'Nome da seção',
    example: 'Opções',
    required: false,
    maxLength: 50,
  })
  @IsOptional()
  @IsString({ message: 'Nome da seção deve ser uma string' })
  @MaxLength(50, { message: 'Nome da seção deve ter no máximo 50 caracteres' })
  sectionName?: string;

  @ApiProperty({
    description: 'Tooltip do menu',
    example: 'Acessar página inicial',
    required: false,
    maxLength: 255,
  })
  @IsOptional()
  @IsString({ message: 'Tooltip deve ser uma string' })
  @MaxLength(255, { message: 'Tooltip deve ter no máximo 255 caracteres' })
  tooltip?: string;

  @ApiProperty({
    description: 'Tipo do menu',
    example: 'ROOT_MENU',
    enum: MenuType,
    required: false,
  })
  @IsOptional()
  @IsEnum(MenuType, { message: 'Tipo do menu deve ser ROOT_MENU ou CUSTOM_MENU' })
  type?: MenuType;
}






