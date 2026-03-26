import { Injectable, Inject } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class ListTeamsUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(): Promise<TeamResponseDto[]> {
    const teams = await this.teamRepository.findAll();

    return Promise.all(
      teams.map(async (team) => {
        const members = await this.teamRepository.findTeamMembers(team.id);
        let supervisorName: string | null = null;
        if (team.supervisorId) {
          supervisorName = await this.teamRepository.findSupervisorName(team.supervisorId);
        }
        return {
          id: team.id,
          name: team.name,
          supervisorId: team.supervisorId,
          supervisorName,
          createdIn: team.createdIn,
          isActive: team.isActive,
          updatedIn: team.updatedIn,
          members,
        };
      }),
    );
  }
}
