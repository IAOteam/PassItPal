import Conversation, { IConversation } from '../models/Conversation';
import Message, { IMessage } from '../models/Message';
import User from '../models/User';
import { io } from '../app'; // Assuming io is exported from your main app file
import { toPlainObject } from '@/utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class MessageService {
    /**
     * Finds an existing conversation between two users or creates a new one if it doesn't exist.
     */
 
    public static async getOrCreateConversation(senderId: string, recipientId: string): Promise<Partial<IConversation>> {
        if (senderId === recipientId) {
            throw new HttpError('Cannot create a conversation with yourself.', 400);
        }
        if (!(await User.findById(recipientId))) {
            throw new HttpError('Recipient user not found.', 404);
        }

        let conversation = await Conversation.findOne({
            'participants.user': { $all: [senderId, recipientId] }
        });

        if (!conversation) {
            conversation = new Conversation({
                participants: [{ user: senderId }, { user: recipientId }]
            });
            await conversation.save();
        }
        return toPlainObject<IConversation>(conversation);
    }

    /**
     * Fetches all conversations for the currently logged-in user.
     */
    public static async getMyConversations(userId: string): Promise<Partial<IConversation>[]> {
        const conversations = await Conversation.find({ 'participants.user': userId })
            .populate('participants.user', 'username profilePictureUrl email')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'username' }
            })
            .sort({ updatedAt: -1 });
        
        return conversations.map(convo => toPlainObject<IConversation>(convo));
    }

    /**
     * Fetches all messages for a specific conversation and marks them as read.
     */
    public static async getConversationMessages(conversationId: string, userId: string): Promise<{ conversation: Partial<IConversation>; messages: Partial<IMessage>[] }> {
        const conversation = await Conversation.findById(conversationId)
            .populate('participants.user', 'username profilePictureUrl _id');

        if (!conversation) {
            throw new HttpError('Conversation not found.', 404);
        }
        const isParticipant = conversation.participants.some(p => p.user._id.equals(userId));
        if (!isParticipant) {
            throw new HttpError('You are not authorized to view this conversation.', 403);
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'username profilePictureUrl')
            .select('sender text imageUrl createdAt')
            .sort({ createdAt: 'asc' });

        await Message.updateMany(
            { conversation: conversationId, readBy: { $ne: userId } },
            { $addToSet: { readBy: userId } }
        );

        return {
            conversation: toPlainObject<IConversation>(conversation),
            messages: messages.map(msg => toPlainObject<IMessage>(msg))
        };
    }


    /**
     * Sends a new message in a conversation.
     */
    public static async sendMessage(conversationId: string, senderId: string, text: string): Promise<Partial<IMessage>> {
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            throw new HttpError('Conversation not found.', 404);
        }
        const isParticipant = conversation.participants.some(p => p.user.equals(senderId));
        if (!isParticipant) {
            throw new HttpError('You are not authorized to send messages in this conversation.', 403);
        }

        const newMessage = new Message({
            conversation: conversationId,
            sender: senderId,
            text: text,
            readBy: [senderId],
        });
        await newMessage.save();

        conversation.lastMessage = newMessage._id;
        await conversation.save();

        const populatedMessage = await Message.findById(newMessage._id).populate('sender', 'username profilePictureUrl');
        if (!populatedMessage) {
            throw new HttpError('Failed to retrieve the sent message.', 500);
        }

        conversation.participants.forEach(participant => {
            const participantId = participant.user.toString();
            if (participantId !== senderId) {
                io.to(participantId).emit('newMessage', populatedMessage);
            }
        });

        return toPlainObject<IMessage>(populatedMessage);
    }
}
