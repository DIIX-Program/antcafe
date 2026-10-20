import bcrypt from 'bcryptjs';
import { getDbPool, sql } from '../config/db.js';
import { generateToken } from '../middlewares/auth.js';

export async function login(req, res) {
  try {
    const identifier = (req.body.phoneOrEmail || req.body.phone || req.body.email || '').trim();
    const password = req.body.password;

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại/email và mật khẩu',
      });
    }

    const pool = await getDbPool();
    const query = `
      SELECT id, phone, email, password_hash, full_name, avatar_url, role, status, loyalty_points
      FROM users
      WHERE (phone = @identifier OR email = @identifier) AND deleted_at IS NULL
    `;

    const request = pool.request();
    request.input('identifier', sql.NVarChar, identifier);
    const result = await request.query(query);

    if (result.recordset.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Tài khoản không tồn tại trên hệ thống',
      });
    }

    const user = result.recordset[0];

    if (user.status === 'LOCKED') {
      return res.status(403).json({
        success: false,
        message: 'Tài khoản này đã bị khóa. Vui lòng liên hệ quản lý.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mật khẩu không chính xác',
      });
    }

    // Update last_login_at
    await pool.request()
      .input('userId', sql.BigInt, user.id)
      .query('UPDATE users SET last_login_at = SYSDATETIME() WHERE id = @userId');

    // Create JWT
    const token = generateToken({
      id: user.id,
      phone: user.phone,
      role: user.role,
      name: user.full_name,
    });

    const userPayload = {
      id: user.id,
      name: user.full_name,
      phone: user.phone,
      email: user.email,
      avatar: user.avatar_url,
      role: user.role,
      loyalty_points: user.loyalty_points,
    };

    return res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        token,
        role: user.role,
        user: userPayload,
      },
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng nhập',
      error: error.message,
    });
  }
}

export async function register(req, res) {
  try {
    const { phone, password, full_name, email } = req.body;

    if (!phone || !password || !full_name) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp số điện thoại, họ tên và mật khẩu',
      });
    }

    const pool = await getDbPool();

    // Check if phone already registered
    const checkQuery = 'SELECT id FROM users WHERE phone = @phone';
    const checkRes = await pool.request()
      .input('phone', sql.VarChar(15), phone.trim())
      .query(checkQuery);

    if (checkRes.recordset.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Số điện thoại này đã được đăng ký tài khoản',
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (phone, email, password_hash, full_name, role, status, loyalty_points)
      OUTPUT INSERTED.id, INSERTED.phone, INSERTED.email, INSERTED.full_name, INSERTED.role, INSERTED.loyalty_points
      VALUES (@phone, @email, @password_hash, @full_name, 'CUSTOMER', 'ACTIVE', 50)
    `;

    const insertReq = pool.request();
    insertReq.input('phone', sql.VarChar(15), phone.trim());
    insertReq.input('email', sql.VarChar(150), email ? email.trim() : null);
    insertReq.input('password_hash', sql.VarChar(255), passwordHash);
    insertReq.input('full_name', sql.NVarChar(100), full_name.trim());

    const result = await insertReq.query(insertQuery);
    const newUser = result.recordset[0];

    const token = generateToken({
      id: newUser.id,
      phone: newUser.phone,
      role: newUser.role,
      name: newUser.full_name,
    });

    return res.status(201).json({
      success: true,
      message: 'Đăng ký tài khoản thành công! Tặng bạn 50 điểm thành viên.',
      data: {
        token,
        role: newUser.role,
        user: {
          id: newUser.id,
          name: newUser.full_name,
          phone: newUser.phone,
          email: newUser.email,
          role: newUser.role,
          loyalty_points: newUser.loyalty_points,
        },
      },
    });
  } catch (error) {
    console.error('[Auth] Register error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng ký tài khoản',
      error: error.message,
    });
  }
}

export async function getMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query(`
        SELECT id, phone, email, full_name, avatar_url, role, status, loyalty_points, last_login_at
        FROM users
        WHERE id = @id AND deleted_at IS NULL
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
    }

    const user = result.recordset[0];
    return res.json({
      success: true,
      data: {
        id: user.id,
        name: user.full_name,
        phone: user.phone,
        email: user.email,
        avatar: user.avatar_url,
        role: user.role,
        loyalty_points: user.loyalty_points,
        last_login_at: user.last_login_at,
      },
    });
  } catch (error) {
    console.error('[Auth] getMe error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi lấy thông tin cá nhân' });
  }
}

export async function updateMe(req, res) {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Chưa xác thực' });
    }

    const { full_name, avatar_url, email } = req.body;
    const pool = await getDbPool();

    const request = pool.request();
    request.input('id', sql.BigInt, req.user.id);
    request.input('full_name', sql.NVarChar(100), full_name || null);
    request.input('avatar_url', sql.VarChar(500), avatar_url || null);
    request.input('email', sql.VarChar(150), email || null);

    await request.query(`
      UPDATE users
      SET full_name = COALESCE(@full_name, full_name),
          avatar_url = COALESCE(@avatar_url, avatar_url),
          email = COALESCE(@email, email),
          updated_at = SYSDATETIME()
      WHERE id = @id
    `);

    return res.json({
      success: true,
      message: 'Cập nhật thông tin thành công',
    });
  } catch (error) {
    console.error('[Auth] updateMe error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi cập nhật' });
  }
}

export async function changePassword(req, res) {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đủ mật khẩu cũ và mới' });
    }

    const pool = await getDbPool();
    const result = await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .query('SELECT password_hash FROM users WHERE id = @id');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại' });
    }

    const isMatch = await bcrypt.compare(oldPassword, result.recordset[0].password_hash);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.request()
      .input('id', sql.BigInt, req.user.id)
      .input('newHash', sql.VarChar(255), newHash)
      .query('UPDATE users SET password_hash = @newHash, updated_at = SYSDATETIME() WHERE id = @id');

    return res.json({ success: true, message: 'Đổi mật khẩu thành công' });
  } catch (error) {
    console.error('[Auth] changePassword error:', error);
    return res.status(500).json({ success: false, message: 'Lỗi đổi mật khẩu' });
  }
}
