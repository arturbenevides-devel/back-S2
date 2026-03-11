import { UserPasswordResetRequest } from '../entities/user-password-reset-request.entity';

export interface UserPasswordResetRequestRepository {
  save(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest>;
  findByResetToken(resetToken: string): Promise<UserPasswordResetRequest | null>;
  findByToken(token: string): Promise<UserPasswordResetRequest | null>;
  findByUserId(userId: string): Promise<UserPasswordResetRequest[]>;
  update(resetRequest: UserPasswordResetRequest): Promise<UserPasswordResetRequest>;
  deleteByUserId(userId: string): Promise<void>;
}



