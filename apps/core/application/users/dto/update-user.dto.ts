import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  @MaxLength(254, { message: 'Email deve ter no máximo 254 caracteres' })
  email?: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome completo deve ser uma string' })
  @MinLength(2, { message: 'Nome completo deve ter pelo menos 2 caracteres' })
  @MaxLength(120, { message: 'Nome completo deve ter no máximo 120 caracteres' })
  fullName?: string;

  @ApiProperty({
    description: 'ID do perfil do usuário',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do perfil deve ser um UUID válido' })
  profileId?: string;

  @ApiProperty({
    description: 'ID da empresa do usuário',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID da empresa deve ser um UUID válido' })
  companyId?: string;

  @ApiProperty({
    description: 'URL da imagem de perfil',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Imagem de perfil deve ser uma string' })
  @MaxLength(255, { message: 'Imagem de perfil deve ter no máximo 255 caracteres' })
  profileImage?: string;
}






