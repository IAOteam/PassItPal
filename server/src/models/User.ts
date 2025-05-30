import mongoose, { Schema, Document, Types } from 'mongoose';
import validator from 'validator';
export interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password?: string; // Optional because external login might not have a password
  username?: string; // Buyer-specific
  mobileNumber?: string; // Seller-specific
  role: 'buyer' | 'seller' | 'admin';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city: string;
  };
  isMobileVerified: boolean;
  isEmailVerified: boolean; // New: Track email verification
  isBlocked: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpPurpose?: 'verification' | 'password_reset'; 
  otpVerifiedAt?: Date; //  Timestamp for when an OTP was last successfully verified (mobile or email)
  profilePictureUrl?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  email: { 
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: [validator.isEmail, 'Please enter a valid email address'],
  },
  password: { 
      type: String,
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, // Don't return password by default in queries
  }, 
  username: { 
      type: String,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters long'],
      maxlength: [30, 'Username cannot exceed 30 characters'],
  },
  mobileNumber: { 
      type: String,
      unique: true,
      sparse: true, // Allows null values to not violate unique constraint
      trim: true,
      validate: {
        validator: function(v: string) {
          return /\d{10}/.test(v); // Basic 10-digit number check
        },
        message: (props: any) => `${props.value} is not a valid 10-digit mobile number!`
      }
  }, // sparse allows multiple nulls
  role: { 
    type: String,
    enum: ['buyer', 'seller', 'admin'],
    default: 'buyer',
   },
  location: {
        city: {
        type: String,
        trim: true,
      },
      type: {
        type: String,
        enum: ['Point'], // GeoJSON Point
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        index: '2dsphere', // Create a geospatial index
      },
  },
  
  isMobileVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false }, 
  isBlocked: { type: Boolean, default: false },
  otp: { type: String , select: false },
  otpExpiry: { type: Date ,select: false},
  otpPurpose: { 
      type: String,
      enum: ['verification', 'password_reset'],
      select: false,
    },
  otpVerifiedAt: { type: Date,select: false, }, 
  profilePictureUrl: { 
    type: String ,
    default: 'https://res.cloudinary.com/{your-cloud-name/image/upload/v1/default_profile_picture.png' // Provide a default or leave undefined
    
  },
  passwordResetToken: {
      type: String,
      select: false, // Don't return this by default
  },
  passwordResetExpires: {
      type: Date,
      select: false,
  },
  
},
  {
    timestamps: true,
  }
);

// GeoJSON Point Schema for location based queries
UserSchema.index({ location: '2dsphere' });

const User = mongoose.model<IUser>('User', UserSchema);
export default User;