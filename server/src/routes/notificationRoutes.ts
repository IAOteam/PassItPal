import { Router } from 'express';
import { getMyNotifications, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '../controllers/notificationController';
import { protect } from '../middleware/authMiddleware';
import { param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

router.get('/me', protect, getMyNotifications);
router.put(
  '/:id/read',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid notification ID format.')
  ],
  validate,
  markNotificationAsRead
);
router.put('/mark-all-read', protect, markAllNotificationsAsRead);
router.delete(
  '/:id',
  protect,
  [
    param('id').isMongoId().withMessage('Invalid notification ID format.')
  ],
  validate,
  deleteNotification
);

export default router;