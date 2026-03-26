import { ApiProperty } from '@nestjs/swagger';

export class TeamMemberDto {
  @ApiProperty({ description: 'ID do usuário' })
  id: string;

  @ApiProperty({ description: 'Nome completo do usuário' })
  fullName: string;

  @ApiProperty({ description: 'Email do usuário' })
  email: string;

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;
}

export class TeamResponseDto {
  @ApiProperty({ description: 'ID da equipe' })
  id: string;

  @ApiProperty({ description: 'Nome da equipe' })
  name: string;

  @ApiProperty({ description: 'ID do supervisor', nullable: true })
  supervisorId: string | null;

  @ApiProperty({ description: 'Nome do supervisor', nullable: true })
  supervisorName: string | null;

  @ApiProperty({ description: 'Data de criação' })
  createdIn: Date;

  @ApiProperty({ description: 'Status ativo' })
  isActive: boolean;

  @ApiProperty({ description: 'Data da última atualização', nullable: true })
  updatedIn: Date | null;

  @ApiProperty({ description: 'Membros da equipe', type: [TeamMemberDto] })
  members: TeamMemberDto[];
}
