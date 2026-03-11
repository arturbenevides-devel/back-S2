import { Entity } from '../../base.entity';
import { DateUtil } from '@common/utils/date.util';

export class Company extends Entity {
  private constructor(
    id: string,
    private _name: string,
    private _federalRegistration: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ) {
    super(id, createdIn, isActive, updatedIn);
  }

  static create(
    name: string,
    federalRegistration: string,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ): Company {
    return new Company(
      id || '',
      name,
      federalRegistration,
      createdIn || DateUtil.now(),
      isActive !== undefined ? isActive : true,
      updatedIn || null,
    );
  }

  static fromDatabase(
    name: string,
    federalRegistration: string,
    id: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ): Company {
    return new Company(
      id,
      name,
      federalRegistration,
      createdIn,
      isActive,
      updatedIn,
    );
  }

  get name(): string {
    return this._name;
  }

  get federalRegistration(): string {
    return this._federalRegistration;
  }

  updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  updateFederalRegistration(federalRegistration: string): void {
    this._federalRegistration = federalRegistration;
    this.updateTimestamp();
  }
}
