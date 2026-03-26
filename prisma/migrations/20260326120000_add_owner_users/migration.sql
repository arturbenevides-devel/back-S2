-- Tabela de super admins (Owner) no schema público
CREATE TABLE "public"."owner_users" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "password" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3),

    CONSTRAINT "owner_users_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "owner_users_email_key" ON "public"."owner_users"("email");
