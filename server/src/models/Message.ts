import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IMessage extends Document {
  _id: Types.ObjectId;
  conversation: Types.ObjectId;
  sender: Types.ObjectId;
  text: string;
  imageUrl?: string;
  readBy: Types.ObjectId[]; 
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema: Schema = new Schema({
  conversation: { 
    type: Schema.Types.ObjectId, 
    ref: 'Conversation', 
    required: true,
    index: true // Add index for faster queries
  },
  sender: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  text: { 
    type: String, 
    required: function(this: IMessage) {
        // Text is not required if an image is present
        return !this.imageUrl;
    },
    trim: true,
    maxlength: 1000 // Add a reasonable message length limit
  },
  imageUrl: { 
    type: String 
  },
  // This field will store an array of user IDs who have read the message.
  readBy: [{ 
    type: Schema.Types.ObjectId, 
    ref: 'User' 
  }],
},
{ 
  timestamps: true 
});

const Message = mongoose.model<IMessage>('Message', MessageSchema);
export default Message;
