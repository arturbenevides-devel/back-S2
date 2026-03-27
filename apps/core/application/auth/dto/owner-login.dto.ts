import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OwnerLoginDto {
  @ApiProperty({
    description: 'Email do owner',
    example: 'owner@s2viagens.com',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do owner',
    example: 'Senha@123',
    minLength: 8,
  })
  @IsString()
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;
}
