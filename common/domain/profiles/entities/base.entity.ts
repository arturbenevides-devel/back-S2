export abstract class Entity {
  constructor(
    protected readonly _id: string,
    protected readonly _createdIn: Date,
    protected _isActive: boolean,
    protected _updatedIn: Date,
  ) {}

  get id(): string {
    return this._id;
  }

  get createdIn(): Date {
    return this._createdIn;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get updatedIn(): Date {
    return this._updatedIn;
  }

  activate(): void {
    this._isActive = true;
    this.updateTimestamp();
  }

  deactivate(): void {
    this._isActive = false;
    this.updateTimestamp();
  }

  protected updateTimestamp(): void {
    this._updatedIn = new Date();
  }

  equals(entity: Entity): boolean {
    return this._id === entity._id;
  }
}



