import pg from 'pg';
import { databaseUrl } from './config/security.js';

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

export default pool;
