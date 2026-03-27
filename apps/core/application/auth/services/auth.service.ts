import { Injectable, UnauthorizedException, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { OwnerUserRepository } from '@common/domain/owner/repositories/owner-user.repository.interface';
import { SystemRole, OWNER_SENTINEL } from '@common/utils/decorators/access-control.decorator';
import { LoginDto } from '../dto/login.dto';
import { OwnerLoginDto } from '../dto/owner-login.dto';
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
    @Inject('OwnerUserRepository')
    private readonly ownerUserRepository: OwnerUserRepository,
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

      const role = profile.isDefault ? SystemRole.TENANT_ADMIN : SystemRole.USER;

      const payload = {
        sub: user.id,
        email: user.email,
        fullName: user.fullName,
        profileId: user.profileId,
        profileName: profile.name,
        tenantSchema: loginDto.cnpj,
        role,
      };

      const accessToken = this.jwtService.sign(payload);

      return {
        accessToken,
        tokenType: 'Bearer',
        expiresIn: 43200,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          profileId: user.profileId,
          profileName: profile.name,
          profileIsDefault: profile.isDefault,
          role,
        },
      };
    });
  }

  async ownerLogin(dto: OwnerLoginDto): Promise<AuthResponseDto> {
    const owner = await this.ownerUserRepository.findByEmail(dto.email);

    if (!owner) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!owner.validatePassword(dto.password)) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = {
      sub: owner.id,
      email: owner.email,
      fullName: owner.fullName,
      role: SystemRole.OWNER,
      tenantSchema: OWNER_SENTINEL,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn: 43200,
      user: {
        id: owner.id,
        email: owner.email,
        fullName: owner.fullName,
        profileId: '',
        profileName: '',
        role: SystemRole.OWNER,
      },
    };
  }
}
