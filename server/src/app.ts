import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

import connectDB from './config/db';
import authRoutes from './routes/authRoutes';
import listingRoutes from './routes/listingRoutes';
import userRoutes from './routes/userRoutes';
import messageRoutes from './routes/messageRoutes';
import notificationRoutes from './routes/notificationRoutes';
import adminRoutes from './routes/adminRoutes';

import Message from './models/Message';
import Conversation from './models/Conversation';
import User from './models/User.model';
// import Notification from './models/Notification'; // Not directly used here, but in notificationController
import { createAndEmitNotification } from './controllers/notificationController';
import errorHandler from './middleware/errorHandler'; // Import error handler

dotenv.config();

const app = express();
const httpServer = createServer(app);

connectDB();

app.use(express.json({ limit: '50mb' }));
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:3000' }));

app.get('/', (req, res) => {
  res.send('PassitPal Backend API is running!');
});

app.use('/api/auth', authRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

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
    if (user.isBlocked) { // Check if user is blocked on socket connection
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
  socket.join(user._id.toString());

  socket.on('sendMessage', async ({ conversationId, text, recipientId }) => {
    try {
      if (!user) {
        console.error('User not authenticated for sendMessage event.');
        return;
      }

      const conversation = await Conversation.findById(conversationId);

      if (!conversation || !conversation.participants.includes(user._id)) {
        console.error('User not authorized for this conversation.');
        return;
      }

      const newMessage = new Message({
        conversation: conversationId,
        sender: user._id,
        text,
        readBy: [user._id]
      });

      await newMessage.save();

      conversation.lastMessage = newMessage._id; // _id is now correctly typed
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

// Error handling middleware (MUST be the last middleware)
app.use(errorHandler);