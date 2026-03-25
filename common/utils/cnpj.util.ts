import { BadRequestException } from '@nestjs/common';

const W1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
const W2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export function digitsOnlyCnpj(input: string): string {
  return input.replace(/\D/g, '');
}

export function isValidCnpjDigits(cnpj14: string): boolean {
  if (!/^\d{14}$/.test(cnpj14)) {
    return false;
  }
  if (/^(\d)\1{13}$/.test(cnpj14)) {
    return false;
  }
  const n = cnpj14.split('').map((c) => parseInt(c, 10));
  let s = 0;
  for (let i = 0; i < 12; i++) {
    s += n[i] * W1[i];
  }
  let r = s % 11;
  const d1 = r < 2 ? 0 : 11 - r;
  if (d1 !== n[12]) {
    return false;
  }
  s = 0;
  for (let i = 0; i < 13; i++) {
    s += n[i] * W2[i];
  }
  r = s % 11;
  const d2 = r < 2 ? 0 : 11 - r;
  return d2 === n[13];
}

export function normalizeTenantSchemaCnpj(input: string): string {
  const d = digitsOnlyCnpj(input);
  if (d.length !== 14) {
    throw new BadRequestException('CNPJ deve conter 14 dígitos');
  }
  if (!isValidCnpjDigits(d)) {
    throw new BadRequestException('CNPJ inválido');
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
