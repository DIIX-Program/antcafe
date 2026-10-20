import { Router } from 'express';
import { getStoreStatus, updateStoreSettings, toggleAcceptingOrders } from '../controllers/storeController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/status', getStoreStatus);
router.put('/settings', optionalAuth, updateStoreSettings);
router.patch('/toggle-accepting', optionalAuth, toggleAcceptingOrders);

export default router;
