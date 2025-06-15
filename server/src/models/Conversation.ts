import mongoose, { Schema, Document, Types } from 'mongoose'; // Ensure Types is imported

export interface IConversation extends Document {
  _id: Types.ObjectId; // Explicitly type _id
  participants: IParticipant[];
  lastMessage?: Types.ObjectId; // Ensure this is explicitly Types.ObjectId for consistency
  createdAt: Date;
  updatedAt: Date;
}
interface IParticipant {
  user: Types.ObjectId;
  lastNotificationSentAt?: Date; // Tracks when the last "you have unread messages" email was sent
}
const ParticipantSchema: Schema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastNotificationSentAt: {
    type: Date,
    required: false // This field will only exist when a notification has been sent
  }
}, { _id: false }); // _id: false prevents Mongoose from creating a separate _id for this sub-document


const ConversationSchema: Schema = new Schema({
  participants: [ParticipantSchema],
  lastMessage: { type: Schema.Types.ObjectId, ref: 'Message' }, // This is the correct schema type
  
},
{ 
  timestamps: true // This automatically manages createdAt and updatedAt
});

const Conversation = mongoose.model<IConversation>('Conversation', ConversationSchema);
export default Conversation;