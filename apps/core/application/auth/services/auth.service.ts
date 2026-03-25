import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { LoginDto } from '../dto/login.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';
import { TenantRegistryService } from '@common/tenant/tenant-registry.service';
import { runWithTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    private readonly tenantRegistry: TenantRegistryService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const registered = await this.tenantRegistry.isRegistered(loginDto.cnpj);
    if (!registered) {
      throw new UnauthorizedException('Empresa não encontrada ou não cadastrada');
    }

    return runWithTenantSchema(loginDto.cnpj, async () => {
      const user = await this.userRepository.findByEmailIncludingInactive(loginDto.email);

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Conta não confirmada. Verifique seu email para ativar a conta.',
        );
      }

      const profile = await this.profileRepository.findById(user.profileId);

      if (!profile) {
        throw new UnauthorizedException('Perfil não encontrado');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        profileId: user.profileId,
        profileName: profile.name,
        tenantSchema: loginDto.cnpj,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 86400,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          profileId: user.profileId,
          profileName: profile.name,
          profileIsDefault: profile.isDefault,
        },
      };
    });
  }
}
