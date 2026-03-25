import * as path from 'path';
import { config } from 'dotenv';
import {
  migrateAllRegisteredTenants,
  resolveTenantMigrationsDir,
} from '../common/tenant/migrate-tenants.util';

config();

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Defina DATABASE_URL');
  }
  const migrationsDir = resolveTenantMigrationsDir(path.join(__dirname, '..'));
  await migrateAllRegisteredTenants(url, migrationsDir);
  console.log('Migrations aplicadas em todos os tenants registrados.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
