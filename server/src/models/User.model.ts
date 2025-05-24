import mongoose, { Schema, Document, Types } from 'mongoose'; // Import Types
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  _id: Types.ObjectId; // Explicitly type _id
  username?: string;
  email: string;
  password?: string;
  mobileNumber?: string; // Optional for buyers, mandatory for sellers
  role: 'buyer' | 'seller' | 'admin';
  location?: {
    city: string;
    latitude?: number;
    longitude?: number;
  };
  profilePictureUrl?: string;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  isBlocked: boolean; // Added isBlocked field
  registrationDate: Date;
  comparePassword: (candidatePassword: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  username: { type: String, unique: true, sparse: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: function(this: IUser) { return this.role !== 'admin'; } }, // Explicit `this` type
  mobileNumber: {
    type: String,
    unique: true,
    sparse: true,
    required: function(this: IUser): boolean { return this.role === 'seller'; } // Explicit `this` type and return boolean
  },
  role: { type: String, enum: ['buyer', 'seller', 'admin'], default: 'buyer' },
  location: {
    city: { type: String },
    latitude: { type: Number },
    longitude: { type: Number }
  },
  profilePictureUrl: { type: String },
  isEmailVerified: { type: Boolean, default: false },
  isMobileVerified: { type: Boolean, default: false },
  isBlocked: { type: Boolean, default: false }, // Added to schema
  registrationDate: { type: Date, default: Date.now }
});

UserSchema.pre<IUser>('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  if (this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;