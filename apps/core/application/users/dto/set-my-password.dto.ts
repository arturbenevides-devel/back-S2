import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SetMyPasswordDto {
  @ApiProperty({
    description: 'Nova senha',
    example: 'novaSenha123',
    minLength: 6,
  })
  @IsString({ message: 'Nova senha deve ser uma string' })
  @MinLength(6, { message: 'Nova senha deve ter pelo menos 6 caracteres' })
  @MaxLength(100, { message: 'Nova senha deve ter no máximo 100 caracteres' })
  newPassword: string;
}
