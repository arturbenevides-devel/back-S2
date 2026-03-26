import 'dotenv/config';
import { Client } from 'pg';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];
  const fullName = process.argv[4] || 'Owner';

  if (!email || !password) {
    console.error('Uso: npx ts-node scripts/create-owner.ts <email> <senha> [nome]');
    process.exit(1);
  }

  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();

  const existing = await client.query(
    'SELECT id FROM "public"."owner_users" WHERE email = $1',
    [email],
  );

  if (existing.rows.length) {
    console.log(`Owner com email ${email} já existe (id: ${existing.rows[0].id})`);
    await client.end();
    return;
  }

  const hashed = await bcrypt.hash(password, 10);

  const result = await client.query(
    `INSERT INTO "public"."owner_users" (id, email, full_name, password, is_active, created_at)
     VALUES (gen_random_uuid(), $1, $2, $3, true, NOW())
     RETURNING id`,
    [email, fullName, hashed],
  );

  console.log(`Owner criado com sucesso! ID: ${result.rows[0].id}`);
  await client.end();
}

main().catch((err) => {
  console.error('Erro:', err);
  process.exit(1);
});
