export function isValidCpfDigits(cpf11: string): boolean {
  if (!/^\d{11}$/.test(cpf11)) return false;
  if (/^(\d)\1{10}$/.test(cpf11)) return false;

  const n = cpf11.split('').map((c) => parseInt(c, 10));

  let s = 0;
  for (let i = 0; i < 9; i++) s += n[i] * (10 - i);
  const d1 = (s * 10) % 11 === 10 ? 0 : (s * 10) % 11;
  if (d1 !== n[9]) return false;

  s = 0;
  for (let i = 0; i < 10; i++) s += n[i] * (11 - i);
  const d2 = (s * 10) % 11 === 10 ? 0 : (s * 10) % 11;
  return d2 === n[10];
}
