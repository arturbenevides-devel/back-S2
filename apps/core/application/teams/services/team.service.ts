import { Injectable } from '@nestjs/common';
import { CreateTeamUseCase } from '../use-cases/create-team.use-case';
import { ListTeamsUseCase } from '../use-cases/list-teams.use-case';
import { GetTeamUseCase } from '../use-cases/get-team.use-case';
import { UpdateTeamUseCase } from '../use-cases/update-team.use-case';
import { DeleteTeamUseCase } from '../use-cases/delete-team.use-case';
import { CreateTeamDto } from '../dto/create-team.dto';
import { UpdateTeamDto } from '../dto/update-team.dto';
import { TeamResponseDto } from '../dto/team-response.dto';

@Injectable()
export class TeamService {
  constructor(
    private readonly createTeamUseCase: CreateTeamUseCase,
    private readonly listTeamsUseCase: ListTeamsUseCase,
    private readonly getTeamUseCase: GetTeamUseCase,
    private readonly updateTeamUseCase: UpdateTeamUseCase,
    private readonly deleteTeamUseCase: DeleteTeamUseCase,
  ) {}

  async create(dto: CreateTeamDto): Promise<TeamResponseDto> {
    return this.createTeamUseCase.execute(dto);
  }

  async findAll(): Promise<TeamResponseDto[]> {
    return this.listTeamsUseCase.execute();
  }

  async findOne(id: string): Promise<TeamResponseDto> {
    return this.getTeamUseCase.execute(id);
  }

  async update(id: string, dto: UpdateTeamDto): Promise<TeamResponseDto> {
    return this.updateTeamUseCase.execute(id, dto);
  }

  async remove(id: string): Promise<void> {
    return this.deleteTeamUseCase.execute(id);
  }
}
