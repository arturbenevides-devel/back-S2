import * as path from 'path';
import { migrateAllRegisteredTenants } from '../common/tenant/migrate-tenants.util';

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('Defina DATABASE_URL');
  }
  const migrationsDir = path.join(__dirname, '..', 'prisma', 'migrations');
  await migrateAllRegisteredTenants(url, migrationsDir);
  console.log('Migrations aplicadas em todos os tenants registrados.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
