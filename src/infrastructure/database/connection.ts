import pg from 'pg';

const { Pool } = pg;

export type DatabasePool = pg.Pool;

export function createDatabasePool(connectionString: string): DatabasePool {
  return new Pool({ connectionString });
}
