import { User } from '../entities/user.entity';

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByIdIncludingInactive(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailIncludingInactive(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
  update(user: User): Promise<User>;
  updatePassword(userId: string, hashedPassword: string): Promise<void>;
  updateIsActive(userId: string, isActive: boolean): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<User[]>;
  countByProfileId(profileId: string): Promise<number>;
}



