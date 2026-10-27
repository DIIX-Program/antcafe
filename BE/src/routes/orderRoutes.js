import { Router } from 'express';
import { 
  createOrder, 
  getAllOrders, 
  getMyOrders, 
  updateOrderStatus 
} from '../controllers/orderController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

// Order creation / checkout
router.post('/checkout', optionalAuth, createOrder);
router.post('/', optionalAuth, createOrder);

// Order listings
router.get('/my-history', optionalAuth, getMyOrders);
router.get('/queue', getAllOrders);
router.get('/', getAllOrders);

// Order status updates
router.put('/:id/status', optionalAuth, updateOrderStatus);
router.patch('/:id/status', optionalAuth, updateOrderStatus);
router.put('/:id/cancel', optionalAuth, (req, res, next) => {
  req.body.status = 'CANCELLED';
  updateOrderStatus(req, res, next);
});
router.patch('/:id/cancel', optionalAuth, (req, res, next) => {
  req.body.status = 'CANCELLED';
  updateOrderStatus(req, res, next);
});

export default router;
