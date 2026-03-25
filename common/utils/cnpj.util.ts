import { BadRequestException } from '@nestjs/common';

export function digitsOnlyCnpj(input: string): string {
  return input.replace(/\D/g, '');
}

export function normalizeTenantSchemaCnpj(input: string): string {
  const d = digitsOnlyCnpj(input);
  if (d.length !== 14) {
    throw new BadRequestException('CNPJ deve conter 14 dígitos');
  }
  return d;
}

export function formatCnpjDisplay(digits: string): string {
  const d = digitsOnlyCnpj(digits);
  if (d.length !== 14) {
    return digits;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
}
