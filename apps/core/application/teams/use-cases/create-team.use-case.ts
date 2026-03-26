import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';
import { Team } from '@common/domain/teams/entities/team.entity';
import { CreateTeamDto } from '../dto/create-team.dto';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class CreateTeamUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(dto: CreateTeamDto): Promise<TeamResponseDto> {
    if (dto.supervisorId) {
      const supervisorName = await this.teamRepository.findSupervisorName(dto.supervisorId);
      if (!supervisorName) {
        throw new BadRequestException('Supervisor não encontrado');
      }
    }

    const team = Team.create(dto.name, dto.supervisorId || null);
    const saved = await this.teamRepository.save(team);

    let supervisorName: string | null = null;
    if (saved.supervisorId) {
      supervisorName = await this.teamRepository.findSupervisorName(saved.supervisorId);
    }

    return {
      id: saved.id,
      name: saved.name,
      supervisorId: saved.supervisorId,
      supervisorName,
      createdIn: saved.createdIn,
      isActive: saved.isActive,
      updatedIn: saved.updatedIn,
      members: [],
    };
  }
}
