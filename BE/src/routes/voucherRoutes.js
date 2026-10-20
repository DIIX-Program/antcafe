import { Router } from 'express';
import { getAvailableVouchers, applyVoucher } from '../controllers/voucherController.js';

const router = Router();

router.get('/available', getAvailableVouchers);
router.post('/apply', applyVoucher);

export default router;
