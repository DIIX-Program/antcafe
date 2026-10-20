import { Router } from 'express';
import { 
  createPayment, 
  handleMoMoIPN, 
  handleMoMoCallback, 
  queryPaymentStatus, 
  simulateMoMoPayment,
  simulateVietQRPayment,
  switchPaymentMethod
} from '../controllers/paymentController.js';

const router = Router();

// 1. Tạo liên kết thanh toán MoMo (Tạo giao dịch v2)
router.post('/momo/create', createPayment);

// 2. Webhook IPN từ cổng MoMo (Server-to-Server Instant Payment Notification)
router.post('/momo/ipn', handleMoMoIPN);

// 3. Callback URL sau khi người dùng thực hiện thanh toán trên MoMo
router.get('/momo/callback', handleMoMoCallback);

// 4. Tra cứu trạng thái thanh toán của đơn hàng theo orderCode
router.get('/momo/status/:orderCode', queryPaymentStatus);

// 5. API Giả lập thanh toán MoMo thành công (Hỗ trợ thử nghiệm/chấm điểm nhanh trong dev)
router.post('/momo/simulate', simulateMoMoPayment);

// 6. API Giả lập thanh toán VietQR thành công
router.post('/vietqr/simulate', simulateVietQRPayment);

// 7. API Đổi phương thức thanh toán cho đơn hàng
router.post('/switch-method', switchPaymentMethod);

export default router;
