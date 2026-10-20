import { getDbPool, sql } from '../config/db.js';

export async function getCurrentShift(req, res) {
  try {
    const staffId = req.user?.id || 2;
    const pool = await getDbPool();

    const result = await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .query(`
        SELECT TOP 1 
          id, staff_id, shift_date, check_in_at, check_out_at,
          opening_cash, system_calculated_cash, actual_closing_cash, discrepancy_amount,
          status, note
        FROM staff_shifts
        WHERE staff_id = @staffId AND status = 'OPEN'
        ORDER BY id DESC
      `);

    if (result.recordset.length === 0) {
      return res.json({
        success: true,
        data: null,
        message: 'Chưa mở ca làm việc',
      });
    }

    const shift = result.recordset[0];
    return res.json({
      success: true,
      data: {
        id: Number(shift.id),
        staff_id: Number(shift.staff_id),
        shift_date: shift.shift_date,
        check_in_at: shift.check_in_at,
        opening_cash: Number(shift.opening_cash),
        system_calculated_cash: Number(shift.system_calculated_cash),
        status: shift.status,
        note: shift.note,
      },
    });
  } catch (error) {
    console.error('[Staff] getCurrentShift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi tải ca làm việc' });
  }
}

export async function checkInShift(req, res) {
  try {
    const staffId = req.user?.id || 2;
    const { opening_cash, note } = req.body;
    const pool = await getDbPool();

    const result = await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .input('openingCash', sql.BigInt, Number(opening_cash) || 1500000)
      .input('note', sql.NVarChar(500), note || null)
      .query(`
        INSERT INTO staff_shifts (staff_id, shift_date, check_in_at, opening_cash, system_calculated_cash, status, note)
        OUTPUT INSERTED.*
        VALUES (@staffId, CAST(SYSDATETIME() AS DATE), SYSDATETIME(), @openingCash, 0, 'OPEN', @note)
      `);

    return res.status(201).json({
      success: true,
      message: 'Mở ca làm việc thành công',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('[Staff] checkInShift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi mở ca làm việc' });
  }
}

export async function checkOutShift(req, res) {
  try {
    const staffId = req.user?.id || 2;
    const { actual_closing_cash, note } = req.body;
    const pool = await getDbPool();

    // Calculate sum of cash orders during shift
    const cashSumRes = await pool.request().query(`
      SELECT COALESCE(SUM(total_amount), 0) as cash_total
      FROM orders
      WHERE payment_method = 'CASH' AND payment_status = 'PAID' AND CAST(created_at AS DATE) = CAST(SYSDATETIME() AS DATE)
    `);
    const systemCash = cashSumRes.recordset[0]?.cash_total || 0;

    const result = await pool.request()
      .input('staffId', sql.BigInt, staffId)
      .input('systemCash', sql.BigInt, systemCash)
      .input('actualClosingCash', sql.BigInt, Number(actual_closing_cash) || 0)
      .input('note', sql.NVarChar(500), note || null)
      .query(`
        UPDATE staff_shifts
        SET 
          check_out_at = SYSDATETIME(),
          system_calculated_cash = @systemCash,
          actual_closing_cash = @actualClosingCash,
          status = 'CLOSED',
          note = COALESCE(@note, note)
        OUTPUT INSERTED.*
        WHERE id = (SELECT TOP 1 id FROM staff_shifts WHERE staff_id = @staffId AND status = 'OPEN' ORDER BY id DESC)
      `);

    if (result.recordset.length === 0) {
      return res.status(400).json({ success: false, message: 'Không tìm thấy ca làm việc đang mở' });
    }

    return res.json({
      success: true,
      message: 'Đóng ca thành công',
      data: result.recordset[0],
    });
  } catch (error) {
    console.error('[Staff] checkOutShift error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đóng ca làm việc' });
  }
}
