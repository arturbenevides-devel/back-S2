import { Entity } from '../../base.entity';
import { Email } from '../value-objects/email.value-object';
import { Password } from '../value-objects/password.value-object';
import { DateUtil } from '@common/utils/date.util';

export class User extends Entity {
  private constructor(
    id: string,
    private _email: Email,
    private _fullName: string,
    private _password: Password,
    private _profileId: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
    private _profileImage?: string,
    private _companyId?: string,
  ) {
    super(id, createdIn, isActive, updatedIn);
  }

  static create(
    email: string,
    fullName: string,
    password: string,
    profileId: string,
    id?: string,
    createdIn?: Date,
    isActive?: boolean,
    updatedIn?: Date | null,
    profileImage?: string,
    companyId?: string,
  ): User {
    return new User(
      id || '',
      new Email(email),
      fullName,
      new Password(password, false),
      profileId,
      createdIn || DateUtil.now(),
      isActive !== undefined ? isActive : true,
      updatedIn || null,
      profileImage,
      companyId,
    );
  }

  static fromDatabase(
    email: string,
    fullName: string,
    password: string,
    profileId: string,
    id: string,
    createdIn: Date,
    isActive: boolean,
    updatedIn: Date | null,
    profileImage?: string,
    companyId?: string,
  ): User {
    return new User(
      id,
      new Email(email),
      fullName,
      new Password(password, true),
      profileId,
      createdIn,
      isActive,
      updatedIn,
      profileImage,
      companyId,
    );
  }

  get email(): string {
    return this._email.value;
  }

  get fullName(): string {
    return this._fullName;
  }

  get password(): string {
    return this._password.value;
  }

  get hashedPassword(): string {
    return this._password.hashedValue;
  }

  get profileImage(): string | undefined {
    return this._profileImage;
  }

  get profileId(): string {
    return this._profileId;
  }

  get companyId(): string | undefined {
    return this._companyId;
  }

  updateFullName(fullName: string): void {
    this._fullName = fullName;
    this.updateTimestamp();
  }

  updateEmail(email: string): void {
    this._email = new Email(email);
    this.updateTimestamp();
  }

  updatePassword(password: string): void {
    this._password = new Password(password);
    this.updateTimestamp();
  }

  updateProfileImage(profileImage: string): void {
    this._profileImage = profileImage;
    this.updateTimestamp();
  }

  updateProfileId(profileId: string): void {
    this._profileId = profileId;
    this.updateTimestamp();
  }

  updateCompanyId(companyId: string | undefined): void {
    this._companyId = companyId;
    this.updateTimestamp();
  }

  validatePassword(password: string): boolean {
    return this._password.validate(password);
  }

  activate(): User {
    return new User(
      this.id,
      this._email,
      this._fullName,
      this._password,
      this._profileId,
      this.createdIn,
      true,
      DateUtil.now(),
      this._profileImage,
      this._companyId,
    );
  }
}




