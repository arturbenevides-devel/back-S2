import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface Whats2LoginResponse {
  token: string;
  email?: string;
}

@Injectable()
export class Whats2ApiService {
  private readonly logger = new Logger(Whats2ApiService.name);
  private cachedToken: string | null = null;
  private tokenExpiresAt = 0;

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    return (
      this.config.get<string>('WHATS2_API_URL') ||
      'https://whats2.dextino.com.br/api'
    ).replace(/\/$/, '');
  }

  private instanceId(): string {
    const id = this.config.get<string>('WHATS2_INSTANCE_ID');
    if (!id?.trim()) {
      throw new ServiceUnavailableException('WHATS2_INSTANCE_ID não configurado');
    }
    return id.trim();
  }

  async getInstanceStatus(): Promise<{
    id: string;
    status: string;
    jid?: string;
    label?: string;
  }> {
    const token = await this.getBearerToken();
    const res = await fetch(`${this.baseUrl()}/instances/${this.instanceId()}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Whats2 instance status ${res.status}: ${text}`);
      throw new ServiceUnavailableException('Não foi possível consultar a instância Whats2');
    }
    return res.json() as Promise<{
      id: string;
      status: string;
      jid?: string;
      label?: string;
    }>;
  }

  /**
   * GET /instances/:id antes do envio: status + bloqueio "mensagem para o próprio número da sessão".
   */
  private async ensureOutboundRecipient(to: string): Promise<string> {
    const s = await this.getInstanceStatus();
    if (s.status !== 'connected') {
      throw new BadRequestException(
        `A instância Whats2 não está conectada (status atual: "${s.status}"). ` +
          `Abra o painel Whats2, escaneie o QR Code ou reconecte a instância; ` +
          `sem conexão as mensagens não são entregues.`,
      );
    }
    if (!s.jid?.trim()) {
      this.logger.warn(
        'Whats2 retornou status=connected sem jid — sessão pode estar incompleta; verifique o pareamento.',
      );
    }
    const recipient = this.formatRecipientForWhats2Api(to);
    this.assertNotSendingToSelf(s.jid, recipient);
    this.logger.debug(
      `Whats2 outbound: instance_jid=${s.jid ?? 'n/d'} recipient=${recipient}`,
    );
    return recipient;
  }

  /**
   * Extrai dígitos do "usuário" do JID (antes de @).
   * Formato multi-device: `558486460017:96@s.whatsapp.net` → só o trecho antes de `:` conta como telefone.
   */
  private jidUserToPhoneDigits(userPart: string): string {
    const head = userPart.includes(':') ? userPart.split(':')[0] : userPart;
    return head.replace(/\D/g, '');
  }

  /** Enviar para o mesmo número da sessão pareada: a API pode aceitar, mas o WhatsApp não entrega. */
  private assertNotSendingToSelf(instanceJid: string | undefined, recipient: string): void {
    if (!instanceJid?.includes('@')) {
      return;
    }
    if (recipient.includes('@g.us')) {
      return;
    }
    const selfDigits = this.jidUserToPhoneDigits(instanceJid.split('@')[0]);
    const destDigits = recipient.includes('@')
      ? this.jidUserToPhoneDigits(recipient.split('@')[0])
      : recipient.replace(/\D/g, '');
    if (selfDigits.length >= 10 && destDigits.length >= 10 && destDigits === selfDigits) {
      throw new BadRequestException(
        'O destino é o mesmo número WhatsApp conectado à instância Whats2. ' +
          'Cadastre o telefone de outra pessoa (cliente). Não é possível enviar do número da API para o próprio número.',
      );
    }
  }

  /**
   * Painel/API Whats2 (ex.: POST .../messages/text) usa `"to": "558487125156"` — só dígitos.
   * Grupos continuam como `id@g.us` (só dígitos perderia o sufixo).
   */
  private formatRecipientForWhats2Api(to: string): string {
    const t = to.trim();
    if (!t) {
      throw new BadRequestException('Destino da mensagem vazio');
    }
    if (t.includes('@g.us')) {
      const local = t.split('@')[0].replace(/\D/g, '');
      return `${local}@g.us`;
    }
    const digits = t.includes('@')
      ? t.split('@')[0].replace(/\D/g, '')
      : t.replace(/\D/g, '');
    if (!digits) {
      throw new BadRequestException('Número ou JID de destino inválido');
    }
    return digits;
  }

  private async login(): Promise<string> {
    const email = this.config.get<string>('WHATS2_EMAIL');
    const password = this.config.get<string>('WHATS2_PASSWORD');
    if (!email || !password) {
      throw new ServiceUnavailableException('WHATS2_EMAIL ou WHATS2_PASSWORD não configurados');
    }
    const res = await fetch(`${this.baseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = (await res.json()) as Whats2LoginResponse & {
      error?: string;
      access_token?: string;
      data?: { token?: string };
      accessToken?: string;
    };
    const token =
      body.token ||
      body.access_token ||
      body.data?.token ||
      (typeof body.accessToken === 'string' ? body.accessToken : undefined);
    if (!res.ok || !token) {
      this.logger.error(`Whats2 login failed ${res.status}: ${JSON.stringify(body)}`);
      throw new ServiceUnavailableException('Falha na autenticação Whats2');
    }
    return token;
  }

  async getBearerToken(): Promise<string> {
    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiresAt - 60_000) {
      return this.cachedToken;
    }
    const token = await this.login();
    this.cachedToken = token;
    this.tokenExpiresAt = now + 6 * 24 * 60 * 60 * 1000;
    return token;
  }

  async sendText(to: string, text: string): Promise<{ message_id?: string; timestamp?: string }> {
    const recipient = await this.ensureOutboundRecipient(to);
    const token = await this.getBearerToken();
    const res = await fetch(
      `${this.baseUrl()}/instances/${this.instanceId()}/messages/text`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: recipient, text }),
      },
    );
    if (res.status === 401) {
      this.cachedToken = null;
      return this.sendText(to, text);
    }
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Whats2 send text ${res.status}: ${JSON.stringify(body)}`);
      throw new ServiceUnavailableException('Falha ao enviar mensagem de texto');
    }
    this.logger.debug(
      `Whats2 texto aceito pela API: to=${recipient} message_id=${(body as { message_id?: string }).message_id ?? '?'}`,
    );
    return body as { message_id?: string; timestamp?: string };
  }

  async sendImage(
    to: string,
    payload: { base64: string; mime_type: string; caption?: string },
  ): Promise<{ message_id?: string; timestamp?: string }> {
    return this.postJson(`/instances/${this.instanceId()}/messages/image`, to, payload);
  }

  async sendAudio(
    to: string,
    payload: { base64: string; mime_type: string },
  ): Promise<{ message_id?: string; timestamp?: string }> {
    return this.postJson(`/instances/${this.instanceId()}/messages/audio`, to, payload);
  }

  async sendDocument(
    to: string,
    payload: {
      base64: string;
      mime_type: string;
      filename: string;
      caption?: string;
    },
  ): Promise<{ message_id?: string; timestamp?: string }> {
    return this.postJson(`/instances/${this.instanceId()}/messages/document`, to, payload);
  }

  private async postJson(
    path: string,
    to: string,
    body: Record<string, unknown>,
  ): Promise<{ message_id?: string; timestamp?: string }> {
    const recipient = await this.ensureOutboundRecipient(to);
    const token = await this.getBearerToken();
    const res = await fetch(`${this.baseUrl()}${path}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to: recipient, ...body }),
    });
    if (res.status === 401) {
      this.cachedToken = null;
      return this.postJson(path, to, body);
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      this.logger.error(`Whats2 ${path} ${res.status}: ${JSON.stringify(json)}`);
      throw new ServiceUnavailableException('Falha ao enviar mídia');
    }
    return json as { message_id?: string; timestamp?: string };
  }

  /**
   * Tenta confirmar na API Whats2 se o destino tem WhatsApp (quando o servidor expõe endpoint).
   * Se nenhum endpoint responder (404), só o formato local foi validado.
   */
  async checkRecipientRegisteredOnWhatsApp(to: string): Promise<void> {
    let status: { status: string; jid?: string };
    try {
      status = await this.getInstanceStatus();
    } catch {
      this.logger.warn(
        'Whats2: instância inacessível; não foi possível verificar o número na rede.',
      );
      return;
    }
    if (status.status !== 'connected') {
      this.logger.warn(
        'Whats2: instância desconectada; verificação de existência no WhatsApp ignorada.',
      );
      return;
    }
    const recipient = this.formatRecipientForWhats2Api(to);
    const digits = recipient.includes('@')
      ? recipient.split('@')[0].replace(/\D/g, '')
      : recipient.replace(/\D/g, '');
    const token = await this.getBearerToken();
    const id = this.instanceId();
    const base = this.baseUrl();

    const custom = this.config.get<string>('WHATS2_CHECK_EXISTS_PATH')?.trim();
    const paths: { method: 'GET' | 'POST'; path: string; body?: Record<string, unknown> }[] = [];
    if (custom) {
      paths.push({
        method: 'POST',
        path: custom.includes('{')
          ? custom.replace(/\{instanceId\}/g, id).replace(/\{id\}/g, id)
          : custom,
        body: { jid: recipient, phone: digits, to: recipient },
      });
    }
    paths.push(
      { method: 'POST', path: `/instances/${id}/contacts/check`, body: { jid: recipient } },
      { method: 'POST', path: `/instances/${id}/contacts/check`, body: { phone: digits } },
      { method: 'POST', path: `/instances/${id}/on-whatsapp`, body: { number: digits } },
      {
        method: 'GET',
        path: `/instances/${id}/contacts/${encodeURIComponent(recipient)}`,
      },
    );

    for (const att of paths) {
      const url = `${base}${att.path.startsWith('/') ? att.path : `/${att.path}`}`;
      const res = await fetch(url, {
        method: att.method,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(att.method === 'POST' ? { 'Content-Type': 'application/json' } : {}),
        },
        body:
          att.method === 'POST' && att.body
            ? JSON.stringify(att.body)
            : undefined,
      });
      if (res.status === 404 || res.status === 405) {
        continue;
      }
      if (res.status === 401) {
        this.cachedToken = null;
        return this.checkRecipientRegisteredOnWhatsApp(to);
      }
      const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        continue;
      }
      const explicitlyNo =
        json.exists === false ||
        json.on_whatsapp === false ||
        json.registered === false ||
        json.valid === false ||
        json.is_registered === false;
      const explicitlyYes =
        json.exists === true ||
        json.on_whatsapp === true ||
        json.registered === true ||
        json.valid === true ||
        json.is_registered === true;
      if (explicitlyNo && !explicitlyYes) {
        throw new BadRequestException(
          'Este número não está registrado no WhatsApp ou não foi encontrado.',
        );
      }
      if (explicitlyYes || json.jid != null || json.id != null) {
        this.logger.debug(`Whats2: destino confirmado (${att.method} ${att.path})`);
        return;
      }
    }
    this.logger.debug(
      'Whats2: API não expôs verificação de número; validação ficou só no formato (E.164).',
    );
  }

  async registerWebhook(publicUrl: string, webhookSecret?: string): Promise<void> {
    const token = await this.getBearerToken();
    const base = publicUrl.replace(/\/$/, '');
    const q = webhookSecret ? `?token=${encodeURIComponent(webhookSecret)}` : '';
    const url = `${base}/api/v1/webhooks/whats2${q}`;
    const res = await fetch(`${this.baseUrl()}/instances/${this.instanceId()}/webhook`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });
    if (!res.ok) {
      const text = await res.text();
      this.logger.warn(`Whats2 register webhook failed ${res.status}: ${text}`);
      return;
    }
    this.logger.log(`Whats2 webhook registrado: ${url}`);
  }

  /** Diagnóstico para o painel (instância + variáveis de webhook). */
  async getIntegrationDiagnostics(): Promise<{
    instance: {
      id: string;
      status: string;
      jid?: string;
      label?: string;
    };
    webhook: {
      tenantCnpjConfigured: boolean;
      publicBaseUrlConfigured: boolean;
      autoRegisterEnabled: boolean;
      secretConfigured: boolean;
      expectedPath: string;
    };
  }> {
    const instance = await this.getInstanceStatus();
    return {
      instance,
      webhook: {
        tenantCnpjConfigured: Boolean(
          this.config.get<string>('WHATS2_WEBHOOK_TENANT_CNPJ')?.trim(),
        ),
        publicBaseUrlConfigured: Boolean(
          this.config.get<string>('WEBHOOK_PUBLIC_BASE_URL')?.trim(),
        ),
        autoRegisterEnabled: ['true', '1'].includes(
          String(this.config.get<string>('WHATS2_AUTO_REGISTER_WEBHOOK') ?? ''),
        ),
        secretConfigured: Boolean(
          this.config.get<string>('WHATS2_WEBHOOK_SECRET')?.trim(),
        ),
        expectedPath: '/api/v1/webhooks/whats2',
      },
    };
  }
}
