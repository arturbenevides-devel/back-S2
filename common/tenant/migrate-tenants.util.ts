import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

export function quotePgIdent(ident: string): string {
  return `"${ident.replace(/"/g, '""')}"`;
}

export function resolveTenantMigrationsDir(cwd: string = process.cwd()): string {
  return path.join(cwd, 'prisma', 'tenant-migrations');
}

export function listTenantMigrationFolders(migrationsDir: string): string[] {
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  return fs
    .readdirSync(migrationsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('.'))
    .map((d) => d.name)
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
    const pub = await client.query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'tenant_migration_log'`,
    );
    if (pub.rows.length === 0) {
      throw new Error('Execute npx prisma migrate deploy antes de tenants:migrate.');
    }

    const already = await client.query(
      `SELECT 1 FROM public.tenant_migration_log WHERE schema_name = $1 AND folder = $2`,
      [schemaName, folderName],
    );
    if (already.rows.length > 0) {
      return;
    }

    await client.query('BEGIN');
    await client.query(`SET LOCAL search_path TO ${qSchema}, public`);
    await client.query(sqlBody);
    await client.query(
      `INSERT INTO public.tenant_migration_log (schema_name, folder) VALUES ($1, $2) ON CONFLICT (schema_name, folder) DO NOTHING`,
      [schemaName, folderName],
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
  tenantMigrationsDir: string,
): Promise<void> {
  await createTenantSchema(connectionString, schemaName);
  const folders = listTenantMigrationFolders(tenantMigrationsDir);
  for (const folder of folders) {
    const sql = readMigrationSql(tenantMigrationsDir, folder);
    await applyTenantMigrationFolder(connectionString, schemaName, folder, sql);
  }
}

export async function migrateAllRegisteredTenants(
  connectionString: string,
  tenantMigrationsDir: string,
): Promise<void> {
  const client = new Client({ connectionString });
  await client.connect();
  try {
    const res = await client.query(
      `SELECT schema_name FROM public.tenant_registry ORDER BY schema_name`,
    );
    for (const row of res.rows as { schema_name: string }[]) {
      const folders = listTenantMigrationFolders(tenantMigrationsDir);
      for (const folder of folders) {
        const sql = readMigrationSql(tenantMigrationsDir, folder);
        await applyTenantMigrationFolder(connectionString, row.schema_name, folder, sql);
      }
    }
  } finally {
    await client.end();
  }
}
