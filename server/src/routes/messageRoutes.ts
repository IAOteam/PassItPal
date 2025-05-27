import { Router } from 'express';
import { getOrCreateConversation, getMyConversations, getConversationMessages, sendMessage } from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';
import { body, param } from 'express-validator';
import { validate } from '../middleware/validationMiddleware';

const router = Router();

// Route to start or get a conversation
router.post(
  '/conversations',
  protect,
  [
    body('recipientId').isMongoId().withMessage('Invalid recipient ID format.')
  ],
  validate,
  getOrCreateConversation
);
// Route to get all conversations for the logged-in user
router.get('/conversations/me', protect, getMyConversations);
// Route to get messages for a specific conversation
router.get(
  '/conversations/:conversationId/messages',
  protect,
  [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID format.')
  ],
  validate,
  getConversationMessages
);
//Send a message within a conversation
router.post(
  '/:conversationId', // Route to send a message to a specific conversation
  protect,
  [
    param('conversationId').isMongoId().withMessage('Invalid conversation ID format.'),
    body('text').notEmpty().withMessage('Message text cannot be empty.')
  ],
  validate,
  sendMessage 
);

export default router;