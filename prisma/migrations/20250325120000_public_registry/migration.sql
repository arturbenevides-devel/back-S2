CREATE TABLE IF NOT EXISTS "public"."tenant_registry" (
    "id" TEXT NOT NULL,
    "schema_name" VARCHAR(14) NOT NULL,
    "company_name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_registry_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "tenant_registry_schema_name_key" ON "public"."tenant_registry"("schema_name");
