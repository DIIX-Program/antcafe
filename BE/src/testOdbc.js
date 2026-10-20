import sql from 'mssql/msnodesqlv8.js';

const connectionString = 'Server=Pham-The-An\\SQLEXPRESS;Database=ant_coffee_db;UID=sa;PWD=123456;Driver={ODBC Driver 18 for SQL Server};TrustServerCertificate=Yes;';

async function test() {
  try {
    console.log('Connecting with msnodesqlv8...');
    const pool = await sql.connect({
      connectionString,
      driver: 'msnodesqlv8'
    });
    console.log(' CONNECTED SUCCESSFULLY!');
    const result = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as db, COUNT(*) as user_count FROM users');
    console.log('Result:', result.recordset[0]);
    await pool.close();
  } catch (err) {
    console.error(' FAILED:', err);
  }
}

test();
