import { registerDecorator, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator';
import { isValidCpfDigits } from './cpf.util';

@ValidatorConstraint({ name: 'isValidCpf', async: false })
class IsValidCpfConstraint implements ValidatorConstraintInterface {
  validate(value: unknown): boolean {
    if (typeof value !== 'string') return false;
    const digits = value.replace(/\D/g, '');
    return isValidCpfDigits(digits);
  }

  defaultMessage(): string {
    return 'CPF inválido';
  }
}

export function IsValidCpf(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidCpfConstraint,
    });
  };
}
