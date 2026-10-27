import { getDbPool, sql } from '../config/db.js';

export async function getOrderMessages(orderId) {
  if (!orderId) return [];
  const pool = await getDbPool();
  const result = await pool.request()
    .input('orderId', sql.BigInt, orderId)
    .query(`
      SELECT 
        id, 
        order_id AS orderId, 
        order_code AS orderCode, 
        sender_name AS senderName, 
        sender_role AS senderRole, 
        message, 
        created_at AS timestamp
      FROM order_messages
      WHERE order_id = @orderId
      ORDER BY created_at ASC
    `);

  return result.recordset || [];
}

export async function saveOrderMessage({ orderId, orderCode, senderName, senderRole, message }) {
  if (!orderId || !message || !message.trim()) {
    throw new Error('orderId và message không được để trống');
  }

  const pool = await getDbPool();
  const result = await pool.request()
    .input('orderId', sql.BigInt, orderId)
    .input('orderCode', sql.VarChar(50), orderCode || null)
    .input('senderName', sql.NVarChar(100), senderName || 'Khách hàng')
    .input('senderRole', sql.VarChar(20), senderRole || 'CUSTOMER')
    .input('message', sql.NVarChar(1000), message.trim())
    .query(`
      INSERT INTO order_messages (order_id, order_code, sender_name, sender_role, message)
      OUTPUT 
        inserted.id, 
        inserted.order_id AS orderId, 
        inserted.order_code AS orderCode, 
        inserted.sender_name AS senderName, 
        inserted.sender_role AS senderRole, 
        inserted.message, 
        inserted.created_at AS timestamp
      VALUES (@orderId, @orderCode, @senderName, @senderRole, @message)
    `);

  return result.recordset[0];
}
