import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'ant_coffee_super_secret_jwt_key_2026_xyz987';

export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    // If no token provided, we can either reject or set req.user to null
    return res.status(401).json({
      success: false,
      message: 'Vui lòng đăng nhập để thực hiện thao tác này',
    });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ',
      });
    }
    req.user = user;
    next();
  });
}

// Optional auth: parses token if present, but doesn't reject if absent
export function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (!err) {
      req.user = user;
    } else {
      req.user = null;
    }
    next();
  });
}

export function authorizeRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Chưa xác thực người dùng',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền truy cập chức năng này',
      });
    }

    next();
  };
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}
