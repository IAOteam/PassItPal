import mongoose, { Schema, Document, Types } from 'mongoose'; // Ensure Types is imported

export interface IConversation extends Document {
  _id: Types.ObjectId; // Explicitly type _id
  participants: Types.ObjectId[];
  lastMessage?: Types.ObjectId; // Ensure this is explicitly Types.ObjectId for consistency
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema: Schema = new Schema({
  participants: [{ type: Schema.Types.ObjectId, ref: 'User', required: true }],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }, // This is the correct schema type
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;