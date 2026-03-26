import { OwnerUser } from '../entities/owner-user.entity';

export interface OwnerUserRepository {
  findByEmail(email: string): Promise<OwnerUser | null>;
  findById(id: string): Promise<OwnerUser | null>;
  findAll(): Promise<OwnerUser[]>;
  create(email: string, fullName: string, hashedPassword: string): Promise<OwnerUser>;
  updateIsActive(id: string, isActive: boolean): Promise<void>;
}
