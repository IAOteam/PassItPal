import mongoose, { Schema, Document, Types } from 'mongoose';
import validator from 'validator';
export interface IUser extends Document {
  _id: Types.ObjectId;
  googleId?: string;
  email: string;
  password?: string; // Optional because Google login might not have a local password
  username?: string; // Buyer-specific
  mobileNumber?: string; // Seller-specific
  role: 'buyer' | 'seller' | 'admin';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
    city: string;
  };
  isMobileVerified: boolean;
  isEmailVerified: boolean; // Google-verified emails will set this to true
  isBlocked: boolean;
  otp?: string;
  otpExpiry?: Date;
  otpPurpose?: 'verification' | 'password_reset'; 
  otpVerifiedAt?: Date; //  Timestamp for when an OTP was last successfully verified (mobile or email)
  profilePictureUrl?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  refreshToken?: string;

  requestedRole?: 'buyer' | 'seller';                     
  roleRequestStatus?: 'pending' | 'approved' | 'rejected'; 
  roleRequestTimestamp?: Date;                             
  roleReviewNotes?: string;       
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  googleId: { 
    type: String,
    unique: true,
    sparse: true, // Allows null/undefined values without violating unique constraint
  },
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
        validator: function(v: string | null | undefined) {
          return v? /\d{10}/.test(v): true; // Basic 10-digit number check
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
        // index: '2dsphere', // Create a geospatial index
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
    default:  'https://asset.cloudinary.com/dz9qcmowr/b7e9503bc9704d834f366c513c5d51bf'// Provide a default or leave undefined
    
  },
  passwordResetToken: {
      type: String,
      select: false, // Don't return this by default
  },
  passwordResetExpires: {
      type: Date,
      select: false,
  },
  refreshToken: { 
    type: String,
    select: false, // Do not return by default
  },
  // Schema definitions for Role Change Request fields
  requestedRole: {                                      
    type: String,
    enum: ['buyer', 'seller'],
    required: false, // Only present when a request is made
  },
  roleRequestStatus: {                                  
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    required: false, // Only present when a request is made
  },
  roleRequestTimestamp: {                            
    type: Date,
    required: false,
  },
  roleReviewNotes: {                                    
    type: String,
    trim: true,
    required: false,
  },
  
},
  {
    timestamps: true,
  }
);

// GeoJSON Point Schema for location based queries
UserSchema.index({ location: '2dsphere' });
// UserSchema.index({ googleId: 1 }, { sparse: true });
// UserSchema.index({ email: 1 });
UserSchema.index({ roleRequestStatus: 1 }, { sparse: true }); // sparse: true because not all users will have this status

const User = mongoose.model<IUser>('User', UserSchema);
export default User;