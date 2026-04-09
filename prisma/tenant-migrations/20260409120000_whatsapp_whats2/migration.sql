-- WhatsApp (Whats2) — conversas e mensagens por tenant
-- Modelagem alinhada ao CRM existente + isolamento por atendente (assigned_to)

CREATE TABLE IF NOT EXISTS "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "chat_id" TEXT NOT NULL,
    "contact_name" TEXT,
    "contact_phone" TEXT NOT NULL,
    "contact_avatar" TEXT,
    "status" TEXT NOT NULL DEFAULT 'offline',
    "last_seen" TIMESTAMP(3),
    "category" TEXT NOT NULL DEFAULT 'lead',
    "ai_enabled" BOOLEAN NOT NULL DEFAULT true,
    "read_status" TEXT NOT NULL DEFAULT 'pending',
    "assigned_to" TEXT,
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "is_group" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- Se a tabela já existia (schema antigo / teste manual), CREATE TABLE IF NOT EXISTS não recria colunas novas.
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "assigned_to" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_conversations_chat_id_key" ON "whatsapp_conversations"("chat_id");

CREATE INDEX IF NOT EXISTS "idx_whatsapp_conversations_assigned_to" ON "whatsapp_conversations"("assigned_to");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_conversations_read_status" ON "whatsapp_conversations"("read_status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_conversations_assigned_to_fkey'
  ) THEN
    ALTER TABLE "whatsapp_conversations"
      ADD CONSTRAINT "whatsapp_conversations_assigned_to_fkey"
      FOREIGN KEY ("assigned_to") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "message_id" TEXT,
    "content" TEXT NOT NULL,
    "sender" TEXT NOT NULL,
    "message_type" TEXT NOT NULL DEFAULT 'text',
    "status" TEXT NOT NULL DEFAULT 'sent',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- Tabela legada (ex.: cópia Supabase) pode existir sem colunas alinhadas ao DDL atual.
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "conversation_id" TEXT;
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "message_id" TEXT;
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "content" TEXT NOT NULL DEFAULT '';
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "sender" TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "message_type" TEXT NOT NULL DEFAULT 'text';
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'sent';
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "whatsapp_messages" ADD COLUMN IF NOT EXISTS "metadata" JSONB NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS "idx_whatsapp_messages_conversation_id" ON "whatsapp_messages"("conversation_id");
CREATE INDEX IF NOT EXISTS "idx_whatsapp_messages_timestamp" ON "whatsapp_messages"("timestamp" DESC);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE "whatsapp_messages"
      ADD CONSTRAINT "whatsapp_messages_conversation_id_fkey"
      FOREIGN KEY ("conversation_id") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "whatsapp_messages_conv_external_msg"
  ON "whatsapp_messages"("conversation_id", "message_id")
  WHERE "message_id" IS NOT NULL;
