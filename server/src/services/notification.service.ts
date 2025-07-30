import Notification, { INotification } from '../models/Notification';
import { io } from '../app'; 
import { toPlainObject } from '@/utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

// This interface defines the structure for creating a link in a notification.
interface ILinkTarget {
    type: 'listing' | 'chat' | 'profile';
    id: string;
}

export class NotificationService {
    /**
     * Creates a new notification, saves it, and emits it via Socket.IO.
     * This is a reusable utility function to be called from other services.
     * @param recipientId The ID of the user who will receive the notification.
     * @param type The type of notification.
     * @param message The content of the notification message.
     * @param linkTarget Optional object to generate a clickable link.
     * @param senderId Optional ID of the user who triggered the notification.
     */
    public static async createAndEmitNotification(
        recipientId: string,
        type: INotification['type'],
        message: string,
        linkTarget?: ILinkTarget,
        senderId?: string
    ): Promise<Partial<INotification>> {
        try {
            let link: string | undefined;
            if (linkTarget) {
                switch (linkTarget.type) {
                    case 'listing': link = `/listings?listingId=${linkTarget.id}`; break;
                    case 'chat': link = `/messages/${linkTarget.id}`; break;
                    case 'profile': link = `/profile/${linkTarget.id}`; break;
                }
            }

            const newNotification = new Notification({
                recipient: recipientId, sender: senderId, type, message, link,
            });
            const savedNotification = await newNotification.save();
            const plainNotification = toPlainObject<INotification>(savedNotification);

            // Emit the plain object to the client
            io.to(recipientId).emit('newNotification', plainNotification);

            return plainNotification;
        } catch (error: any) {
            console.error('Error in createAndEmitNotification service:', error.message);
            throw new Error('Failed to create or emit notification.');
        }
    }

    /**
     * Fetches all notifications for a specific user.
     * @param userId The ID of the user.
     */
    public static async getNotificationsForUser(userId: string): Promise<Partial<INotification>[]> {
        const notifications = await Notification.find({ recipient: userId })
            .populate('sender', 'username profilePictureUrl')
            .sort({ createdAt: -1 });
        
        return notifications.map(n => toPlainObject<INotification>(n));
    }

    /**
     * Marks a single notification as read.
     * @param notificationId The ID of the notification.
     * @param userId The ID of the user requesting the action, for authorization.
     */
    public static async markAsRead(notificationId: string, userId: string): Promise<Partial<INotification>> {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new HttpError('Notification not found.', 404);
        }
        if (notification.recipient.toString() !== userId) {
            throw new HttpError('You are not authorized to update this notification.', 403);
        }
        notification.read = true;
        await notification.save();
        return toPlainObject<INotification>(notification);
    }
    
    /**
     * Marks all unread notifications for a user as read.
     * @param userId The ID of the user.
     */
    public static async markAllAsRead(userId: string): Promise<{ matchedCount: number; modifiedCount: number }> {
        const result = await Notification.updateMany({ recipient: userId, read: false }, { $set: { read: true } });
        return {
            matchedCount: result.matchedCount,
            modifiedCount: result.modifiedCount,
        };
    }

    /**
     * Deletes a single notification.
     * @param notificationId The ID of the notification to delete.
     * @param userId The ID of the user requesting the action, for authorization.
     */
    public static async deleteNotification(notificationId: string, userId: string): Promise<void> {
        const notification = await Notification.findById(notificationId);
        if (!notification) {
            throw new HttpError('Notification not found.', 404);
        }
        if (notification.recipient.toString() !== userId) {
            throw new HttpError('You are not authorized to delete this notification.', 403);
        }
        await Notification.deleteOne({ _id: notificationId });
    }
}
