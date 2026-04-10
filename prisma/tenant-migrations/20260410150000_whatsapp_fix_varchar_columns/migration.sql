ALTER TABLE "whatsapp_conversations"
  ALTER COLUMN "chat_id"       TYPE TEXT,
  ALTER COLUMN "contact_name"  TYPE TEXT,
  ALTER COLUMN "contact_phone" TYPE TEXT,
  ALTER COLUMN "contact_avatar" TYPE TEXT,
  ALTER COLUMN "status"        TYPE TEXT,
  ALTER COLUMN "category"      TYPE TEXT,
  ALTER COLUMN "read_status"   TYPE TEXT,
  ALTER COLUMN "assigned_to"   TYPE TEXT;

ALTER TABLE "whatsapp_messages"
  ALTER COLUMN "message_id"    TYPE TEXT,
  ALTER COLUMN "content"       TYPE TEXT,
  ALTER COLUMN "sender"        TYPE TEXT,
  ALTER COLUMN "message_type"  TYPE TEXT,
  ALTER COLUMN "status"        TYPE TEXT;
