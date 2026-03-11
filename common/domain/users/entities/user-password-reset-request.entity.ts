import { DateUtil } from '@common/utils/date.util';

export class UserPasswordResetRequest {
  private constructor(
    private readonly _resetToken: string,
    private readonly _expiresIn: Date,
    private readonly _isUsed: boolean,
    private readonly _requestIn: Date,
    private readonly _userId: string,
  ) {}

  static create(
    resetToken: string,
    expiresIn: Date,
    isUsed: boolean,
    requestIn: Date,
    userId: string,
  ): UserPasswordResetRequest {
    return new UserPasswordResetRequest(
      resetToken,
      expiresIn,
      isUsed,
      requestIn,
      userId,
    );
  }

  static fromDatabase(data: {
    resetToken: string;
    expiresIn: Date;
    isUsed: boolean;
    requestIn: Date;
    userId: string;
  }): UserPasswordResetRequest {
    return new UserPasswordResetRequest(
      data.resetToken,
      data.expiresIn,
      data.isUsed,
      data.requestIn,
      data.userId,
    );
  }

  get resetToken(): string {
    return this._resetToken;
  }

  get expiresIn(): Date {
    return this._expiresIn;
  }

  get isUsed(): boolean {
    return this._isUsed;
  }

  get requestIn(): Date {
    return this._requestIn;
  }

  get userId(): string {
    return this._userId;
  }

  isExpired(): boolean {
    return DateUtil.now() > this._expiresIn;
  }

  isValid(): boolean {
    return !this._isUsed && !this.isExpired();
  }

  markAsUsed(): UserPasswordResetRequest {
    return new UserPasswordResetRequest(
      this._resetToken,
      this._expiresIn,
      true,
      this._requestIn,
      this._userId,
    );
  }
}



