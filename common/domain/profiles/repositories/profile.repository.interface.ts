import { Profile } from '../entities/profile.entity';
import { ProfilePermission } from '../../profile-permissions/entities/profile-permission.entity';

export interface ProfileRepository {
  findById(id: string): Promise<Profile | null>;
  findByIdIncludingInactive(id: string): Promise<Profile | null>;
  findByName(name: string): Promise<Profile | null>;
  save(profile: Profile): Promise<Profile>;
  update(profile: Profile): Promise<Profile>;
  updateIsActive(profileId: string, isActive: boolean): Promise<void>;
  delete(id: string): Promise<void>;
  findAll(): Promise<Profile[]>;
  saveWithPermissions(profile: Profile, permissions: ProfilePermission[]): Promise<Profile>;
  updateWithPermissions(profile: Profile, permissions: ProfilePermission[]): Promise<Profile>;
  transaction<T>(callback: (transaction: any) => Promise<T>): Promise<T>;
}



