import { Entity } from '../../base.entity';
import { DateUtil } from '@common/utils/date.util';

export class Team extends Entity {
  private constructor(
    id: string,
    private _name: string,
    private _supervisorId: string | null,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ) {
    super(id, createdIn, isActive, updatedIn);
  }

  static create(
    name: string,
    supervisorId: string | null,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ): Team {
    return new Team(
      id || '',
      name,
      supervisorId,
      createdIn || DateUtil.now(),
      isActive !== undefined ? isActive : true,
      updatedIn || null,
    );
  }

  static fromDatabase(
    name: string,
    supervisorId: string | null,
    id: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ): Team {
    return new Team(id, name, supervisorId, createdIn, isActive, updatedIn);
  }

  get name(): string {
    return this._name;
  }

  get supervisorId(): string | null {
    return this._supervisorId;
  }

  updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  updateSupervisorId(supervisorId: string | null): void {
    this._supervisorId = supervisorId;
    this.updateTimestamp();
  }
}
