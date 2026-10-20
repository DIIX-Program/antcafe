import sql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

const configs = [
  {
    name: 'Config 1: server localhost, instance SQLEXPRESS',
    server: 'localhost',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      instanceName: 'SQLEXPRESS',
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  },
  {
    name: 'Config 2: server Pham-The-An, instance SQLEXPRESS',
    server: 'Pham-The-An',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      instanceName: 'SQLEXPRESS',
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  },
  {
    name: 'Config 3: server 127.0.0.1, instance SQLEXPRESS',
    server: '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    options: {
      instanceName: 'SQLEXPRESS',
      encrypt: true,
      trustServerCertificate: true,
      enableArithAbort: true,
    },
  },
  {
    name: 'Config 4: connection string',
    connectionString: `Server=Pham-The-An\\SQLEXPRESS;Database=${process.env.DB_NAME};User Id=${process.env.DB_USER};Password=${process.env.DB_PASSWORD};Encrypt=True;TrustServerCertificate=True;`,
  }
];

async function testConnections() {
  for (const cfg of configs) {
    console.log(`\nTesting ${cfg.name}...`);
    try {
      const pool = cfg.connectionString 
        ? await sql.connect(cfg.connectionString)
        : await sql.connect(cfg);
      const res = await pool.request().query('SELECT @@VERSION as version, DB_NAME() as db');
      console.log(` SUCCESS with ${cfg.name}! Connected to DB:`, res.recordset[0].db);
      await pool.close();
      return cfg;
    } catch (err) {
      console.log(` FAILED:`, err.message);
    }
  }
}

testConnections();
