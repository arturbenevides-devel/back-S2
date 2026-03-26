import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { OwnerUserRepository } from '@common/domain/owner/repositories/owner-user.repository.interface';

export interface OwnerUserResponse {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
}

@Injectable()
export class OwnerUsersService {
  constructor(
    @Inject('OwnerUserRepository')
    private readonly ownerRepo: OwnerUserRepository,
  ) {}

  async list(): Promise<OwnerUserResponse[]> {
    const owners = await this.ownerRepo.findAll();
    return owners.map((o) => ({
      id: o.id,
      email: o.email,
      fullName: o.fullName,
      isActive: o.isActive,
    }));
  }

  async create(email: string, fullName: string, password: string): Promise<OwnerUserResponse> {
    const existing = await this.ownerRepo.findByEmail(email);
    if (existing) {
      throw new ConflictException('Já existe um owner com este email');
    }

    const hashed = await bcrypt.hash(password, 10);
    const owner = await this.ownerRepo.create(email, fullName, hashed);

    return {
      id: owner.id,
      email: owner.email,
      fullName: owner.fullName,
      isActive: owner.isActive,
    };
  }

  async deactivate(id: string): Promise<{ message: string }> {
    const owner = await this.ownerRepo.findById(id);
    if (!owner) {
      throw new NotFoundException('Owner não encontrado');
    }
    await this.ownerRepo.updateIsActive(id, false);
    return { message: 'Owner desativado com sucesso' };
  }
}
