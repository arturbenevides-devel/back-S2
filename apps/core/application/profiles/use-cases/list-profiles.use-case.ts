import { Injectable, Inject } from '@nestjs/common';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { ProfilePermissionRepository } from '@common/domain/profile-permissions/repositories/profile-permission.repository.interface';
import { ProfileResponseDto } from '../dto/profile-response.dto';

@Injectable()
export class ListProfilesUseCase {
  constructor(
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('ProfilePermissionRepository')
    private readonly profilePermissionRepository: ProfilePermissionRepository,
  ) {}

  async execute(): Promise<ProfileResponseDto[]> {
    const profiles = await this.profileRepository.findAll();

    const profilesWithPermissions = await Promise.all(
      profiles.map(async profile => await this.mapToResponseDto(profile))
    );
    
    return profilesWithPermissions;
  }

  private async mapToResponseDto(profile: any): Promise<ProfileResponseDto> {
    return {
      id: profile.id,
      name: profile.name,
      description: profile.description,
      createdIn: profile.createdIn,
      isActive: profile.isActive,
      updatedIn: profile.updatedIn,
      isDefault: profile.isDefault,
    };
  }
}






