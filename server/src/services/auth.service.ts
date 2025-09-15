import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import mongoose from 'mongoose'; // <-- New import
import User , { IUser as IMongooseUser } from '../models/User';
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { sendOtp, verifyOtp as verifyOtpUtil } from '../utils/otp';
import { normalizeIndianMobileNumber } from '../utils/stringUtils';
import { getWelcomeEmailTemplate } from '../utils/emailTemplates';
import { sendEmail } from '../utils/emailService';
import { UserService } from './user.service';
import { IUser as ISharedUser } from '@passitpal/types';


// --- Type Definitions for Clarity ---

type RegisterUserData = Pick<IMongooseUser, 'email' | 'password' | 'username' | 'role' | 'mobileNumber'> & {
    city?: string;
    latitude?: number;
    longitude?: number;
};

type LoginReturnType = {
    accessToken: string;
    refreshToken: string;
    user: ISharedUser;
};

type GoogleAuthReturnType = LoginReturnType;

/**
 * A custom error class that includes an HTTP status code.
 */
export class HttpError extends Error {
    statusCode: number;
    needsEmailVerification?: boolean;

    constructor(message: string, statusCode: number, needsEmailVerification = false) {
        super(message);
        this.statusCode = statusCode;
        this.needsEmailVerification = needsEmailVerification;
        Object.setPrototypeOf(this, HttpError.prototype);
    }
}

export class AuthService {
  /**
   * Registers a new user, hashes their password, and sends a verification OTP.
   * @param userData - The data for the new user.
   * @returns A promise that resolves to a frontend-safe user object.
   */
  static async register(userData: RegisterUserData): Promise<ISharedUser> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { email, password, username, mobileNumber, role, city, latitude, longitude } = userData;

      if (!email || !password || !username || !role) {
          throw new HttpError('Email, password, username, and role are required.', 400);
      }

      // Check for existing users before creating any documents.
      if (await User.findOne({ email }).session(session)) {
        throw new HttpError('User with this email already exists.', 400);
      }

      let normalizedMobile: string | undefined;
      if (mobileNumber) {
        const normalized = normalizeIndianMobileNumber(mobileNumber);
        if (!normalized && mobileNumber.trim() !== '') {
          throw new HttpError('Invalid mobile number format. Please provide a 10-digit Indian mobile number.', 400);
        }
        if (normalized && await User.findOne({ mobileNumber: normalized }).session(session)) {
          throw new HttpError('User with this mobile number already exists.', 400);
        }
        normalizedMobile = normalized || undefined;
      }

      if (role === 'seller' && !normalizedMobile) {
        throw new HttpError('A valid mobile number is required for sellers.', 400);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const location = {
        city: city || 'Not specified',
        type: 'Point' as const,
        coordinates: [longitude ?? 0, latitude ?? 0],
      };

      const user = new User({
        email,
        password: hashedPassword,
        username,
        mobileNumber: normalizedMobile,
        role,
        location,
        authProvider: 'local',
      });

      await user.save({ session });
  
      await sendOtp(user.email, user.mobileNumber, 'email', 'verification',session);

      await session.commitTransaction();
      return UserService.createFrontendUserObject(user);
    } catch(error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  static async login(email: string, password: string): Promise<LoginReturnType> {
    const user = await User.findOne({ email }).select('+password +refreshToken');
    if (!user) { throw new HttpError('Invalid credentials.', 400); }
    if (user.isBlocked) { throw new HttpError('Your account has been blocked. Please contact support.', 403); }
    if (user.authProvider === 'google' && !user.password) { throw new HttpError('You have previously signed in with Google. Please use Google to log in.', 400); }
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) { throw new HttpError('Invalid credentials.', 400); }
    if (!user.isEmailVerified) { throw new HttpError('Your email is not verified. Please verify your email to log in.', 403, true); }
    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshToken = generateRefreshToken(user._id.toString());
    user.refreshToken = refreshToken;
    await user.save();
    return { accessToken, refreshToken, user: UserService.createFrontendUserObject(user) };
  }

