import { Request, Response } from 'express';
import Notification, { INotification } from '../models/Notification';
import { io } from '../app'; // Correct import for io

// Helper function to create and emit a notification (used by other controllers)
export const createAndEmitNotification = async (
  recipientId: string,
  type: INotification['type'],
  message: string,
  link?: string,
  senderId?: string
) => {
  try {
    const newNotification = new Notification({
      recipient: recipientId,
      sender: senderId,
      type,
      message,
      link
    });
    const notification = await newNotification.save();

    // Emit notification via Socket.IO to the recipient if they are online
    io.to(recipientId).emit('newNotification', notification);
    console.log(`Notification emitted to ${recipientId}: ${message}`);
    return notification;
  } catch (error) {
    console.error('Error creating or emitting notification:', error);
  }
};

// @route   GET /api/notifications/me
// @desc    Get all notifications for the logged-in user
// @access  Private
export const getMyNotifications = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('sender', 'username profilePictureUrl')
      .sort({ createdAt: -1 });

    res.json(notifications);
  } catch (error: any) {
    console.error('Error fetching notifications:', error.message);
    res.status(500).send('Server error: Could not fetch notifications.');
  }
};

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
export const markNotificationAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this notification.' });
    }

    notification.read = true;
    await notification.save();

    res.json({ message: 'Notification marked as read.', notification });
  } catch (error: any) {
    console.error('Error marking notification as read:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    res.status(500).send('Server error: Could not mark notification as read.');
  }
};

// @route   PUT /api/notifications/mark-all-read
// @desc    Mark all notifications for the logged-in user as read
// @access  Private
export const markAllNotificationsAsRead = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    await Notification.updateMany({ recipient: req.user._id, read: false }, { $set: { read: true } });

    res.json({ message: 'All notifications marked as read.' });
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error.message);
    res.status(500).send('Server error: Could not mark all notifications as read.');
  }
};

// @route   DELETE /api/notifications/:id
// @desc    Delete a specific notification
// @access  Private
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }

    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this notification.' });
    }

    await Notification.deleteOne({ _id: req.params.id });

    res.json({ message: 'Notification deleted successfully.' });
  } catch (error: any) {
    console.error('Error deleting notification:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid notification ID.' });
    }
    res.status(500).send('Server error: Could not delete notification.');
  }
};