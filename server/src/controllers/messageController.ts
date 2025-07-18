import { Request, Response } from 'express';
import { MessageService } from '../services/message.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in MessageController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

export const getOrCreateConversation = async (req: Request, res: Response) => {
    try {
        const { recipientId } = req.body;
        const senderId = req.user?._id.toString();
        if (!senderId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const conversation = await MessageService.getOrCreateConversation(senderId, recipientId);
        sendSuccess(res, 'Conversation retrieved successfully.', { conversation });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not get or create conversation.');
    }
};

export const getMyConversations = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const conversations = await MessageService.getMyConversations(userId);
        res.status(200).json(conversations);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch conversations.');
    }
};

export const getConversationMessages = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const data = await MessageService.getConversationMessages(conversationId, userId);
        res.status(200).json(data);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch messages.');
    }
};

export const sendMessage = async (req: Request, res: Response) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;
        const senderId = req.user?._id.toString();
        if (!senderId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const sentMessage = await MessageService.sendMessage(conversationId, senderId, text);
        sendSuccess(res, 'Message sent successfully!', { sentMessage }, 201);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not send message.');
    }
};
