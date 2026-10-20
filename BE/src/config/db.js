import sql from 'mssql/msnodesqlv8.js';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DB_CONNECTION_STRING || 
  'Server=Pham-The-An\\SQLEXPRESS;Database=ant_coffee_db;UID=sa;PWD=123456;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=Yes;';

let pool = null;

export async function getDbPool() {
  if (pool) return pool;
  try {
    pool = await sql.connect({
      connectionString,
      driver: 'msnodesqlv8',
      pool: {
        max: 20,
        min: 2,
        idleTimeoutMillis: 30000,
      },
    });
    console.log('[Database] Connected to SQL Server (ant_coffee_db) successfully');
    return pool;
  } catch (error) {
    console.error('[Database] Connection error:', error.message);
    throw error;
  }
}

export { sql };
export default getDbPool;
