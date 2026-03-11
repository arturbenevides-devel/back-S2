import { ApiProperty } from '@nestjs/swagger';

export class AuthResponseDto {
  @ApiProperty({
    description: 'Token JWT para autenticação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Tipo do token',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tempo de expiração em segundos',
    example: 86400,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Dados do usuário autenticado',
  })
  user: {
    id: string;
    email: string;
    fullName: string;
    profileId: string;
    profileName: string;
    /** Perfil padrão (admin): ignora checagem de permissões no front (menu e rotas) */
    profileIsDefault?: boolean;
  };
}






