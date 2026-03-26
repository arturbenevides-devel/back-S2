import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { TeamRepository } from '@common/domain/teams/repositories/team.repository.interface';

@Injectable()
export class DeleteTeamUseCase {
  constructor(
    @Inject('TeamRepository')
    private readonly teamRepository: TeamRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const team = await this.teamRepository.findById(id);
    if (!team) {
      throw new NotFoundException('Equipe não encontrada');
    }

    // Remove all members from team before deactivating
    await this.teamRepository.setMembers(id, []);

    team.deactivate();
    await this.teamRepository.update(team);
  }
}
