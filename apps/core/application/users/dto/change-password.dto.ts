import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'senhaAtual123',
    minLength: 6,
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @MinLength(6, { message: 'Senha atual deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Senha atual deve ter no máximo 100 caracteres' })
  oldPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'novaSenha123',
    minLength: 6,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'Nova senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Nova senha deve ter no máximo 100 caracteres' })
  newPassword: string;
}






