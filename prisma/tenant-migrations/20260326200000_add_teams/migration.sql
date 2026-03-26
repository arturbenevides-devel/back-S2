-- Tabela de equipes
CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "created_in" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "updated_in" TIMESTAMP(3),
    "name" VARCHAR(255) NOT NULL,
    "supervisor_id" TEXT,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "teams_supervisor_id_fkey" FOREIGN KEY ("supervisor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Adicionar team_id na tabela users
ALTER TABLE "users" ADD COLUMN "team_id" TEXT;
ALTER TABLE "users" ADD CONSTRAINT "users_team_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE SET NULL ON UPDATE CASCADE;
