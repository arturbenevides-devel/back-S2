import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UpdateTenantDto {
  @ApiProperty({ example: 'Nova Razão Social LTDA' })
  @IsString()
  @MinLength(2)
  companyName: string;
}
