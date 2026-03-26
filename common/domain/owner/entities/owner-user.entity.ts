import { Email } from '../../users/value-objects/email.value-object';
import { Password } from '../../users/value-objects/password.value-object';

export class OwnerUser {
  private constructor(
    private readonly _id: string,
    private readonly _email: Email,
    private readonly _fullName: string,
    private readonly _password: Password,
    private readonly _isActive: boolean,
    private readonly _createdAt: Date,
    private readonly _updatedAt: Date | null,
  ) {}

  static fromDatabase(row: {
    id: string;
    email: string;
    full_name: string;
    password: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date | null;
  }): OwnerUser {
    return new OwnerUser(
      row.id,
      new Email(row.email),
      row.full_name,
      new Password(row.password, true),
      row.is_active,
      row.created_at,
      row.updated_at,
    );
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email.value;
  }

  get fullName(): string {
    return this._fullName;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  validatePassword(plain: string): boolean {
    return this._password.validate(plain);
  }
}
