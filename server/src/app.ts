import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet'; // New: For security headers
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { Types } from 'mongoose';

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

import Message, { IMessage } from './models/Message';
import Conversation, { IConversation } from './models/Conversation';
import User from './models/User.model';
import { createAndEmitNotification } from './controllers/notificationController';
import errorHandler from './middleware/errorHandler';

dotenv.config();

const app = express();
const httpServer = createServer(app);

connectDB();

// Security Middleware
app.use(helmet()); // New: Add Helmet to set various HTTP headers for security

app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

app.get('/', (req, res) => {
  res.send('PassitPal Backend API is running!');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO setup
export const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

const connectedUsers = new Map<string, string>();

io.use(async (socket: Socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
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
  const user = socket.data.user;
  console.log(`Socket connected: ${socket.id} for user: ${user.email}`);

  connectedUsers.set(user._id.toString(), socket.id);
  socket.join(user._id.toString()); // Join a room named after the user's ID

  socket.on('sendMessage', async ({ conversationId, text, recipientId }) => {
    try {
      if (!user) {
        console.error('User not authenticated for sendMessage event.');
        return;
      }

      const conversation = await Conversation.findById(conversationId) as IConversation;

      if (!conversation || !conversation.participants.some(p => p.equals(user._id))) {
        console.error('User not authorized for this conversation.');
        return;
      }

      const newMessage = new Message({
        conversation: conversationId,
        sender: user._id,
        text,
        readBy: [user._id]
      }) as IMessage;

      await newMessage.save();

      conversation.lastMessage = newMessage._id as Types.ObjectId;
      conversation.updatedAt = new Date();
      await conversation.save();

      const populatedMessage = await newMessage.populate('sender', 'username profilePictureUrl');

      conversation.participants.forEach(participantId => {
        io.to(participantId.toString()).emit('receiveMessage', populatedMessage);
      });

      if (recipientId !== user._id.toString()) {
        await createAndEmitNotification(
          recipientId,
          'message',
          `New message from ${user.username || user.email}: ${text.substring(0, 50)}...`,
          `/chat/${conversationId}`,
          user._id.toString()
        );
      }

    } catch (error) {
      console.error('Error handling sendMessage:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id} for user: ${user.email}`);
    connectedUsers.delete(user._id.toString());
  });

  socket.on('error', (err) => {
    console.error('Socket error:', err);
  });
});


const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO listening on port ${PORT}`);
});

// New: 404 Not Found Middleware - MUST be placed AFTER all routes
app.use((req, res, next) => {
  res.status(404).json({ message: `Not Found - ${req.originalUrl}` });
});

// Global Error Handler Middleware - MUST be placed LAST
app.use(errorHandler);