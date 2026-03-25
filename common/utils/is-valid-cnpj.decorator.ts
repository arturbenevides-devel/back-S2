import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidCnpjDigits } from './cnpj.util';

export function IsValidCnpj(validationOptions?: ValidationOptions): PropertyDecorator {
  return (object: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isValidCnpj',
      target: object.constructor,
      propertyName: propertyName as string,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && isValidCnpjDigits(value);
        },
        defaultMessage() {
          return 'CNPJ inválido';
        },
      },
    });
  };
}
