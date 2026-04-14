import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { TenantPrismaRunner } from '@common/tenant/tenant-prisma.runner';

export interface WhatsappConversationRow {
  id: string;
  chat_id: string;
  contact_name: string | null;
  contact_phone: string;
  contact_avatar: string | null;
  status: string;
  last_seen: Date | null;
  category: string;
  ai_enabled: boolean;
  read_status: string;
  assigned_to: string | null;
  tags: string[];
  is_group: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WhatsappMessageRow {
  id: string;
  conversation_id: string;
  message_id: string | null;
  content: string;
  sender: string;
  message_type: string;
  status: string;
  timestamp: Date;
  metadata: Prisma.JsonValue;
}

@Injectable()
export class WhatsappRepository {
  constructor(private readonly runner: TenantPrismaRunner) {}

  async listConversationsForUser(
    schema: string,
    userId: string,
  ): Promise<(WhatsappConversationRow & { last_message_preview: string | null })[]> {
    return this.runner.run(schema, async (tx) => {
      return tx.$queryRaw<
        (WhatsappConversationRow & { last_message_preview: string | null })[]
      >`
        SELECT c.*,
          (
            SELECT m.content FROM whatsapp_messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.timestamp DESC NULLS LAST
            LIMIT 1
          ) AS last_message_preview
        FROM whatsapp_conversations c
        WHERE c."assigned_to" = ${userId}
        ORDER BY c."updated_at" DESC
      `;
    });
  }

  async listUnassignedConversations(
    schema: string,
  ): Promise<(WhatsappConversationRow & { last_message_preview: string | null })[]> {
    return this.runner.run(schema, async (tx) => {
      return tx.$queryRaw<
        (WhatsappConversationRow & { last_message_preview: string | null })[]
      >`
        SELECT c.*,
          (
            SELECT m.content FROM whatsapp_messages m
            WHERE m.conversation_id = c.id
            ORDER BY m.timestamp DESC NULLS LAST
            LIMIT 1
          ) AS last_message_preview
        FROM whatsapp_conversations c
        WHERE c."assigned_to" IS NULL
        ORDER BY c."updated_at" DESC
      `;
    });
  }

