import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Senha atual do usuário',
    example: 'SenhaAtual@1',
    minLength: 8,
  })
  @IsString({ message: 'Senha atual deve ser uma string' })
  @MinLength(8, { message: 'Senha atual deve ter pelo menos 8 caracteres' })
  @MaxLength(100, { message: 'Senha atual deve ter no máximo 100 caracteres' })
  oldPassword: string;

  @ApiProperty({
    description: 'Nova senha do usuário',
    example: 'NovaSenha@1',
    minLength: 8,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(8, { message: 'Nova senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z\d\s])/, {
    message: 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial',
  })
  @MaxLength(100, { message: 'Nova senha deve ter no máximo 100 caracteres' })
  newPassword: string;
}






