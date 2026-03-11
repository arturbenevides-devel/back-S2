import { ApiProperty } from '@nestjs/swagger';
import { UserProfileResponseDto } from './user-profile-response.dto';

export class UserResponseDto {
  @ApiProperty({
    description: 'ID único do usuário',
    example: 'clx1234567890abcdef',
  })
  id: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
  })
  email: string;

  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
  })
  fullName: string;

  @ApiProperty({
    description: 'URL da imagem de perfil',
    example: 'https://example.com/profile.jpg',
    required: false,
  })
  profileImage?: string;

  @ApiProperty({
    description: 'ID da empresa do usuário',
    example: 'clx1234567890abcdef',
    required: false,
  })
  companyId?: string;

  @ApiProperty({
    description: 'Data de criação do usuário',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdIn: Date;

  @ApiProperty({
    description: 'Status ativo do usuário',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Data da última atualização do usuário',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedIn: Date;

  @ApiProperty({
    description: 'Perfil do usuário',
    type: UserProfileResponseDto,
  })
  profile: UserProfileResponseDto;
}






