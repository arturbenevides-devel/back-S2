import { Injectable, Inject } from '@nestjs/common';
import { UserRepository } from '@common/domain/users/repositories/user.repository.interface';
import { ProfileRepository } from '@common/domain/profiles/repositories/profile.repository.interface';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { UserResponseDto } from '../dto/user-response.dto';

@Injectable()
export class ListUsersUseCase {
  constructor(
    @Inject('UserRepository')
    private readonly userRepository: UserRepository,
    @Inject('ProfileRepository')
    private readonly profileRepository: ProfileRepository,
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(excludeUserId?: string): Promise<UserResponseDto[]> {
    let users = await this.userRepository.findAll();
    if (excludeUserId) {
      users = users.filter((u) => u.id !== excludeUserId);
    }

    let requesterIsDefault = true;
    let requesterProfileName: string | null = null;
    let requesterTeamId: string | null = null;

    if (excludeUserId) {
      const requesterUser = await this.userRepository.findById(excludeUserId);
      if (requesterUser) {
        const requesterProfile = await this.profileRepository.findById(requesterUser.profileId);
        requesterIsDefault = requesterProfile?.isDefault === true;
        requesterProfileName = requesterProfile?.name || null;
        requesterTeamId = await this.teamRepository.findMemberTeamId(excludeUserId);
      }
    }

    // Supervisor: só vê membros da própria equipe
    if (requesterProfileName === 'Supervisor' && requesterTeamId) {
      const teamMembers = await this.teamRepository.findTeamMembers(requesterTeamId);
      const teamMemberIds = new Set(teamMembers.map((m) => m.id));
      users = users.filter((u) => teamMemberIds.has(u.id));
    }

    // Atendente: só vê membros da própria equipe
    if (requesterProfileName === 'Atendente' && requesterTeamId) {
      const teamMembers = await this.teamRepository.findTeamMembers(requesterTeamId);
      const teamMemberIds = new Set(teamMembers.map((m) => m.id));
      users = users.filter((u) => teamMemberIds.has(u.id));
    }

    const usersWithProfiles = await Promise.all(
      users.map(async (user) => await this.mapToResponseDto(user))
    );

    if (!requesterIsDefault) {
      return usersWithProfiles.filter((u) => !u.profile?.isDefault);
    }
    return usersWithProfiles;
  }

  private async mapToResponseDto(user: any): Promise<UserResponseDto> {
    const profile = await this.profileRepository.findById(user.profileId);
    if (!profile) {
      throw new Error(`Perfil do usuário ${user.id} não encontrado`);
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      profileImage: user.profileImage,
      companyId: user.companyId,
      createdIn: user.createdIn,
      isActive: user.isActive,
      updatedIn: user.updatedIn,
      profile: {
        id: profile.id,
        name: profile.name,
        description: profile.description,
        createdIn: profile.createdIn,
        isActive: profile.isActive,
        updatedIn: profile.updatedIn,
        isDefault: profile.isDefault,
      },
    };
  }
}
