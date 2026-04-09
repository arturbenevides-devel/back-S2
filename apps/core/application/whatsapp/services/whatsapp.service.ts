import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { WhatsappRepository } from '../repositories/whatsapp.repository';
import { Whats2ApiService } from './whats2-api.service';
import { WhatsappEventsService } from './whatsapp-events.service';
import type { WhatsappConversationRow, WhatsappMessageRow } from '../repositories/whatsapp.repository';
import {
  digitsOnlyForWhatsapp,
  validateWhatsappDestinationDigits,
} from '../utils/whatsapp-phone.util';
import { transcodeWebmForWhatsappOutbound } from '../utils/whatsapp-audio-transcode.util';
import { transcodeWebmVideoToMp4 } from '../utils/whatsapp-video-transcode.util';

function normalizeChatId(input: string): string {
  const t = input.trim();
  if (t.includes('@g.us')) {
    const local = t.split('@')[0].replace(/\D/g, '');
    return `${local}@g.us`;
  }
  const rawDigits = t.includes('@')
    ? t.split('@')[0].replace(/\D/g, '')
    : t.replace(/\D/g, '');
  return `${rawDigits}@s.whatsapp.net`;
}

function phoneFromChatId(chatId: string): string {
  return chatId.split('@')[0] || chatId;
}

const MAX_DATA_URL_BYTES = 32 * 1024 * 1024;
const MAX_AUDIO_MEDIA_BASE64_BYTES = 8 * 1024 * 1024;

function stripDataUrlBase64(input: string): string {
  const t = input.trim();
  const idx = t.indexOf('base64,');
  if (t.startsWith('data:') && idx !== -1) {
    return t.slice(idx + 7).replace(/\s/g, '');
  }
  return t.replace(/\s/g, '');
}

function dataUrlForInlinePreview(mime: string, base64Raw: string): string | undefined {
  try {
    const buf = Buffer.from(base64Raw, 'base64');
    if (buf.length > MAX_DATA_URL_BYTES) return undefined;
    return `data:${mime};base64,${base64Raw}`;
  } catch {
    return undefined;
  }
}

