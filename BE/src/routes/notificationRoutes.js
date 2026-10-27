import express from 'express';
import {
  registerPushToken,
  listNotifications,
  markSingleAsRead,
  markAllRead,
  sendCustomNotification,
} from '../controllers/notificationController.js';
import { optionalAuth } from '../middlewares/auth.js';

const router = express.Router();

router.post('/push-token', optionalAuth, registerPushToken);
router.get('/', optionalAuth, listNotifications);
router.patch('/read-all', optionalAuth, markAllRead);
router.patch('/:id/read', optionalAuth, markSingleAsRead);
router.post('/send', optionalAuth, sendCustomNotification);

export default router;
