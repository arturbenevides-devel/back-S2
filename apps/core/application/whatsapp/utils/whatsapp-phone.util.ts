export function digitsOnlyForWhatsapp(input: string): string {
  return input.replace(/\D/g, '');
}

export type Whats2OutboundResolve =
  | { ok: true; to: string }
  | { ok: false; message: string };

export function resolveWhats2OutboundTo(conv: {
  chat_id: string;
  contact_phone: string | null;
}): Whats2OutboundResolve {
  const phoneDigits = (conv.contact_phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length >= 10 && phoneDigits.length <= 15) {
    return { ok: true, to: phoneDigits };
  }
  const cid = (conv.chat_id ?? '').trim();
  if (!cid) {
    return { ok: false, message: 'Conversa sem destino válido.' };
  }
  if (cid.toLowerCase().endsWith('@lid')) {
    return {
      ok: false,
      message:
        'Este contacto ainda não tem número de telefone (JID) para envio pela API Whats2. ' +
        'Abra a conversa a partir de um número ou aguarde mensagem recebida com o número.',
    };
  }
  return { ok: true, to: cid };
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
