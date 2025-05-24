import { Router } from 'express';
import { getOrCreateConversation, getMyConversations, getConversationMessages } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

router.post(
  '/conversations',
  protect,
  [
    body('recipientId').isMongoId().withMessage('Invalid recipient ID format.')
  ],
  validate,
  getOrCreateConversation
);
router.get('/conversations/me', protect, getMyConversations);
router.get(
  '/conversations/:conversationId/messages',
  protect,
  [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID format.')
  ],
  validate,
  getConversationMessages
);

export default router;