import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sql from 'mssql/msnodesqlv8.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  console.log('[DB Init] Connecting to master to ensure ant_coffee_db exists...');
  const masterConn = 'Server=Pham-The-An\\SQLEXPRESS;Database=master;UID=sa;PWD=123456;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=Yes;';
  
  let pool = await sql.connect({
    connectionString: masterConn,
    driver: 'msnodesqlv8'
  });

  const checkDb = await pool.request().query("SELECT database_id FROM sys.databases WHERE name = 'ant_coffee_db'");
  if (checkDb.recordset.length === 0) {
    console.log('[DB Init] Creating database ant_coffee_db...');
    await pool.request().query("CREATE DATABASE ant_coffee_db;");
  }
  await pool.close();

  // Connect to ant_coffee_db and apply schema
  console.log('[DB Init] Applying schema to ant_coffee_db...');
  const schemaPath = path.join(__dirname, '../database/schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf8');

  const appConn = 'Server=Pham-The-An\\SQLEXPRESS;Database=ant_coffee_db;UID=sa;PWD=123456;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=Yes;';
  pool = await sql.connect({
    connectionString: appConn,
    driver: 'msnodesqlv8'
  });

  // Split batches by GO (case insensitive, on its own line)
  const batches = schemaSql
    .split(/^\s*GO\s*$/gmi)
    .map(b => b.trim())
    .filter(b => b.length > 0 && !b.startsWith('USE master') && !b.startsWith('CREATE DATABASE') && !b.startsWith('USE ant_coffee_db'));

  for (const batch of batches) {
    try {
      await pool.request().query(batch);
    } catch (err) {
      console.warn('[DB Init] Batch warning (continuing):', err.message);
    }
  }

  await pool.close();
  console.log('[DB Init] Schema applied successfully!');
}

init().catch(err => {
  console.error('[DB Init] Failed:', err);
  process.exit(1);
});
