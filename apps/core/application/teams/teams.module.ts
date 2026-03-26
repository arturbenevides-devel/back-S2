import { Module } from '@nestjs/common';
import { TeamService } from './services/team.service';
import { CreateTeamUseCase } from './use-cases/create-team.use-case';
import { ListTeamsUseCase } from './use-cases/list-teams.use-case';
import { GetTeamUseCase } from './use-cases/get-team.use-case';
import { UpdateTeamUseCase } from './use-cases/update-team.use-case';
import { DeleteTeamUseCase } from './use-cases/delete-team.use-case';
import { TeamRepository } from '@common/database/persistence/repositories/team.repository';
import { TeamsController } from '@common/http/controllers/teams.controller';
import { PrismaModule } from '@common/database/persistence/prisma.module';
import { JwtAuthGuard } from '@common/http/guards/jwt-auth.guard';
import { PermissionGuard } from '@common/http/guards/permission.guard';
import { ProfilePermissionsModule } from '../profile-permissions/profile-permissions.module';

@Module({
  imports: [PrismaModule, ProfilePermissionsModule],
  controllers: [TeamsController],
  providers: [
    TeamService,
    CreateTeamUseCase,
    ListTeamsUseCase,
    GetTeamUseCase,
    UpdateTeamUseCase,
    DeleteTeamUseCase,
    JwtAuthGuard,
    PermissionGuard,
    {
      provide: 'TeamRepository',
      useClass: TeamRepository,
    },
  ],
  exports: [TeamService],
})
export class TeamsModule {}