  static async refreshAccessToken(incomingRefreshToken: string): Promise<string> {
    if (!incomingRefreshToken) { throw new HttpError('Refresh token not found.', 401); }
    const decoded = verifyRefreshToken(incomingRefreshToken);
    if (!decoded || !decoded.id) { throw new HttpError('Invalid or expired refresh token.', 403); }
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.isBlocked || user.refreshToken !== incomingRefreshToken) { throw new HttpError('Invalid token, user not found, or token mismatch.', 403); }
    return generateToken(user._id.toString(), user.role);
  }

  static async logout(userId: string): Promise<void> {
    const user = await User.findById(userId).select('+refreshToken');
    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }
  }

  static async handleGoogleAuth(passportUser: IMongooseUser): Promise<GoogleAuthReturnType> {
      if (!passportUser) { throw new HttpError('Google authentication failed.', 401); }
      const user = await User.findById(passportUser._id).select("+refreshToken");
      if (!user) { throw new HttpError('Authenticated user not found in database.', 404); }
      const accessToken = generateToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();
      return { accessToken, refreshToken, user: UserService.createFrontendUserObject(user) };
  }

  static async changePassword(userId: string, currentPassword:string, newPassword:string): Promise<void> {
      if (newPassword.length < 6) { throw new HttpError('New password must be at least 6 characters long.', 400); }
      if (currentPassword === newPassword) { throw new HttpError('New password cannot be the same as the current password.', 400); }
      const user = await User.findById(userId).select('+password');
      if (!user) { throw new HttpError('User not found.', 404); }
      if (user.authProvider === 'google') { throw new HttpError('Cannot change password for an account created with Google.', 400); }
      const isMatch = await bcrypt.compare(currentPassword, user.password!);
      if (!isMatch) { throw new HttpError('Invalid current password.', 401); }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
  }

  static async requestOtp(email: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset'): Promise<void> {
      const user = await User.findOne({ email });
      if (!user) { throw new HttpError('User not found.', 404); }
      if (type === 'email' && purpose === 'verification' && user.isEmailVerified) { throw new HttpError('Email is already verified.', 400); }
      if (type === 'mobile' && purpose === 'verification' && user.isMobileVerified) { throw new HttpError('Mobile number is already verified.', 400); }
      if (type === 'mobile' && !user.mobileNumber) { throw new HttpError('No mobile number is associated with this account. Please update your profile first or use email verification.', 400); }
      try {
        await sendOtp(user.email, user.mobileNumber, type, purpose);
      } catch (error: any) {
        console.error(`[AuthService] Failed to send ${type} OTP:`, error.message);
        if (type === 'mobile') {
          throw new HttpError(`SMS delivery failed. This could be due to network issues or invalid mobile number. Please try email verification or check your mobile number. Error: ${error.message}`, 500);
        }
        throw error;
      }
  }

  static async verifyOtp(email: string, otp: string, type: 'email' | 'mobile', purpose: 'verification' | 'password_reset'): Promise<LoginReturnType> {
      const user = await User.findOne({ email }).select('+otp +otpExpiry +otpPurpose +refreshToken');
      if (!user) { throw new HttpError('User not found.', 404); }
      const isValid = await verifyOtpUtil(email, otp, type, purpose);
      if (!isValid) { throw new HttpError('Invalid or expired OTP.', 400); }
      if (type === 'email' && purpose === 'verification' && !user.isEmailVerified) {
          user.isEmailVerified = true;
          const { subject, html } = getWelcomeEmailTemplate(user.username);
          sendEmail(user.email, subject, '', html).catch(err => console.error("Failed to send welcome email on verification:", err));
      } else if (type === 'mobile') {
          user.isMobileVerified = true;
      }
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpPurpose = undefined;
      user.otpVerifiedAt = new Date();
      await user.save();
      const accessToken = generateToken(user._id.toString(), user.role);
      const refreshToken = generateRefreshToken(user._id.toString());
      user.refreshToken = refreshToken;
      await user.save();
      return { accessToken, refreshToken, user: UserService.createFrontendUserObject(user) };
  }

  static async verifyPasswordResetOtpAndGenerateToken(email: string, otp: string): Promise<string> {
      const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');
      if (!user) { throw new HttpError('User not found.', 404); }
      const isValid = await verifyOtpUtil(email, otp, 'email', 'password_reset');
      if (!isValid) { throw new HttpError('Invalid or expired OTP.', 400); }
      const resetToken = crypto.randomBytes(32).toString('hex');
      const salt = await bcrypt.genSalt(10);
      user.passwordResetToken = await bcrypt.hash(resetToken, salt);
      user.passwordResetExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
      await user.save();
      return resetToken;
  }

  static async resetPassword(email: string, resetToken: string, newPassword: string): Promise<void> {
      if (newPassword.length < 6) { throw new HttpError('New password must be at least 6 characters long.', 400); }
      const user = await User.findOne({ email }).select('+password +passwordResetToken +passwordResetExpires');
      if (!user || !user.passwordResetToken || !user.passwordResetExpires) { throw new HttpError('Invalid or missing password reset token. Please request a new one.', 400); }
      if (user.passwordResetExpires < new Date()) { throw new HttpError('Password reset token has expired. Please request a new one.', 400); }
      const isMatch = await bcrypt.compare(resetToken, user.passwordResetToken);
      if (!isMatch) { throw new HttpError('Invalid password reset token.', 400); }
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      user.otp = undefined;
      user.otpExpiry = undefined;
      user.otpPurpose = undefined;
      await user.save();
  }
}
