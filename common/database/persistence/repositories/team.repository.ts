import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TeamRepository as ITeamRepository,
  TeamMemberInfo,
} from '@common/domain/teams/repositories/team.repository.interface';
import { Team } from '@common/domain/teams/entities/team.entity';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';
import { getRequiredTenantSchema } from '@common/tenant/tenant-schema.storage';

@Injectable()
export class TeamRepository implements ITeamRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  private run<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.runner.run(getRequiredTenantSchema(), fn);
  }

  async findById(id: string): Promise<Team | null> {
    return this.run(async (tx) => {
      const team = await tx.team.findFirst({
        where: { id, isActive: true },
      });
      if (!team) return null;
      return Team.fromDatabase(
        team.name,
        team.supervisorId,
        team.id,
        team.createdIn,
        team.isActive,
        team.updatedIn,
      );
    });
  }

  async findAll(): Promise<Team[]> {
    return this.run(async (tx) => {
      const teams = await tx.team.findMany({
        where: { isActive: true },
        orderBy: { createdIn: 'desc' },
      });
      return teams.map((t) =>
        Team.fromDatabase(t.name, t.supervisorId, t.id, t.createdIn, t.isActive, t.updatedIn),
      );
    });
  }

  async findBySupervisorId(supervisorId: string): Promise<Team[]> {
    return this.run(async (tx) => {
      const teams = await tx.team.findMany({
        where: { supervisorId, isActive: true },
        orderBy: { createdIn: 'desc' },
      });
      return teams.map((t) =>
        Team.fromDatabase(t.name, t.supervisorId, t.id, t.createdIn, t.isActive, t.updatedIn),
      );
    });
  }

  async save(team: Team): Promise<Team> {
    return this.run(async (tx) => {
      const created = await tx.team.create({
        data: {
          name: team.name,
          supervisorId: team.supervisorId,
          createdIn: team.createdIn,
          isActive: team.isActive,
          updatedIn: team.updatedIn,
        },
      });
      return Team.fromDatabase(
        created.name,
        created.supervisorId,
        created.id,
        created.createdIn,
        created.isActive,
        created.updatedIn,
      );
    });
  }

  async update(team: Team): Promise<Team> {
    return this.run(async (tx) => {
      await tx.team.update({
        where: { id: team.id },
        data: {
          name: team.name,
          supervisorId: team.supervisorId,
          isActive: team.isActive,
          updatedIn: team.updatedIn,
        },
      });
      return team;
    });
  }

  async delete(id: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.team.delete({ where: { id } });
    });
  }

  async addMember(teamId: string, userId: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { teamId },
      });
    });
  }

  async removeMember(userId: string): Promise<void> {
    return this.run(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { teamId: null },
      });
    });
  }

  async setMembers(teamId: string, userIds: string[]): Promise<void> {
    return this.run(async (tx) => {
      // Remove all current members
      await tx.user.updateMany({
        where: { teamId },
        data: { teamId: null },
      });
      // Add new members
      if (userIds.length > 0) {
        await tx.user.updateMany({
          where: { id: { in: userIds } },
          data: { teamId },
        });
      }
    });
  }

  async findMemberTeamId(userId: string): Promise<string | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: userId },
        select: { teamId: true },
      });
      return user?.teamId || null;
    });
  }

  async findTeamMembers(teamId: string): Promise<TeamMemberInfo[]> {
    return this.run(async (tx) => {
      const users = await tx.user.findMany({
        where: { teamId },
        select: { id: true, fullName: true, email: true, isActive: true },
        orderBy: { fullName: 'asc' },
      });
      return users;
    });
  }

  async findAvailableMembers(): Promise<TeamMemberInfo[]> {
    return this.run(async (tx) => {
      const users = await tx.user.findMany({
        where: { isActive: true },
        select: { id: true, fullName: true, email: true, isActive: true },
        orderBy: { fullName: 'asc' },
      });
      return users;
    });
  }

  async findSupervisorName(supervisorId: string): Promise<string | null> {
    return this.run(async (tx) => {
      const user = await tx.user.findFirst({
        where: { id: supervisorId },
        select: { fullName: true },
      });
      return user?.fullName || null;
    });
  }
}
