// src/models/Order.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IOrder extends Document {
  buyer: Types.ObjectId; // Reference to the User who is buying/making an offer
  seller: Types.ObjectId; // Reference to the User who listed the pass
  listing: Types.ObjectId; // Reference to the Listing being bought/offered on
  offerPrice: number; // The price the buyer is offering (could be same as askingPrice)
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled'; // Current status of the transaction
  messageToSeller?: string; // Optional message from buyer to seller
  transactionId?: string; // ID from a payment gateway if applicable
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'; // Status of the payment
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
  buyer: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User', // Reference to the User model
    required: true,
  },
  listing: {
    type: Schema.Types.ObjectId,
    ref: 'Listing', // Reference to the Listing model
    required: true,
  },
  offerPrice: {
    type: Number,
    required: true,
    min: 0,
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  messageToSeller: {
    type: String,
    trim: true,
  },
  transactionId: {
    type: String,
    trim: true,
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending',
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt timestamps
});

// Add an index to improve query performance for common lookups
OrderSchema.index({ buyer: 1, listing: 1 });
OrderSchema.index({ seller: 1 });
OrderSchema.index({ status: 1 });


const Order = mongoose.model<IOrder>('Order', OrderSchema);

export default Order;