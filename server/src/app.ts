import express,{ Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import helmet from 'helmet'; //  For security headers
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

import Message, { IMessage } from './models/Message';
import Conversation, { IConversation } from './models/Conversation';
import User , {IUser} from './models/User';
import { createAndEmitNotification } from './controllers/notificationController';
import errorHandler from './middleware/errorHandler';
import orderRoutes from './routes/orderRoutes';
import reviewRoutes from './routes/reviewRoutes';
import paymentRoutes from './routes/paymentRoutes';
import reportRoutes from './routes/reportRoutes';
import { createEmailWorker, emailQueue } from './config/queue'; 
import emailProcessor from './workers/emailProcessor';

import './config/passport-setup'; 

const app = express();
const httpServer = createServer(app);

connectDB();

// --- INITIALIZE THE EMAIL WORKER ---
// This starts the worker, and it begins listening for jobs in the queue.
const emailWorker = createEmailWorker(emailProcessor);
console.log("Email worker initialized and listening for jobs.");
// ------------------------------------


// Security Middleware
app.use(helmet()); // Add Helmet to set various HTTP headers for security

app.use(express.json({ limit: '50mb' }));
app.use(cookieParser());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  credentials: true 
}));

app.use(passport.initialize());

app.get('/', (req: Request, res: Response) => {
  res.send('PassitPal Backend API is running!');
});
app.get('/test', (req: Request, res: Response) => {
  res.send('Server is running and responsive');
});


// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes); 
app.use('/api/reports', reportRoutes); 

// Socket.IO setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

const connectedUsers = new Map<string, string>();

io.use(async (socket: Socket, next) => {
  // const token = socket.handshake.auth.token;
  // if (!token) {
  //   return next(new Error('Authentication error: No token provided'));
  // } 
  try {
    const token = socket.handshake.auth.token;
    if (!token) throw new Error('Authentication error: No token provided');
    // const decoded: any = jwt.verify(token, 'THIS_IS_MY_VERY_CONSISTENT_TEST_SECRET_123!');
    const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return next(new Error('Authentication error: User not found'));
    }
    if (user.isBlocked) {
      return next(new Error('Authentication error: Account blocked'));
    }
    socket.data.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
});

io.on('connection', (socket: Socket) => {
  const user = socket.data.user as IUser;
  if (!user || !user?._id) {
    socket.disconnect();
    return;
  }
  console.log(`Socket connected: ${socket.id} for user: ${user.email}`);

  connectedUsers.set(user._id.toString(), socket.id);
  socket.join(user._id.toString()); // Join a room named after the user's ID

  socket.on('sendMessage', async ({ conversationId, text, recipientId }) => {
    try {
      if (!user) {
        console.error('User not authenticated for sendMessage event.');
        return;
      }
      const sender = socket.data.user as IUser;
      if (!sender) return console.error('sendMessage Error: sender not found on socket.');

      const conversation = await Conversation.findById(conversationId) as IConversation;

      // Correctly check if the sender is a participant in the conversation.
      if (!conversation || !conversation.participants.some(p => p.user.equals(sender._id))) {
        console.error(`User ${sender._id} not authorized for conversation ${conversationId}.`);
        // Optionally, emit an error back to the sender's client
        socket.emit('sendMessageError', { conversationId, message: "Authorization error." });
        return;
      }

      const newMessage = new Message({
        conversation: conversationId,
        sender: sender._id,
        text,
        readBy: [sender._id]
      }) as IMessage;

      await newMessage.save();

      conversation.lastMessage = newMessage._id as Types.ObjectId;
      conversation.updatedAt = new Date();
      await conversation.save();

      const populatedMessage = await newMessage.populate('sender', 'username profilePictureUrl');

      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('receiveMessage', populatedMessage);
      });

      if (recipientId && recipientId !== sender._id.toString()) {
        await createAndEmitNotification(
          recipientId,
          'message',
          `New message from ${user.username || user.email}: ${text.substring(0, 50)}...`,
          `/chat/${conversationId}`,
          user._id.toString()
        );
      }

      // --- OFFLINE NOTIFICATION LOGIC ---
      // Check if the recipient is offline
      const isRecipientOnline = connectedUsers.has(recipientId);

      if (!isRecipientOnline) {
        console.log(`[Queue] Recipient ${recipientId} is offline. Scheduling an email notification.`);
        
        // Add a job to the queue to send an email in 15 minutes
        await emailQueue.add(
          `send-email-to-${recipientId}`, // Job name
          { // The data for our processor
            recipientId: recipientId,
            senderName: sender.username || 'A user',
            messageText: text
          },
          { // Job options
            delay: 15 * 60 * 1000, // 15 minutes in milliseconds
            removeOnComplete: true, // Clean up job from Redis on success
            removeOnFail: 50 // Keep failed jobs for debugging
          }
        );
      }

    } catch (error) {
      console.error('Error handling sendMessage:', error);
    }
  });

  socket.on('disconnect', () => {
    if (user && user.email) {
      console.log(`Socket disconnected: ${socket.id} for user: ${user.email}`);
      connectedUsers.delete(user._id.toString());
    }
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});


const PORT = parseInt(process.env.PORT || '5001', 10);

httpServer.listen(PORT, "0.0.0.0",() => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO listening on port ${PORT}`);
});

//  404 Not Found Middleware - MUST be placed AFTER all routes
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Global Error Handler Middleware - MUST be placed LAST
app.use(errorHandler);