  async findConversationById(
    schema: string,
    id: string,
    userId: string,
  ): Promise<WhatsappConversationRow | null> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<WhatsappConversationRow[]>`
        SELECT *
        FROM whatsapp_conversations
        WHERE "id" = ${id}
          AND ("assigned_to" IS NULL OR "assigned_to" = ${userId})
        LIMIT 1
      `;
      return rows[0] ?? null;
    });
  }

  async findConversationByChatId(
    schema: string,
    chatId: string,
  ): Promise<WhatsappConversationRow | null> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<WhatsappConversationRow[]>`
        SELECT * FROM whatsapp_conversations WHERE "chat_id" = ${chatId} LIMIT 1
      `;
      return rows[0] ?? null;
    });
  }

  async findConversationByIdUnscoped(
    schema: string,
    id: string,
  ): Promise<WhatsappConversationRow | null> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<WhatsappConversationRow[]>`
        SELECT * FROM whatsapp_conversations WHERE "id" = ${id} LIMIT 1
      `;
      return rows[0] ?? null;
    });
  }

  async touchConversationUpdated(schema: string, id: string): Promise<void> {
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        UPDATE whatsapp_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${id}
      `;
    });
  }

  async syncContactPhoneFromJid(schema: string, conversationId: string, chatId: string): Promise<void> {
    if (!chatId.toLowerCase().endsWith('@s.whatsapp.net')) {
      return;
    }
    const local = chatId.split('@')[0];
    const digits = local.split(':')[0].replace(/\D/g, '');
    if (digits.length < 10 || digits.length > 15) {
      return;
    }
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        UPDATE whatsapp_conversations
        SET contact_phone = ${digits}, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${conversationId}
      `;
    });
  }

  async createConversation(
    schema: string,
    row: Omit<WhatsappConversationRow, 'created_at' | 'updated_at'>,
  ): Promise<void> {
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        INSERT INTO whatsapp_conversations (
          id, chat_id, contact_name, contact_phone, contact_avatar,
          status, last_seen, category, ai_enabled, read_status,
          assigned_to, is_group, created_at, updated_at
        ) VALUES (
          ${row.id}, ${row.chat_id}, ${row.contact_name}, ${row.contact_phone}, ${row.contact_avatar},
          ${row.status}, ${row.last_seen}, ${row.category}, ${row.ai_enabled}, ${row.read_status},
          ${row.assigned_to}, ${row.is_group}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
      `;
    });
  }

  async claimConversation(schema: string, id: string, userId: string): Promise<void> {
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        UPDATE whatsapp_conversations
        SET assigned_to = ${userId}, read_status = 'unread', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    });
  }

  async markRead(schema: string, id: string): Promise<void> {
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        UPDATE whatsapp_conversations
        SET read_status = 'read', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    });
  }

  async bumpInboundActivity(
    schema: string,
    id: string,
    lastSeen: Date,
    contactName: string | null,
  ): Promise<void> {
    const push = contactName?.trim() || null;
    return this.runner.run(schema, async (tx) => {
      await tx.$executeRaw`
        UPDATE whatsapp_conversations
        SET
          contact_name = COALESCE(
            NULLIF(TRIM(COALESCE(contact_name, '')), ''),
            ${push}
          ),
          status = 'online',
          last_seen = ${lastSeen},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${id}
      `;
    });
  }

  async insertMessage(
    schema: string,
    msg: Omit<WhatsappMessageRow, 'metadata'> & { metadata: Record<string, unknown> },
  ): Promise<void> {
    return this.runner.run(schema, async (tx) => {
      const metaJson = JSON.stringify(msg.metadata ?? {});
      await tx.$executeRawUnsafe(
        `INSERT INTO whatsapp_messages (
          id, conversation_id, message_id, content, sender, message_type, status, timestamp, metadata
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb)
        ON CONFLICT (conversation_id, message_id) WHERE message_id IS NOT NULL DO NOTHING`,
        msg.id,
        msg.conversation_id,
        msg.message_id,
        msg.content,
        msg.sender,
        msg.message_type,
        msg.status,
        msg.timestamp,
        metaJson,
      );
    });
  }

  async messageExists(
    schema: string,
    conversationId: string,
    externalMessageId: string,
  ): Promise<boolean> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<{ c: bigint }[]>`
        SELECT COUNT(*)::bigint AS c FROM whatsapp_messages
        WHERE conversation_id = ${conversationId}
          AND LOWER(message_id) = LOWER(${externalMessageId})
      `;
      return Number(rows[0]?.c ?? 0) > 0;
    });
  }

  async listMessages(
    schema: string,
    conversationId: string,
    userId: string,
  ): Promise<WhatsappMessageRow[]> {
    return this.runner.run(schema, async (tx) => {
      const conv = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM whatsapp_conversations
        WHERE id = ${conversationId}
          AND ("assigned_to" = ${userId} OR "assigned_to" IS NULL)
        LIMIT 1
      `;
      if (!conv.length) return [];
      return tx.$queryRaw<WhatsappMessageRow[]>`
        SELECT id, conversation_id, message_id, content, sender, message_type, status, timestamp, metadata
        FROM whatsapp_messages
        WHERE conversation_id = ${conversationId}
        ORDER BY timestamp ASC
      `;
    });
  }

  async findMessageById(
    schema: string,
    messageId: string,
  ): Promise<WhatsappMessageRow | null> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<WhatsappMessageRow[]>`
        SELECT id, conversation_id, message_id, content, sender, message_type, status, timestamp, metadata
        FROM whatsapp_messages
        WHERE id = ${messageId}
        LIMIT 1
      `;
      return rows[0] ?? null;
    });
  }

  async listActiveUserIds(schema: string): Promise<string[]> {
    return this.runner.run(schema, async (tx) => {
      const rows = await tx.$queryRaw<{ id: string }[]>`
        SELECT id FROM users WHERE is_active = true
      `;
      return rows.map((r) => r.id);
    });
  }
}
