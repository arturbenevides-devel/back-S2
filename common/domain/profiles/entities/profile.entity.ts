import { Entity } from '../../base.entity';
import { DateUtil } from '@common/utils/date.util';

export class Profile extends Entity {
  private constructor(
    id: string,
    private _name: string,
    private _description: string,
    private _isDefault: boolean,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
  ) {
    super(id, createdIn, isActive, updatedIn);
  }

  static create(
    name: string,
    description: string,
    isDefault?: boolean,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
  ): Profile {
    return new Profile(
      id || '',
      name,
      description,
      isDefault || false,
      createdIn || DateUtil.now(),
      isActive !== undefined ? isActive : true,
      updatedIn || null,
    );
  }

  get name(): string {
    return this._name;
  }

  get description(): string {
    return this._description;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }

  updateName(name: string): void {
    this._name = name;
    this.updateTimestamp();
  }

  updateDescription(description: string): void {
    this._description = description;
    this.updateTimestamp();
  }
}



