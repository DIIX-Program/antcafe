import { Router } from 'express';
import { getRevenueReport, getAuditLogs } from '../controllers/adminController.js';
import { updateStoreSettings, toggleAcceptingOrders } from '../controllers/storeController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

// Reports & analytics
router.get('/reports/revenue', optionalAuth, getRevenueReport);
router.get('/audit/price-logs', optionalAuth, getAuditLogs);
router.get('/audit/cancelled-orders', optionalAuth, getAuditLogs);

// Store management
router.put('/store/settings', optionalAuth, updateStoreSettings);
router.patch('/store/toggle-accepting', optionalAuth, toggleAcceptingOrders);

export default router;
