import { Router } from 'express';
import { getAllOrders, updateOrderStatus } from '../controllers/orderController.js';
import { toggleProductAvailability } from '../controllers/catalogController.js';
import { getCurrentShift, checkInShift, checkOutShift } from '../controllers/staffController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = Router();

// Orders POS Workflow
router.get('/orders/queue', getAllOrders);
router.put('/orders/:id/confirm', optionalAuth, (req, res, next) => {
  req.body.status = 'CONFIRMED';
  updateOrderStatus(req, res, next);
});
router.put('/orders/:id/ready', optionalAuth, (req, res, next) => {
  req.body.status = 'READY';
  updateOrderStatus(req, res, next);
});
router.put('/orders/:id/complete', optionalAuth, (req, res, next) => {
  req.body.status = 'COMPLETED';
  updateOrderStatus(req, res, next);
});
router.put('/orders/:id/cancel', optionalAuth, (req, res, next) => {
  req.body.status = 'CANCELLED';
  updateOrderStatus(req, res, next);
});

// Quick availability toggle
router.patch('/products/:id/availability', optionalAuth, toggleProductAvailability);

// Staff Shift management
router.get('/shifts/current', optionalAuth, getCurrentShift);
router.post('/shifts/check-in', optionalAuth, checkInShift);
router.post('/shifts/check-out', optionalAuth, checkOutShift);

export default router;
