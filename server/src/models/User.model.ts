import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string; // Optional because external login might not have a password
  username?: string; // Buyer-specific
  mobileNumber?: string; // Seller-specific
  role: 'buyer' | 'seller' | 'admin';
  city: string;
  latitude: number;
  longitude: number;
  isMobileVerified: boolean;
  isEmailVerified: boolean; // New: Track email verification
  isBlocked: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpVerifiedAt?: Date; // New: Timestamp for when an OTP was last successfully verified (mobile or email)
  profilePictureUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, select: false }, // Don't return password by default
  username: { type: String },
  mobileNumber: { type: String, unique: true, sparse: true }, // sparse allows multiple nulls
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  city: { type: String, required: true },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  isMobileVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false }, // New field
  isBlocked: { type: Boolean, default: false },
  otp: { type: String },
  otpExpiry: { type: Date },
  otpVerifiedAt: { type: Date }, // New field
  profilePictureUrl: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// GeoJSON Point Schema for location based queries
UserSchema.index({ location: '2dsphere' });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;