-- Garante colunas do DDL atual em whatsapp_conversations legadas (CREATE TABLE IF NOT EXISTS não recria)
-- Corrige: column "updated_at" does not exist, "last_seen" does not exist, etc.

ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "chat_id" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "contact_name" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "contact_phone" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "contact_avatar" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "status" TEXT NOT NULL DEFAULT 'offline';
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "last_seen" TIMESTAMP(3);
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "category" TEXT NOT NULL DEFAULT 'lead';
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "ai_enabled" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "read_status" TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "is_group" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "assigned_to" TEXT;
ALTER TABLE "whatsapp_conversations" ADD COLUMN IF NOT EXISTS "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
