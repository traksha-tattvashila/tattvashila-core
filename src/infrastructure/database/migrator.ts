import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import type { DatabaseClient } from './client.js';

const MIGRATIONS_FOLDER = './drizzle/migrations';
const MIGRATIONS_JOURNAL = join(MIGRATIONS_FOLDER, 'meta/_journal.json');

export async function runMigrations(db: DatabaseClient): Promise<void> {
  if (!existsSync(MIGRATIONS_JOURNAL)) {
    return;
  }
  await migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
}
