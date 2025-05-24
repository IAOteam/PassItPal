import { Request, Response } from 'express';
import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import User from '../models/User.model'; // To populate sender/receiver details

// @route   POST /api/messages/conversations
// @desc    Start or get a conversation between two users
// @access  Private
export const getOrCreateConversation = async (req: Request, res: Response) => {
  const { recipientId } = req.body; // The other user's ID
  const senderId = req.user?._id; // Current logged-in user

  if (!senderId) {
    return res.status(401).json({ message: 'Not authorized: Sender ID missing.' });
  }

  if (senderId.toString() === recipientId) {
    return res.status(400).json({ message: 'Cannot create conversation with yourself.' });
  }

  try {
    // Check if recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found.' });
    }

    // Find if a conversation already exists between these two users
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, recipientId] }
    });

    if (conversation) {
      // If conversation exists, populate it with messages and return
      const messages = await Message.find({ conversation: conversation._id })
        .populate('sender', 'username profilePictureUrl')
        .sort('createdAt');
      return res.json({ conversation, messages });
    } else {
      // Create a new conversation
      conversation = new Conversation({
        participants: [senderId, recipientId]
      });
      await conversation.save();
      return res.status(201).json({ conversation, messages: [] });
    }
  } catch (error: any) {
    console.error('Error getting/creating conversation:', error.message);
    res.status(500).send('Server error: Could not get or create conversation.');
  }
};


// @route   GET /api/messages/conversations/me
// @desc    Get all conversations for the logged-in user
// @access  Private
export const getMyConversations = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'username profilePictureUrl email') // Populate participants details
      .populate({
        path: 'lastMessage',
        select: 'text sender createdAt' // Populate only necessary last message fields
      })
      .sort({ updatedAt: -1 }); // Sort by most recent activity

    res.json(conversations);
  } catch (error: any) {
    console.error('Error fetching conversations:', error.message);
    res.status(500).send('Server error: Could not fetch conversations.');
  }
};


// @route   GET /api/messages/conversations/:conversationId/messages
// @desc    Get messages for a specific conversation
// @access  Private
export const getConversationMessages = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const { conversationId } = req.params;

    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // Ensure the logged-in user is a participant in this conversation
    if (!conversation.participants.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to view this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePictureUrl') // Populate sender details
      .sort('createdAt'); // Sort messages by creation date

    // Mark messages as read by the current user
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user._id } }, // Only unread messages for this user
      { $addToSet: { readBy: req.user._id } } // Add user to readBy array
    );

    res.json(messages);
  } catch (error: any) {
    console.error('Error fetching conversation messages:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }
    res.status(500).send('Server error: Could not fetch messages.');
  }
};