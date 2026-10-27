import { getDbPool } from '../config/db.js';

export async function migrateNotificationTables() {
  const pool = await getDbPool();
  console.log('[Migration] Creating notification tables if not exist...');

  await pool.request().query(`
    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[user_push_tokens]') AND type in (N'U'))
    BEGIN
      CREATE TABLE user_push_tokens (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NULL,
        push_token VARCHAR(255) NOT NULL,
        device_name NVARCHAR(100) NULL,
        platform VARCHAR(20) NULL,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        updated_at DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT uq_push_token UNIQUE (push_token)
      );
      CREATE INDEX idx_user_push_tokens ON user_push_tokens(user_id);
      PRINT 'Created user_push_tokens table';
    END;

    IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[notifications]') AND type in (N'U'))
    BEGIN
      CREATE TABLE notifications (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        user_id BIGINT NULL,
        title NVARCHAR(200) NOT NULL,
        body NVARCHAR(1000) NOT NULL,
        data_json NVARCHAR(MAX) NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'ORDER_STATUS',
        is_read BIT NOT NULL DEFAULT 0,
        created_at DATETIME2 NOT NULL DEFAULT SYSDATETIME()
      );
      CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
      PRINT 'Created notifications table';
    END;
  `);

  console.log('[Migration] Notification tables verified successfully.');
}

if (process.argv[1] && process.argv[1].endsWith('migrateNotifications.js')) {
  migrateNotificationTables()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
