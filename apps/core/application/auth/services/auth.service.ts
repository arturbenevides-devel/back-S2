import { Injectable, UnauthorizedException, Inject, HttpException, HttpStatus } from '@nestjs/common';
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

interface LoginAttempt {
  count: number;
  blockedUntil: number | null;
}

const MAX_ATTEMPTS = 5;
const BLOCK_DURATION_MS = 15 * 60 * 1000; // 15 minutos

@Injectable()
export class AuthService {
  private loginAttempts = new Map<string, LoginAttempt>();

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

  private getAttemptKey(identifier: string): string {
    return identifier.toLowerCase();
  }

  private checkBlocked(key: string): void {
    const attempt = this.loginAttempts.get(key);
    if (!attempt) return;

    if (attempt.blockedUntil && Date.now() < attempt.blockedUntil) {
      const remainingMs = attempt.blockedUntil - Date.now();
      const remainingMin = Math.ceil(remainingMs / 60_000);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Muitas tentativas. Tente novamente em ${remainingMin} minuto${remainingMin > 1 ? 's' : ''}.`,
          retryAfterMs: remainingMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    // Bloqueio expirou — limpa
    if (attempt.blockedUntil && Date.now() >= attempt.blockedUntil) {
      this.loginAttempts.delete(key);
    }
  }

  private registerFailedAttempt(key: string): void {
    const attempt = this.loginAttempts.get(key) || { count: 0, blockedUntil: null };
    attempt.count += 1;

    if (attempt.count >= MAX_ATTEMPTS) {
      attempt.blockedUntil = Date.now() + BLOCK_DURATION_MS;
    }

    this.loginAttempts.set(key, attempt);
  }

  private clearAttempts(key: string): void {
    this.loginAttempts.delete(key);
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const attemptKey = this.getAttemptKey(`${loginDto.cnpj}:${loginDto.email}`);
    this.checkBlocked(attemptKey);

    const registered = await this.tenantRegistry.isRegistered(loginDto.cnpj);
    if (!registered) {
      this.registerFailedAttempt(attemptKey);
      throw new UnauthorizedException('Empresa não encontrada ou não cadastrada');
    }

    const tenantActive = await this.tenantRegistry.isTenantActive(loginDto.cnpj);
    if (!tenantActive) {
      throw new UnauthorizedException('Empresa desativada. Entre em contato com o suporte.');
    }

    return runWithTenantSchema(loginDto.cnpj, async () => {
      const user = await this.userRepository.findByEmailIncludingInactive(loginDto.email);

      if (!user) {
        this.registerFailedAttempt(attemptKey);
        throw new UnauthorizedException('Email ou senha incorretos');
      }

      const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);

      if (!isPasswordValid) {
        this.registerFailedAttempt(attemptKey);
        throw new UnauthorizedException('Email ou senha incorretos');
      }

      if (!user.isActive) {
        throw new UnauthorizedException(
          'Conta não confirmada. Verifique seu email para ativar a conta.',
        );
      }

      // Login bem-sucedido — limpa tentativas
      this.clearAttempts(attemptKey);

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
    const attemptKey = this.getAttemptKey(`owner:${dto.email}`);
    this.checkBlocked(attemptKey);

    const owner = await this.ownerUserRepository.findByEmail(dto.email);

    if (!owner) {
      this.registerFailedAttempt(attemptKey);
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    if (!owner.validatePassword(dto.password)) {
      this.registerFailedAttempt(attemptKey);
      throw new UnauthorizedException('Email ou senha incorretos');
    }

    // Login bem-sucedido — limpa tentativas
    this.clearAttempts(attemptKey);

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
