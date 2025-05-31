import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { sendOtp, verifyOtp } from "../utils/otp";

// declare module 'express-serve-static-core' {
//   interface Request {
//     user?: {
//       id: string;
//       email: string;
//       role: string;
//     };
//   }
// }

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const {
    email,
    password,
    username,
    mobileNumber,
    role,
    city,
    latitude,
    longitude,
  } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ message: "User with this email already exists." });
    }
    
    if (role === "seller" && mobileNumber ) {
      const existingMobileUser = await User.findOne({ mobileNumber });
      if (existingMobileUser) {
        return res
          .status(400)
          .json({ message: "User with this mobile number already exists." });
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    interface Location {
      city: string;
      type?: 'Point';
      coordinates?: [number, number];
    }
    
    const location: Location = { city };
    
    if (latitude != null && longitude != null) {
      location.type = 'Point';
      location.coordinates = [longitude, latitude];
    }
    else{
      location.type = 'Point';
      location.coordinates = [0, 0]; 
    }

    user = new User({
      email,
      password: hashedPassword,
      // username: role === "buyer" ? username : undefined,
      // mobileNumber: role === "seller" ? mobileNumber : undefined,
      username,
      mobileNumber,
      role,
      location,
      isMobileVerified: false, // Default to false
      isEmailVerified: false, // Default to false on registration
      isBlocked: false,
    });

    await user.save();

    // After successful registration, send email verification OTP
    await sendOtp(user.email, user.mobileNumber, "email","verification" );

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for a verification OTP.",
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified,
      },
    });
  } catch (error: any) {
    console.error("Error during user registration:", error.message);
    res.status(500).json({ message: "Server error: Could not register user." });
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials." });
    }

    if (user.isBlocked) {
      return res
        .status(403)
        .json({
          message: "Your account has been blocked. Please contact support.",
        });
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials." });
    }
    if (!user.isEmailVerified) {
        // Optionally,  can resend an OTP here or just tell the user to verify
        // sendOtp(user.email, 'email', 'verification', user._id.toString()); // If you want to resend automatically on login attempt
        return res.status(403).json({
            message: "Your email is not verified. Please verify your email to log in.",
            needsEmailVerification: true // Frontend can use this flag
        });
    }
    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        email: user.email,
        username: user.username,
        mobileNumber: user.mobileNumber,
        role: user.role,
        city: user.location?.city,
        latitude: user.location?.coordinates?.[1],
        longitude: user.location?.coordinates?.[0],
        isMobileVerified: user.isMobileVerified,
        isEmailVerified: user.isEmailVerified,
        profilePictureUrl: user.profilePictureUrl,
      },
    });
  } catch (error: any) {
    console.error("Error during user login:", error.message);
    res.status(500).json({ message: "Server error: Could not log in user." });
  }
};

// @route   POST /api/auth/request-otp
// @desc    Request OTP for email or mobile verification
// @access  Public (or Private if for existing user)
export const requestOtp = async (req: Request, res: Response) => {
  const { email, type } = req.body; // 'type' can be 'email' or 'mobile'

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (type === "email" && user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }
    if (type === "mobile" && user.isMobileVerified) {
      return res
        .status(400)
        .json({ message: "Mobile number is already verified." });
    }
    if (type === "mobile" && !user.mobileNumber) {
      return res
        .status(400)
        .json({ message: "Mobile number not provided for this user." });
    }

    await sendOtp(user.email, user.mobileNumber, type, "verification");

    res
      .status(200)
      .json({
        message: `OTP sent to your ${
          type === "email" ? "email address" : "mobile number"
        }.`,
      });
  } catch (error: any) {
    console.error("Error requesting OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not request OTP." });
  }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email or mobile
// @access  Public
export const verifyOtpController = async (req: Request, res: Response) => {
  const { email, otp, type } = req.body; // 'type' can be 'email' or 'mobile'

  try {
    const isValid = await verifyOtp(email, otp, type,"verification");

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    res
      .status(200)
      .json({
        message: `${
          type === "email" ? "Email" : "Mobile number"
        } verified successfully!`,
      });
  } catch (error: any) {
    console.error("Error verifying OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not verify OTP." });
  }
};

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for email or mobile
// @access  Public
export const resendOtp = async (req: Request, res: Response) => {
  const { email, type } = req.body; // 'type' can be 'email' or 'mobile'

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (type === "email" && user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified." });
    }
    if (type === "mobile" && user.isMobileVerified) {
      return res
        .status(400)
        .json({ message: "Mobile number is already verified." });
    }
    if (type === "mobile" && !user.mobileNumber) {
      return res
        .status(400)
        .json({ message: "Mobile number not provided for this user." });
    }

    await sendOtp(user.email, user.mobileNumber, type,"verification");

    res
      .status(200)
      .json({
        message: `New OTP sent to your ${
          type === "email" ? "email address" : "mobile number"
        }.`,
      });
  } catch (error: any) {
    console.error("Error resending OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not resend OTP." });
  }
};

