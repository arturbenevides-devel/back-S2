import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID, IsArray } from 'class-validator';

export class UpdateTeamDto {
  @ApiProperty({
    description: 'Nome da equipe',
    example: 'Equipe Comercial',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name?: string;

  @ApiProperty({
    description: 'ID do supervisor da equipe',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do supervisor deve ser um UUID válido' })
  supervisorId?: string | null;

  @ApiProperty({
    description: 'IDs dos membros da equipe',
    example: ['uuid1', 'uuid2'],
    required: false,
  })
  @IsOptional()
  @IsArray({ message: 'memberIds deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada membro deve ser um UUID válido' })
  memberIds?: string[];
}
