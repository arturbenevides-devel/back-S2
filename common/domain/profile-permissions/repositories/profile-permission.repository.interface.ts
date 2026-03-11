import { ProfilePermission } from '../entities/profile-permission.entity';

export interface ProfilePermissionRepository {
  findByProfileIdAndController(profileId: string, controller: string): Promise<ProfilePermission | null>;
  findByProfileId(profileId: string): Promise<ProfilePermission[]>;
  findByProfileAndMenu(profileId: string, menuId: string): Promise<ProfilePermission | null>;
  save(profilePermission: ProfilePermission): Promise<ProfilePermission>;
  update(profilePermission: ProfilePermission): Promise<ProfilePermission>;
  delete(id: string): Promise<void>;
  findAll(): Promise<ProfilePermission[]>;
}



