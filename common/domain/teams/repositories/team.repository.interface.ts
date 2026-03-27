import { Team } from '../entities/team.entity';

export interface TeamMemberInfo {
  id: string;
  fullName: string;
  email: string;
  isActive: boolean;
}

export interface TeamRepository {
  findById(id: string): Promise<Team | null>;
  findAll(): Promise<Team[]>;
  findBySupervisorId(supervisorId: string): Promise<Team[]>;
  save(team: Team): Promise<Team>;
  update(team: Team): Promise<Team>;
  delete(id: string): Promise<void>;
  addMember(teamId: string, userId: string): Promise<void>;
  removeMember(userId: string): Promise<void>;
  setMembers(teamId: string, userIds: string[]): Promise<void>;
  findMemberTeamId(userId: string): Promise<string | null>;
  findTeamMembers(teamId: string): Promise<TeamMemberInfo[]>;
  findAvailableMembers(): Promise<TeamMemberInfo[]>;
  findSupervisorName(supervisorId: string): Promise<string | null>;
}
