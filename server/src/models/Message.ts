import mongoose, { Schema, Document, Types } from 'mongoose'; // Import Types

export interface IMessage extends Document {
  _id: Types.ObjectId; // Explicitly type _id
  conversation: mongoose.Schema.Types.ObjectId;
  sender: mongoose.Schema.Types.ObjectId;
  text: string;
  readBy: mongoose.Schema.Types.ObjectId[];
  createdAt: Date;
}

const MessageSchema: Schema = new Schema({
  conversation: { type: Schema.Types.ObjectId, ref: 'Conversation', required: true },
  sender: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  readBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;