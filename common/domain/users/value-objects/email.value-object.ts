export class Email {
  private readonly _value: string;

  constructor(email: string) {
    this.validate(email);
    this._value = email.toLowerCase().trim();
  }

  get value(): string {
    return this._value;
  }

  private validate(email: string): void {
    if (!email) {
      throw new Error('Email é obrigatório');
    }

    if (typeof email !== 'string') {
      throw new Error('Email deve ser uma string');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Email inválido');
    }

    if (email.length > 255) {
      throw new Error('Email muito longo');
    }
  }

  equals(email: Email): boolean {
    return this._value === email._value;
  }
}



