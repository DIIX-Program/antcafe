import { getDbPool } from '../config/db.js';

export async function migrateChatTables() {
  const pool = await getDbPool();
  console.log('[Migration] Creating order_messages table if not exist...');

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[order_messages]') AND type in (N'U'))
    BEGIN
      CREATE TABLE order_messages (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        order_code VARCHAR(50) NULL,
        sender_name NVARCHAR(100) NOT NULL,
        sender_role VARCHAR(20) NOT NULL DEFAULT 'CUSTOMER',
        message NVARCHAR(1000) NOT NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
      );
      CREATE INDEX idx_order_messages ON order_messages(order_id, created_at ASC);
      PRINT 'Created order_messages table';
    END;
  `);

  console.log('[Migration] order_messages table verified successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('migrateChat.js')) {
  migrateChatTables()
    .then(() => {
      console.log('Migration finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
