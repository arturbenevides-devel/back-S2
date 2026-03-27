import { IsString, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetMyPasswordDto {
  @ApiProperty({
    description: 'Nova senha',
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
