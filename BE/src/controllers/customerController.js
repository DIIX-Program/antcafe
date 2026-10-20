import { getDbPool, sql } from '../config/db.js';

export async function getAddresses(req, res) {
  try {
    const userId = req.user?.id || 3; // Default to customer 3 if guest/demo
    const pool = await getDbPool();

    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .query(`
        SELECT id, user_id, label, recipient_name, recipient_phone as phone, address_detail, note, is_default
        FROM customer_addresses
        WHERE user_id = @userId
        ORDER BY is_default DESC, id DESC
      `);

    const addresses = result.recordset.map(addr => ({
      id: Number(addr.id),
      label: addr.label,
      recipient_name: addr.recipient_name,
      phone: addr.phone,
      address_detail: addr.address_detail,
      note: addr.note,
      is_default: Boolean(addr.is_default),
    }));

    return res.json({
      success: true,
      data: addresses,
    });
  } catch (error) {
    console.error('[Customer] getAddresses error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải sổ địa chỉ' });
  }
}

export async function addAddress(req, res) {
  try {
    const userId = req.user?.id || 3;
    const { label, recipient_name, phone, address_detail, note, is_default } = req.body;

    if (!address_detail) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp chi tiết địa chỉ' });
    }

    const pool = await getDbPool();

    // If marked default, unset previous default
    if (is_default) {
      await pool.request()
        .input('userId', sql.BigInt, userId)
        .query('UPDATE customer_addresses SET is_default = 0 WHERE user_id = @userId');
    }

    const result = await pool.request()
      .input('userId', sql.BigInt, userId)
      .input('label', sql.NVarChar(50), label || 'Nhà riêng')
      .input('recipient_name', sql.NVarChar(100), recipient_name || 'Khách hàng')
      .input('phone', sql.VarChar(15), phone || '0901 234 567')
      .input('address_detail', sql.NVarChar(500), address_detail.trim())
      .input('note', sql.NVarChar(255), note || null)
      .input('is_default', sql.Bit, is_default ? 1 : 0)
      .query(`
        INSERT INTO customer_addresses (user_id, label, recipient_name, recipient_phone, address_detail, note, is_default)
        OUTPUT INSERTED.id, INSERTED.label, INSERTED.recipient_name, INSERTED.recipient_phone as phone, INSERTED.address_detail, INSERTED.is_default
        VALUES (@userId, @label, @recipient_name, @phone, @address_detail, @note, @is_default)
      `);

    const newAddr = result.recordset[0];
    return res.status(201).json({
      success: true,
      message: 'Thêm địa chỉ thành công',
      data: {
        id: Number(newAddr.id),
        label: newAddr.label,
        recipient_name: newAddr.recipient_name,
        phone: newAddr.phone,
        address_detail: newAddr.address_detail,
        is_default: Boolean(newAddr.is_default),
      },
    });
  } catch (error) {
    console.error('[Customer] addAddress error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi thêm địa chỉ' });
  }
}

export async function deleteAddress(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user?.id || 3;
    const pool = await getDbPool();

    await pool.request()
      .input('id', sql.BigInt, Number(id))
      .input('userId', sql.BigInt, userId)
      .query('DELETE FROM customer_addresses WHERE id = @id AND user_id = @userId');

    return res.json({ success: true, message: 'Đã xóa địa chỉ' });
  } catch (error) {
    console.error('[Customer] deleteAddress error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi xóa địa chỉ' });
  }
}
