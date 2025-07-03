import { Request, Response } from 'express';
import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import User from '../models/User'; // To populate sender/receiver details

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
      'participants.user': { $all: [senderId, recipientId] }
    });

    if (conversation) {
      // If conversation exists, populate it with messages and return
      // const messages = await Message.find({ conversation: conversation._id })
      //   .populate('sender', 'username profilePictureUrl')
      //   .sort('createdAt');
       return res.json({ conversation });
    } else {
      // Create a new conversation
      conversation = new Conversation({
        participants: [
          { user: senderId }, 
          { user: recipientId }
          ]
      });
      await conversation.save();
      return res.status(201).json({ conversation });
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

    const conversations = await Conversation.find({ 'participants.user': req.user._id })
      .populate('participants.user', 'username profilePictureUrl email') // Populate participants details
      .populate({
        path: 'lastMessage',
        populate: {
            path: 'sender',
            select: 'username'
        }// Populate only necessary last message fields
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

    const conversation = await Conversation.findById(conversationId)
      .populate('participants.user', 'username profilePictureUrl _id'); // Ensure we populate _id

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }

    // --- CRITICAL FIX: Correctly check if the user is a participant ---
    // The old way `conversation.participants.includes(req.user._id)` fails because it compares object references.
    // The correct way is to use .some() and .equals() to compare the ID values.
    const isParticipant = conversation.participants.some(participant => 
        participant.user._id.equals(req.user!._id)
    );

    if (!isParticipant) {
      // console.log(`[Auth Failure] User ${req.user._id} is not a participant in conversation ${conversationId}.`);
      return res.status(403).json({ message: 'Not authorized to view this conversation.' });
    }

    const messages = await Message.find({ conversation: conversationId })
      .populate('sender', 'username profilePictureUrl')
      .sort('createdAt');

    // Mark messages as read by the current user
    await Message.updateMany(
      { conversation: conversationId, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );
    // Transform participants to a flat array for the frontend if desired, or send as is.
    const plainParticipants = conversation.participants.map(p => p.user);

    res.json({
      conversation: { ...conversation.toObject(), participants: plainParticipants }, // Send a clean object with a flat participants array
      messages
    });
  } catch (error: any) {
    console.error('Error fetching conversation messages:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid conversation ID.' });
    }
    res.status(500).send('Server error: Could not fetch messages.');
  }
};

//@route   POST /api/messages/:conversationId
// @desc    Send a new message within a conversation
// @access  Private
export const sendMessage = async (req: Request, res: Response) => {
  const { conversationId } = req.params;
  const { text } = req.body;
  const senderId = req.user?._id; // Current logged-in user

  if (!senderId) {
    return res.status(401).json({ message: 'Not authorized: Sender ID missing.' });
  }

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      return res.status(404).json({ message: 'Conversation not found.' });
    }
    const isParticipant = conversation.participants.some(p => p.user.equals(senderId));
    if (!isParticipant) {
        return res.status(403).json({ message: 'Not authorized to send messages in this conversation.' });
    }
    // Ensure the sender is a participant in this conversation
    // if (!conversation.participants.includes(senderId)) {
    //   return res.status(403).json({ message: 'Not authorized to send messages in this conversation.' });
    // }

    // Create a new message
    const newMessage = new Message({
      conversation: conversationId,
      sender: senderId,
      text: text,
      readBy: [senderId] // Mark as read by the sender immediately
    });

    await newMessage.save();

    // Update the last message in the conversation
    conversation.lastMessage = newMessage._id;
    conversation.updatedAt = new Date(); // Update conversation's timestamp
    await conversation.save();

    // Populate sender details for the response
    const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username profilePictureUrl');

    // Find recipient to emit socket event (similar to logic in app.ts)
    const recipient = conversation.participants.find(p => !p.user.equals(senderId));
    if (recipient) {
        // You would typically emit from here or a service. Your app.ts handles this on a separate event.
        // For consistency, the logic is kept in app.ts for now.
    }
    
    res.status(201).json({ message: 'Message sent successfully!', sentMessage: populatedMessage });
  } catch (error: any) {
    console.error('Error sending message:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid conversation ID or message ID.' });
    }
    res.status(500).send('Server error: Could not send message.');
  }
};