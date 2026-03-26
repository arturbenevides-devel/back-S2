import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength, IsOptional, IsUUID } from 'class-validator';

export class CreateTeamDto {
  @ApiProperty({
    description: 'Nome da equipe',
    example: 'Equipe Comercial',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(255, { message: 'Nome deve ter no máximo 255 caracteres' })
  name: string;

  @ApiProperty({
    description: 'ID do supervisor da equipe',
    example: 'clx1234567890abcdef',
    required: false,
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do supervisor deve ser um UUID válido' })
  supervisorId?: string;
}
