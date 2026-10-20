import { Router } from 'express';
import { getAddresses, addAddress, deleteAddress } from '../controllers/customerController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

router.get('/addresses', optionalAuth, getAddresses);
router.post('/addresses', optionalAuth, addAddress);
router.delete('/addresses/:id', optionalAuth, deleteAddress);

export default router;
