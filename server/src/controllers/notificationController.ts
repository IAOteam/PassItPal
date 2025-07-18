import { Request, Response } from 'express';
import { NotificationService } from '../services/notification.service';

// --- Helper Functions for Consistent Responses ---

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in NotificationController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

// --- Controller Methods ---

export const getMyNotifications = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const notifications = await NotificationService.getNotificationsForUser(userId);
        res.status(200).json(notifications);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch notifications.');
    }
};

export const markNotificationAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        const { id: notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        const notification = await NotificationService.markAsRead(notificationId, userId);
        sendSuccess(res, 'Notification marked as read.', { notification });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not mark notification as read.');
    }
};

export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await NotificationService.markAllAsRead(userId);
        sendSuccess(res, 'All notifications marked as read.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not mark all notifications as read.');
    }
};

export const deleteNotification = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        const { id: notificationId } = req.params;
        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }
        await NotificationService.deleteNotification(notificationId, userId);
        sendSuccess(res, 'Notification deleted successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not delete notification.');
    }
};
