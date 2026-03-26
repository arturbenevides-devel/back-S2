import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class UpdateTeamUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(id: string, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Equipe não encontrada');
    }

    if (dto.name) {
      team.updateName(dto.name);
    }

    if (dto.supervisorId !== undefined) {
      if (dto.supervisorId) {
        const supervisorName = await this.teamRepository.findSupervisorName(dto.supervisorId);
        if (!supervisorName) {
          throw new BadRequestException('Supervisor não encontrado');
        }
      }
      team.updateSupervisorId(dto.supervisorId);
    }

    await this.teamRepository.update(team);

    if (dto.memberIds !== undefined) {
      await this.teamRepository.setMembers(id, dto.memberIds);
    }

    const members = await this.teamRepository.findTeamMembers(id);
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
