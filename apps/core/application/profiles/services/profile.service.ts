import { Injectable } from '@nestjs/common';
import { CreateProfileUseCase } from '../use-cases/create-profile.use-case';
import { GetProfileUseCase } from '../use-cases/get-profile.use-case';
import { UpdateProfileUseCase } from '../use-cases/update-profile.use-case';
import { UpdateProfileStatusUseCase } from '../use-cases/update-profile-status.use-case';
import { DeleteProfileUseCase } from '../use-cases/delete-profile.use-case';
import { ListProfilesUseCase } from '../use-cases/list-profiles.use-case';
import { CreateProfileDto } from '../dto/create-profile.dto';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { ProfileResponseDto } from '../dto/profile-response.dto';

@Injectable()
export class ProfileService {
  constructor(
    private readonly createProfileUseCase: CreateProfileUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updateProfileStatusUseCase: UpdateProfileStatusUseCase,
    private readonly deleteProfileUseCase: DeleteProfileUseCase,
    private readonly listProfilesUseCase: ListProfilesUseCase,
  ) {}

  async create(createProfileDto: CreateProfileDto): Promise<ProfileResponseDto> {
    return this.createProfileUseCase.execute(createProfileDto);
  }

  async findOne(id: string): Promise<ProfileResponseDto> {
    return this.getProfileUseCase.execute(id);
  }

  async update(id: string, updateProfileDto: UpdateProfileDto): Promise<ProfileResponseDto> {
    return this.updateProfileUseCase.execute(id, updateProfileDto);
  }

  async remove(id: string): Promise<void> {
    return this.deleteProfileUseCase.execute(id);
  }

  async findAll(): Promise<ProfileResponseDto[]> {
    return this.listProfilesUseCase.execute();
  }

  async updateStatus(
    profileId: string,
    isActive: boolean,
  ): Promise<{ id: string; isActive: boolean }> {
    return this.updateProfileStatusUseCase.execute(profileId, isActive);
  }
}






