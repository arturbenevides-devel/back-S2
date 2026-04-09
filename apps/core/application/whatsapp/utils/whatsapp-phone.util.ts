/** Remove caracteres não numéricos; não insere 9, 55 nem altera o que o usuário digitou. */
export function digitsOnlyForWhatsapp(input: string): string {
  return input.replace(/\D/g, '');
}

export function validateWhatsappDestinationDigits(
  digits: string,
): { ok: true } | { ok: false; message: string } {
  const d = digits.replace(/\D/g, '');
  if (d.length < 10 || d.length > 15) {
    return {
      ok: false,
      message: 'Informe entre 10 e 15 dígitos (com código do país, ex.: 5584...).',
    };
  }
  return { ok: true };
}
