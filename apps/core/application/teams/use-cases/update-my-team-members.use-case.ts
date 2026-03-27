import { Injectable, Inject, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class UpdateMyTeamMembersUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(supervisorId: string, memberIds: string[]): Promise<TeamResponseDto> {
    const teams = await this.teamRepository.findBySupervisorId(supervisorId);

    if (teams.length === 0) {
      throw new NotFoundException('Você não é supervisor de nenhuma equipe');
    }

    const team = teams[0];

    await this.teamRepository.setMembers(team.id, memberIds);

    const members = await this.teamRepository.findTeamMembers(team.id);
    const supervisorName = await this.teamRepository.findSupervisorName(supervisorId);

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