// @route   DELETE /api/auth/delete-otp (Consider if really needed, mostly for dev/debug)
// @desc    Delete OTP from user record
// @access  Public
export const deleteOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    user.otp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    res.status(200).json({ message: "OTP deleted successfully." });
  } catch (error: any) {
    console.error("Error deleting OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not delete OTP." });
  }
};

// @route   POST /api/auth/forgot-password-request-otp
// @desc    Request an OTP to reset password via email
// @access  Public
export const forgotPasswordRequestOtp = async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: 'Email is required to request a password reset OTP.' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            // For security, always return a generic message even if user not found
            // to avoid revealing if an email exists in the system.
            return res.status(200).json({ message: 'If a user with that email exists, an OTP has been sent.' });
        }

        // Use our sendOtp utility with purpose 'password_reset'
        await sendOtp(user.email, user.mobileNumber, 'email', 'password_reset');

        res.status(200).json({ message: 'If a user with that email exists, an OTP has been sent to your email.' });
    } catch (error: any) {
        console.error('Error requesting password reset OTP:', error.message);
        res.status(500).json({ message: error.message || 'Server error: Could not send password reset OTP.' });
    }
};

// @route   POST /api/auth/verify-password-reset-otp
// @desc    Verify OTP for password reset and generate a reset token
// @access  Public
export const verifyPasswordResetOtpAndGenerateToken = async (req: Request, res: Response) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ message: 'Email and OTP are required.' });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // Use the verifyOtp utility with purpose 'password_reset'
        const isValid = await verifyOtp(email, otp, 'email', 'password_reset'); // Assuming password reset via email OTP

        if (!isValid) {
            return res.status(400).json({ message: 'Invalid or expired OTP.' });
        }

        // OTP is valid, now generate a password reset token
        const resetToken = crypto.randomBytes(32).toString('hex'); // Generate a random 32-byte hex string
        const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // Token valid for 15 minutes

        // Hash the reset token before saving it to the database for security
        const salt = await bcrypt.genSalt(10);
        user.passwordResetToken = await bcrypt.hash(resetToken, salt);
        user.passwordResetExpires = resetTokenExpiry;
        await user.save();

        res.status(200).json({
            message: 'OTP verified. Please use the reset token to set a new password.',
            resetToken: resetToken // Send the UNHASHED token to the client
        });

    } catch (error: any) {
        console.error('Error verifying password reset OTP:', error.message);
        res.status(500).json({ message: error.message || 'Server error: Could not verify OTP.' });
    }
};

// @route   PUT /api/auth/reset-password
// @desc    Reset user's password using a valid reset token
// @access  Public
export const resetPassword = async (req: Request, res: Response) => {
    const { email, resetToken, newPassword } = req.body;

    if (!email || !resetToken || !newPassword) {
        return res.status(400).json({ message: 'Email, reset token, and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }

    try {
        // Find the user by email and explicitly select the passwordResetToken and passwordResetExpires
        const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Check if a reset token exists on the user document
        if (!user.passwordResetToken || !user.passwordResetExpires) {
            console.log(`Reset Password: No reset token found for user: ${user.email}`);
            return res.status(400).json({ message: 'Password reset token is missing or invalid.' });
        }

        // 2. Check if the reset token has expired
        if (user.passwordResetExpires < new Date()) {
            console.log(`Reset Password: Reset token expired for user: ${user.email}`);
            // Clear expired token fields
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return res.status(400).json({ message: 'Password reset token has expired.' });
        }

        // 3. Compare the provided reset token with the hashed token in the database
        const isMatch = await bcrypt.compare(resetToken, user.passwordResetToken);

        if (!isMatch) {
            console.log(`Reset Password: Provided token does not match stored token for user: ${user.email}`);
            return res.status(400).json({ message: 'Invalid password reset token.' });
        }

        // 4. Hash the new password and update the user's password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 5. Clear the password reset token fields immediately after successful use
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;

        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

    } catch (error: any) {
        console.error('Error resetting password:', error.message);
        res.status(500).json({ message: error.message || 'Server error: Could not reset password.' });
    }
};

// @route   PUT /api/auth/change-password
// @desc    Change password for an authenticated user
// @access  Private (requires authentication)
export const changePassword = async (req: Request, res: Response) => {
    // Ensure the user is authenticated and req.user is available
    if (!req.user || !req.user.id) {
        return res.status(401).json({ message: 'Not authorized, no user ID' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: 'Current password and new password are required.' });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: 'New password must be at least 6 characters long.' });
    }
    if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password cannot be the same as the current password.' });
    }

    try {
        // Find the user by ID and explicitly select the password field
        const user = await User.findById(req.user.id).select('+password');

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // 1. Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password!); // user.password is selected here

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid current password.' });
        }

        // 2. Hash the new password and update
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        await user.save();

        res.status(200).json({ message: 'Password changed successfully.' });

    } catch (error: any) {
        console.error('Error changing password:', error.message);
        res.status(500).json({ message: error.message || 'Server error: Could not change password.' });
    }
};


