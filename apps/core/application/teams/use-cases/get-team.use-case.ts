import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class GetTeamUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(id: string): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Equipe não encontrada');
    }

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
  }
}
