import * as bcrypt from 'bcryptjs';

export class Password {
  private readonly _value: string;
  private readonly _hashedValue: string;

  constructor(password: string, isHashed: boolean = false) {
    if (isHashed) {
      this._value = password;
      this._hashedValue = password;
    } else {
      this.validateInput(password);
      this._value = password;
      this._hashedValue = bcrypt.hashSync(password, 10);
    }
  }

  get value(): string {
    return this._value;
  }

  get hashedValue(): string {
    return this._hashedValue;
  }

  private validateInput(password: string): void {
    if (!password) {
      throw new Error('Senha é obrigatória');
    }

    if (typeof password !== 'string') {
      throw new Error('Senha deve ser uma string');
    }

    if (password.length < 6) {
      throw new Error('Senha deve ter pelo menos 6 caracteres');
    }

    if (password.length > 100) {
      throw new Error('Senha muito longa');
    }
  }

  validate(password: string): boolean {
    return bcrypt.compareSync(password, this._hashedValue);
  }

  equals(password: Password): boolean {
    return this._hashedValue === password._hashedValue;
  }
}