@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(
    private readonly repo: WhatsappRepository,
    private readonly whats2: Whats2ApiService,
    private readonly events: WhatsappEventsService,
    private readonly config: ConfigService,
  ) {}

  private tenantFromEnv(): string {
    const raw = this.config.get<string>('WHATS2_WEBHOOK_TENANT_CNPJ');
    const cnpj = raw?.replace(/\D/g, '') ?? '';
    if (cnpj.length !== 14) {
      throw new BadRequestException('WHATS2_WEBHOOK_TENANT_CNPJ inválido ou ausente');
    }
    return cnpj;
  }

  async listConversations(schema: string, userId: string) {
    const rows = await this.repo.listConversationsForUser(schema, userId);
    return rows.map((r) => this.mapConversation(r));
  }

  async getMessages(schema: string, conversationId: string, userId: string) {
    const rows = await this.repo.listMessages(schema, conversationId, userId);
    return rows.map((m) => this.mapMessage(m));
  }

  async claim(schema: string, conversationId: string, userId: string) {
    const conv = await this.repo.findConversationById(schema, conversationId, userId);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    await this.repo.claimConversation(schema, conversationId, userId);
    await this.notifyConversationSubscribers(schema, conversationId, {
      type: 'conversation',
      conversationId,
    });
  }

  async markRead(schema: string, conversationId: string, userId: string) {
    const conv = await this.repo.findConversationById(schema, conversationId, userId);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    await this.repo.markRead(schema, conversationId);
    await this.notifyConversationSubscribers(schema, conversationId, {
      type: 'conversation',
      conversationId,
    });
  }

  async createConversation(
    schema: string,
    userId: string,
    body: { phone: string; contactName?: string; contact_name?: string },
  ) {
    const contactLabel =
      body.contactName?.trim() || body.contact_name?.trim() || undefined;
    const digits = digitsOnlyForWhatsapp(body.phone);
    const validation = validateWhatsappDestinationDigits(digits);
    if (validation.ok === false) {
      throw new BadRequestException(validation.message);
    }
    await this.whats2.checkRecipientRegisteredOnWhatsApp(digits);
    const chatId = `${digits}@s.whatsapp.net`;
    const existing = await this.repo.findConversationByChatId(schema, chatId);
    if (existing) {
      if (
        existing.assigned_to &&
        existing.assigned_to !== userId
      ) {
        throw new ForbiddenException('Conversa pertence a outro atendente');
      }
      return this.mapConversation(existing);
    }
    const id = randomUUID();
    const phone = phoneFromChatId(chatId);
    const row: Omit<WhatsappConversationRow, 'created_at' | 'updated_at'> = {
      id,
      chat_id: chatId,
      contact_name: contactLabel ?? null,
      contact_phone: phone,
      contact_avatar: null,
      status: 'offline',
      last_seen: null,
      category: 'lead',
      ai_enabled: true,
      read_status: 'pending',
      assigned_to: userId,
      tags: [],
      is_group: chatId.endsWith('@g.us'),
    };
    await this.repo.createConversation(schema, row);
    const created = await this.repo.findConversationById(schema, id, userId);
    if (!created) throw new NotFoundException();
    this.events.notifyTenant(schema, {
      type: 'conversation',
      conversationId: id,
    });
    return this.mapConversation(created);
  }

  async sendText(
    schema: string,
    userId: string,
    conversationId: string,
    text: string,
  ) {
    const conv = await this.repo.findConversationById(schema, conversationId, userId);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    const res = await this.whats2.sendText(conv.chat_id, text);
    const msgId = randomUUID();
    await this.repo.insertMessage(schema, {
      id: msgId,
      conversation_id: conversationId,
      message_id: res.message_id ?? null,
      content: text,
      sender: 'agent',
      message_type: 'text',
      status: 'sent',
      timestamp: new Date(),
      metadata: {},
    });
    await this.repo.touchConversationUpdated(schema, conversationId);
    await this.notifyConversationSubscribers(schema, conversationId, {
      type: 'message',
      conversationId,
    });
    return { ok: true, messageId: msgId };
  }

  async sendMedia(
    schema: string,
    userId: string,
    conversationId: string,
    body: {
      kind: 'image' | 'audio' | 'video';
      base64: string;
      mime_type: string;
      caption?: string;
      filename?: string;
    },
  ) {
    const conv = await this.repo.findConversationById(schema, conversationId, userId);
    if (!conv) throw new NotFoundException('Conversa não encontrada');
    let apiRes: { message_id?: string };
    const to = conv.chat_id;
    const rawB64 = stripDataUrlBase64(body.base64);
    if (body.kind === 'image') {
      apiRes = await this.whats2.sendImage(to, {
        base64: rawB64,
        mime_type: body.mime_type,
        caption: body.caption,
      });
    } else if (body.kind === 'audio') {
      let audioB64 = rawB64;
      let audioMime = body.mime_type;
      if (/webm/i.test(audioMime)) {
        try {
          const out = await transcodeWebmForWhatsappOutbound(rawB64);
          audioB64 = out.base64;
          audioMime = out.mime_type;
          this.logger.log(
            `Áudio WebM transcodificado para envio WhatsApp: ${out.mime_type}`,
          );
        } catch (e) {
          throw new BadRequestException(
            'Áudio WebM precisa ser convertido no servidor para envio nativo (Whats2: POST /messages/audio). ' +
              'Instale o ffmpeg no servidor (ex.: sudo apt install ffmpeg) ou defina FFMPEG_PATH. ' +
              `Detalhe: ${(e as Error).message}`,
          );
        }
      }
      apiRes = await this.whats2.sendAudio(to, {
        base64: audioB64,
        mime_type: audioMime,
      });
    } else {
      let videoB64 = rawB64;
      let videoMime = body.mime_type;
      let videoFilename = body.filename?.trim() || 'video.mp4';
      if (/webm/i.test(videoMime)) {
        try {
          const out = await transcodeWebmVideoToMp4(rawB64);
          videoB64 = out.base64;
          videoMime = out.mime_type;
          if (!/\.mp4$/i.test(videoFilename)) {
            videoFilename = 'video.mp4';
          }
          this.logger.log('Vídeo WebM transcodificado para MP4 (envio nativo /messages/video).');
        } catch (e) {
          throw new BadRequestException(
            'Vídeo WebM precisa ser convertido para MP4 no servidor para exibição nativa no WhatsApp. ' +
              'Instale o ffmpeg (ex.: sudo apt install ffmpeg) ou defina FFMPEG_PATH. ' +
              `Detalhe: ${(e as Error).message}`,
          );
        }
      }
      apiRes = await this.whats2.sendVideo(to, {
        base64: videoB64,
        mime_type: videoMime,
        caption: body.caption,
        filename: videoFilename,
      });
    }
    const msgId = randomUUID();
    const messageType =
      body.kind === 'image' ? 'image' : body.kind === 'audio' ? 'audio' : 'video';
    const content =
      body.kind === 'image'
        ? body.caption || '📷 Imagem'
        : body.kind === 'audio'
          ? '🎵 Áudio'
          : body.caption || '🎬 Vídeo';
    const inlinePreview = dataUrlForInlinePreview(body.mime_type, rawB64);
    let decodedLen = 0;
    try {
      decodedLen = Buffer.from(rawB64, 'base64').length;
    } catch {
      decodedLen = 0;
    }
    const storeMediaBase64 =
      body.kind === 'audio'
        ? decodedLen > 0 && decodedLen <= MAX_AUDIO_MEDIA_BASE64_BYTES
        : decodedLen > 0 && decodedLen <= MAX_DATA_URL_BYTES;
    await this.repo.insertMessage(schema, {
      id: msgId,
      conversation_id: conversationId,
      message_id: apiRes.message_id ?? null,
      content,
      sender: 'agent',
      message_type: messageType,
      status: 'sent',
      timestamp: new Date(),
      metadata: {
        mime_type: body.mime_type,
        outbound: true,
        ...(storeMediaBase64 ? { media_base64: rawB64 } : {}),
        ...(inlinePreview ? { downloadUrl: inlinePreview } : {}),
      },
    });
    await this.repo.touchConversationUpdated(schema, conversationId);
    await this.notifyConversationSubscribers(schema, conversationId, {
      type: 'message',
      conversationId,
    });
    return { ok: true, messageId: msgId };
  }

  async handleWebhookPayload(body: Record<string, unknown>): Promise<void> {
    const normalized = this.normalizeWhats2Webhook(body);
    const expected = this.config.get<string>('WHATS2_INSTANCE_ID')?.trim();
    if (
      expected &&
      normalized.instanceId &&
      normalized.instanceId.toLowerCase() !== expected.toLowerCase()
    ) {
      this.logger.warn(
        `Webhook Whats2 ignorado: instance_id "${normalized.instanceId}" ≠ WHATS2_INSTANCE_ID`,
      );
      return;
    }

    const schema = this.tenantFromEnv();
    const ev = normalized.event;

    if (
      ev === 'connected' ||
      ev === 'disconnected' ||
      ev === 'logged_out' ||
      ev === 'connection.update'
    ) {
      this.logger.log(`Whats2 evento de sessão: ${ev}`);
      return;
    }

    /** Baileys/Whats2 costuma enviar `messages.upsert` com array aninhado — antes era ignorado. */
    const fromUpsert = this.extractInboundPayloadsFromWebhook(body);
    if (fromUpsert.length > 0) {
      for (const payload of fromUpsert) {
        await this.ingestInboundMessage(schema, payload);
      }
      return;
    }

    if (
      ev !== 'message' &&
      ev !== 'messages.upsert' &&
      ev !== 'messages_upsert' &&
      ev !== 'chat' &&
      ev !== 'new_message'
    ) {
      this.logger.verbose(`Whats2 webhook evento não tratado: "${ev || '(vazio)'}"`);
      return;
    }

    await this.ingestInboundMessage(schema, normalized.data);
  }

  /**
   * Extrai mensagens no formato Baileys (`messages.upsert` → `messages[]`) para o formato esperado por `ingestInboundMessage`.
   */
  private extractInboundPayloadsFromWebhook(body: Record<string, unknown>): Record<string, unknown>[] {
    const messageObjects: unknown[] = [];

    const collectFromUpsertBlock = (block: unknown) => {
      if (!block || typeof block !== 'object' || Array.isArray(block)) return;
      const msgs = (block as Record<string, unknown>).messages;
      if (Array.isArray(msgs)) {
        messageObjects.push(...msgs);
      }
    };

    collectFromUpsertBlock(body['messages.upsert']);
    collectFromUpsertBlock(body['messages_upsert']);
    collectFromUpsertBlock(body.data);

    if (Array.isArray(body.messages)) {
      messageObjects.push(...body.messages);
    }

    const out: Record<string, unknown>[] = [];
    for (const item of messageObjects) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) continue;
      const flat = this.flattenBaileysWebMessage(item as Record<string, unknown>);
      if (flat) out.push(flat);
    }

    if (out.length === 0) {
      const single = this.flattenBaileysWebMessage(body);
      if (single) out.push(single);
    }

    if (out.length === 0) {
      const legacy =
        body.from != null ||
        body.chat != null ||
        body.text != null ||
        (body as { remoteJid?: string }).remoteJid != null ||
        (body.key as { remoteJid?: string } | undefined)?.remoteJid != null;
      if (legacy) {
        out.push({ ...body } as Record<string, unknown>);
      }
    }

    if (out.length === 0 && body.data && typeof body.data === 'object' && !Array.isArray(body.data)) {
      const d = body.data as Record<string, unknown>;
      const nestedLegacy =
        d.from != null ||
        d.chat != null ||
        d.text != null ||
        (d as { remoteJid?: string }).remoteJid != null ||
        (d.key as { remoteJid?: string } | undefined)?.remoteJid != null;
      if (nestedLegacy && !Array.isArray(d.messages)) {
        out.push(d);
      }
    }

    return out;
  }

  private flattenBaileysWebMessage(m: Record<string, unknown>): Record<string, unknown> | null {
    const key = m.key as { remoteJid?: string; fromMe?: boolean; id?: string } | undefined;
    const remoteJid =
      key?.remoteJid ||
      (m.remoteJid as string | undefined) ||
      (m.chat as string | undefined) ||
      (m.from as string | undefined);
    if (!remoteJid?.trim()) {
      return null;
    }
    if (remoteJid === 'status@broadcast') {
      return null;
    }
    if (key?.fromMe === true) {
      return null;
    }

    const inner = m.message as Record<string, unknown> | undefined;
    if (inner?.reactionMessage || inner?.protocolMessage) {
      return null;
    }

    let text = '';
    let mediaType: string | undefined;
    let caption = '';

    if (inner) {
      if (typeof inner.conversation === 'string') {
        text = inner.conversation;
      }
      const ext = inner.extendedTextMessage as { text?: string } | undefined;
      if (ext?.text) {
        text = ext.text;
      }
      const img = inner.imageMessage as { caption?: string } | undefined;
      if (img) {
        mediaType = 'image';
        caption = img.caption || '';
        text = caption || text || '📷 Imagem';
      }
      if (!mediaType) {
        const vid = inner.videoMessage as { caption?: string } | undefined;
        if (vid) {
          mediaType = 'video';
          caption = vid.caption || '';
          text = caption || text || '🎬 Vídeo';
        }
      }
      if (!mediaType && inner.audioMessage) {
        mediaType = 'audio';
        text = text || '🎵 Áudio';
      }
      if (!mediaType) {
        const doc = inner.documentMessage as { caption?: string; fileName?: string } | undefined;
        if (doc) {
          mediaType = 'document';
          text = doc.caption || doc.fileName || text || '📎 Documento';
        }
      }
      if (!mediaType && inner.stickerMessage) {
        mediaType = 'image';
        text = text || '🎭 Figurinha';
      }
    }

    if (!text && !mediaType) {
      return null;
    }

    const pushName =
      (m.pushName as string) ||
      (m.push_name as string) ||
      (m.notifyName as string) ||
      null;

    let mediaBase64 = typeof m.media_base64 === 'string' ? m.media_base64 : undefined;
    if (!mediaBase64 && inner) {
      const pick = (obj: Record<string, unknown> | undefined) =>
        obj && typeof obj.base64 === 'string' ? (obj.base64 as string) : undefined;
      mediaBase64 =
        pick(inner.audioMessage as Record<string, unknown> | undefined) ||
        pick(inner.videoMessage as Record<string, unknown> | undefined) ||
        pick(inner.imageMessage as Record<string, unknown> | undefined);
    }

    return {
      ...m,
      key: m.key,
      remoteJid,
      chat: remoteJid,
      text,
      body: text,
      pushName,
      push_name: pushName,
      media_type: mediaType,
      media_base64: mediaBase64,
      is_group: remoteJid.endsWith('@g.us'),
      message_id: key?.id,
    };
  }

  private normalizeWhats2Webhook(body: Record<string, unknown>): {
    event: string;
    instanceId?: string;
    data: Record<string, unknown>;
  } {
    const rawEvent = body.event ?? body.type ?? (body as { name?: string }).name;
    const event =
      typeof rawEvent === 'string' ? rawEvent.trim().toLowerCase() : '';

    const rawInst = body.instance_id ?? body.instanceId;
    const instanceId =
      typeof rawInst === 'string' ? rawInst.trim() : undefined;

    const rawData = body.data;
    if (rawData && typeof rawData === 'object' && !Array.isArray(rawData)) {
      return { event, instanceId, data: rawData as Record<string, unknown> };
    }

    if (
      body.from != null ||
      body.chat != null ||
      body.text != null ||
      (body as { remoteJid?: string }).remoteJid != null
    ) {
      return {
        event: event || 'message',
        instanceId,
        data: { ...body } as Record<string, unknown>,
      };
    }

    return { event, instanceId, data: {} };
  }

  private async ingestInboundMessage(
    schema: string,
    data: Record<string, unknown>,
  ): Promise<void> {
    const chat =
      (data.chat as string) ||
      (data.remoteJid as string) ||
      (data.from as string) ||
      (data.key as { remoteJid?: string } | undefined)?.remoteJid;
    if (!chat) {
      this.logger.warn('Webhook message sem chat/from — payload ignorado');
      return;
    }
    const messageId =
      (data.message_id as string) ||
      ((data.key as { id?: string } | undefined)?.id as string | undefined) ||
      randomUUID();
    const isGroup = Boolean(data.is_group);
    const pushName =
      (data.push_name as string) ||
      (data.pushName as string) ||
      (data.notifyName as string) ||
      null;
    const text =
      (data.text as string) ||
      (data.body as string) ||
      (data.caption as string) ||
      '';
    const mediaType = data.media_type as string | undefined;
    const mediaBase64 = data.media_base64 as string | undefined;
    const mimeType = (data.mime_type as string) || 'application/octet-stream';

    let content = text;
    let msgType = 'text';
    const metadata: Record<string, unknown> = { raw: data };

    if (mediaType === 'image' || mediaType === 'audio' || mediaType === 'video') {
      msgType = mediaType === 'video' ? 'video' : mediaType;
      content =
        mediaType === 'image'
          ? text || '📷 Imagem'
          : mediaType === 'audio'
            ? '🎵 Áudio'
            : text || '🎬 Vídeo';
      if (mediaBase64) {
        metadata.downloadUrl = `data:${mimeType};base64,${mediaBase64}`;
      }
      metadata.mime_type = mimeType;
    } else if (mediaType === 'document' && (mimeType.startsWith('video/') || data.filename)) {
      msgType = 'video';
      content = text || '🎬 Vídeo';
      if (mediaBase64) {
        metadata.downloadUrl = `data:${mimeType};base64,${mediaBase64}`;
      }
    }

    const chatId = normalizeChatId(chat);
    let conv = await this.repo.findConversationByChatId(schema, chatId);
    const now = new Date();
    if (!conv) {
      const id = randomUUID();
      await this.repo.createConversation(schema, {
        id,
        chat_id: chatId,
        contact_name: pushName,
        contact_phone: phoneFromChatId(chatId),
        contact_avatar: null,
        status: 'online',
        last_seen: now,
        category: 'lead',
        ai_enabled: true,
        read_status: 'unread',
        assigned_to: null,
        tags: [],
        is_group: isGroup,
      });
      conv = await this.repo.findConversationByChatId(schema, chatId);
    } else {
      await this.repo.bumpInboundActivity(schema, conv.id, now, pushName);
    }
    if (!conv) return;

    const extId = messageId;
    if (extId && (await this.repo.messageExists(schema, conv.id, extId))) {
      return;
    }

    await this.repo.insertMessage(schema, {
      id: randomUUID(),
      conversation_id: conv.id,
      message_id: extId || null,
      content,
      sender: 'customer',
      message_type: msgType,
      status: 'delivered',
      timestamp: now,
      metadata,
    });

    this.events.notifyTenant(schema, {
      type: 'message',
      conversationId: conv.id,
    });
    this.events.notifyTenant(schema, {
      type: 'conversation',
      conversationId: conv.id,
    });
  }

  private async notifyConversationSubscribers(
    schema: string,
    conversationId: string,
    payload: import('./whatsapp-events.service').WhatsAppSsePayload,
  ): Promise<void> {
    const conv = await this.repo.findConversationByIdUnscoped(schema, conversationId);
    if (!conv) return;
    this.events.notifyTenant(schema, payload);
  }

  private mapConversation(
    r: WhatsappConversationRow & { last_message_preview?: string | null },
  ) {
    return {
      id: r.id,
      chat_id: r.chat_id,
      contact_name: r.contact_name,
      contact_phone: r.contact_phone,
      contact_avatar: r.contact_avatar,
      status: r.status,
      category: r.category,
      tags: r.tags,
      assigned_to: r.assigned_to,
      ai_enabled: r.ai_enabled,
      read_status: r.read_status,
      last_seen: r.last_seen?.toISOString() ?? null,
      is_group: r.is_group,
      created_at: r.created_at.toISOString(),
      updated_at: r.updated_at.toISOString(),
      last_message_preview: r.last_message_preview ?? null,
    };
  }

  private mapMessage(m: WhatsappMessageRow) {
    let meta: Record<string, unknown> = {};
    if (typeof m.metadata === 'string') {
      try {
        meta = JSON.parse(m.metadata) as Record<string, unknown>;
      } catch {
        meta = {};
      }
    } else if (typeof m.metadata === 'object' && m.metadata !== null) {
      meta = m.metadata as Record<string, unknown>;
    }
    return {
      id: m.id,
      conversation_id: m.conversation_id,
      content: m.content,
      sender: m.sender === 'agent' ? 'agent' : 'customer',
      timestamp: m.timestamp.toISOString(),
      message_type: m.message_type,
      status: m.status,
      metadata: meta,
    };
  }
}
