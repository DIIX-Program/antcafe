import { getDbPool, sql } from '../config/db.js';

export async function getAvailableVouchers(req, res) {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        id, code, title, discount_type, discount_value, max_discount_amount,
        min_order_amount, usage_limit, used_count, start_at, end_at
      FROM vouchers
      WHERE is_active = 1
        AND start_at <= SYSDATETIME()
        AND end_at >= SYSDATETIME()
        AND (usage_limit IS NULL OR used_count < usage_limit)
      ORDER BY discount_value DESC
    `);

    const vouchers = result.recordset.map(v => ({
      id: Number(v.id),
      code: v.code,
      title: v.title,
      discount_type: v.discount_type,
      discount: Number(v.discount_value),
      discount_value: Number(v.discount_value),
      max_discount_amount: v.max_discount_amount ? Number(v.max_discount_amount) : null,
      minOrder: Number(v.min_order_amount),
      min_order_amount: Number(v.min_order_amount),
    }));

    return res.json({
      success: true,
      data: vouchers,
    });
  } catch (error) {
    console.error('[Voucher] getAvailableVouchers error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải mã giảm giá' });
  }
}

export async function applyVoucher(req, res) {
  try {
    const { code, order_amount } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Vui lòng cung cấp mã giảm giá' });
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input('code', sql.VarChar(30), code.trim().toUpperCase())
      .query(`
        SELECT *
        FROM vouchers
        WHERE code = @code
          AND is_active = 1
          AND start_at <= SYSDATETIME()
          AND end_at >= SYSDATETIME()
          AND (usage_limit IS NULL OR used_count < usage_limit)
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Mã giảm giá không tồn tại hoặc đã hết lượt áp dụng',
      });
    }

    const voucher = result.recordset[0];
    const subtotal = Number(order_amount) || 0;

    if (subtotal < Number(voucher.min_order_amount)) {
      return res.status(400).json({
        success: false,
        message: `Mã này chỉ áp dụng cho đơn từ ${Number(voucher.min_order_amount).toLocaleString('vi-VN')}đ`,
      });
    }

    let discount = 0;
    if (voucher.discount_type === 'FIXED_AMOUNT') {
      discount = Number(voucher.discount_value);
    } else if (voucher.discount_type === 'PERCENTAGE') {
      discount = Math.floor((subtotal * Number(voucher.discount_value)) / 100);
      if (voucher.max_discount_amount && discount > Number(voucher.max_discount_amount)) {
        discount = Number(voucher.max_discount_amount);
      }
    }

    // Discount cannot exceed subtotal
    if (discount > subtotal) {
      discount = subtotal;
    }

    return res.json({
      success: true,
      message: 'Áp dụng mã giảm giá thành công',
      data: {
        code: voucher.code,
        title: voucher.title,
        discount_amount: discount,
        discount: discount,
        minOrder: Number(voucher.min_order_amount),
      },
    });
  } catch (error) {
    console.error('[Voucher] applyVoucher error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi áp dụng mã giảm giá' });
  }
}
