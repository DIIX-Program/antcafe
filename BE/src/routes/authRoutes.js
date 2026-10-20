import { Router } from 'express';
import { login, register, getMe, updateMe, changePassword, googleLogin } from '../controllers/authController.js';
import { authenticateToken } from '../middlewares/auth.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/google', googleLogin);
router.get('/me', authenticateToken, getMe);
router.put('/me', authenticateToken, updateMe);
router.put('/change-password', authenticateToken, changePassword);

// Support logout
router.post('/logout', (req, res) => {
  res.json({ success: true, message: 'Đăng xuất thành công' });
});

export default router;
