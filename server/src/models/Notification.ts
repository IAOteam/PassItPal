import mongoose, { Schema, Document } from 'mongoose';

export type NotificationType = 'message' | 'listing_update' | 'admin_announcement' | 'promoted_listing' | 'transaction' | 'new_order'|'order_cancelled'; 

export interface INotification extends Document {
  recipient: mongoose.Schema.Types.ObjectId;
  sender?: mongoose.Schema.Types.ObjectId; // Optional: who triggered the notification (e.g., new message from user X)
  type: NotificationType; // Type of notification
  message: string;
  link?: string; // Optional: URL to redirect to (e.g., /chat/conversationId, /listing/listingId)
  read: boolean;
  createdAt: Date;
}

const NotificationSchema: Schema = new Schema({
  recipient: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
  type: { 
    type: String, 
    enum: ['message', 'listing_update', 'admin_announcement', 'promoted_listing', 'transaction', 'new_order','order_cancelled'], 
    required: true },
  message: { type: String, required: true },
  link: { type: String },
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
export default Notification;