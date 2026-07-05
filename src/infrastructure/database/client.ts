import { drizzle } from 'drizzle-orm/node-postgres';
import type { DatabasePool } from './connection.js';

export type DatabaseClient = ReturnType<typeof drizzle>;

export function createDatabaseClient(pool: DatabasePool): DatabaseClient {
  return drizzle(pool);
}
