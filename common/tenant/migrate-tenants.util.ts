import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export function quotePgIdent(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

export function listTenantMigrationFolders(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
    .filter((name) => !name.includes('public_registry'))
    .sort();
}

export function readMigrationSql(migrationsDir: string, folderName: string): string {
  const p = path.join(migrationsDir, folderName, 'migration.sql');
  return fs.readFileSync(p, 'utf-8');
}

export async function applyTenantMigrationFolder(
  connectionString: string,
  schemaName: string,
  folderName: string,
  sqlBody: string,
): Promise<void> {
  if (!/^\d{14}$/.test(schemaName)) {
    throw new Error('schema de tenant inválido');
  }
  const qSchema = quotePgIdent(schemaName);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const logCheck = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = $1 AND table_name = '_tenant_migration_log'`,
      [schemaName],
    );
    if (logCheck.rows.length > 0) {
      const applied = await client.query(
        `SELECT 1 FROM ${qSchema}."_tenant_migration_log" WHERE folder = $1`,
        [folderName],
      );
      if (applied.rows.length > 0) {
        return;
      }
    }
    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path TO ${qSchema}, public`);
    await client.query(sqlBody);
    await client.query(
      `INSERT INTO "_tenant_migration_log" ("folder") VALUES ($1) ON CONFLICT ("folder") DO NOTHING`,
      [folderName],
    );
    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    await client.end();
  }
}

export async function createTenantSchema(
  connectionString: string,
  schemaName: string,
): Promise<void> {
  const qSchema = quotePgIdent(schemaName);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA ${qSchema}`);
  } finally {
    await client.end();
  }
}

export async function dropTenantSchema(
  connectionString: string,
  schemaName: string,
): Promise<void> {
  const qSchema = quotePgIdent(schemaName);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS ${qSchema} CASCADE`);
  } finally {
    await client.end();
  }
}

export async function provisionTenantSchemasFromMigrations(
  connectionString: string,
  schemaName: string,
  migrationsDir: string,
): Promise<void> {
  await createTenantSchema(connectionString, schemaName);
  const folders = listTenantMigrationFolders(migrationsDir);
  for (const folder of folders) {
    const sql = readMigrationSql(migrationsDir, folder);
    await applyTenantMigrationFolder(connectionString, schemaName, folder, sql);
  }
}

export async function migrateAllRegisteredTenants(
  connectionString: string,
  migrationsDir: string,
): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT schema_name FROM public.tenant_registry ORDER BY schema_name`,
    );
    for (const row of res.rows as { schema_name: string }[]) {
      const folders = listTenantMigrationFolders(migrationsDir);
      for (const folder of folders) {
        const sql = readMigrationSql(migrationsDir, folder);
        await applyTenantMigrationFolder(connectionString, row.schema_name, folder, sql);
      }
    }
  } finally {
    await client.end();
  }
}
