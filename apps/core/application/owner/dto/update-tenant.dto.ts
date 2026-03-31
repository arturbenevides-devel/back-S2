import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength, MaxLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Nova Razão Social LTDA' })
  @IsString()
  @MinLength(2)
  @MaxLength(150, { message: 'Nome da empresa deve ter no máximo 150 caracteres' })
  companyName: string;
}
