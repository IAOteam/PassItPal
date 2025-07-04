import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User , {IUser} from "../models/User";
import { generateToken ,generateRefreshToken, verifyRefreshToken} from "../utils/jwt";
import { sendOtp, verifyOtp } from "../utils/otp";
import { normalizeIndianMobileNumber } from "../utils/stringUtils";
import { createFrontendUserObject } from "./userController";

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
    let normalizedMobile: string | null = null;
    if (mobileNumber) { // If mobile number is provided
        normalizedMobile = normalizeIndianMobileNumber(mobileNumber);
        if (!normalizedMobile && mobileNumber.trim() !== "") {
            return res.status(400).json({ message: 'Invalid mobile number format for registration. Please provide a 10-digit Indian mobile number.' });
        }
        // Check uniqueness of normalized number
        
        if (normalizedMobile) { // Check uniqueness only if normalizedMobile is valid
            const existingMobileUser = await User.findOne({ mobileNumber: normalizedMobile });
            if (existingMobileUser) {
                return res.status(400).json({ message: "User with this mobile number already exists." });
            }
        }
    }
    if (role === 'seller' && !normalizedMobile) {
        return res.status(400).json({ message: "Seller must provide a valid mobile number."});
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // interface Location {
    //   city: string;
    //   type?: 'Point';
    //   coordinates?: [number, number];
    // }
    
    const location = {
      city: city,
      type: 'Point',
      coordinates: [
        longitude != null ? longitude : 0,
        latitude != null ? latitude : 0
      ]
    };

    // if (latitude != null && longitude != null) {
    //   location.type = 'Point';
    //   location.coordinates = [longitude, latitude];
    // }
    // else{
    //   location.type = 'Point';
    //   // location.coordinates = [0, 0]; 
    // }

    user = new User({
      email,
      password: hashedPassword,
      // username: role === "buyer" ? username : undefined,
      // mobileNumber: role === "seller" ? mobileNumber : undefined,
      username,
      mobileNumber: normalizedMobile|| undefined,
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
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return res.status(400).json({ message: messages.join(', ') });
    }
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
    const accessToken = generateToken(user._id.toString(), user.role);
    const refreshTokenVal = generateRefreshToken(user._id.toString());

     // refreshToken to user and persist
    user.refreshToken = refreshTokenVal;
    await user.save();

    // refreshToken as HttpOnly cookie
    res.cookie('refreshToken', refreshTokenVal, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    res.json({
      message: "Login successful",
      token: accessToken,
      user: createFrontendUserObject(user)
      },
    );
  } catch (error: any) {
    // console.error("Error during user login:", error.message);
    res.status(500).json({ message: "Server error: Could not log in user." });
  }
};
export const refreshAccessToken = async (req: Request, res: Response) => {
  // console.log('[Refresh Token Endpoint] req.cookies:', req.cookies);
  const incomingRefreshToken = req.cookies.refreshToken;

  if (!incomingRefreshToken) {
    return res.status(401).json({ message: 'Refresh token not found in cookies.' });
  }

  try {
    const decoded = verifyRefreshToken(incomingRefreshToken);
    if (!decoded || !decoded.id) {
      return res.status(403).json({ message: 'Invalid or expired refresh token (decode failed).' });
    }

    // CRITICAL FIX: Explicitly select refreshToken as it has select:false in schema
    const user = await User.findById(decoded.id).select('+refreshToken');

    if (!user) {
      return res.status(403).json({ message: 'User not found for this token.' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }
    
    // console.log(`[Refresh Token Endpoint] Incoming RF Token: ${incomingRefreshToken}`);
    // console.log(`[Refresh Token Endpoint] Stored RF Token on User: ${user.refreshToken}`);

    if (user.refreshToken !== incomingRefreshToken) {
      // console.warn(`[Refresh Token Endpoint] Mismatch for user ${user.email}. Denying refresh. Possible token reuse or session invalidation.`);
      // Security measure: If a potentially compromised or old refresh token is used,
      // invalidate all refresh tokens for this user by clearing the stored one.
      // user.refreshToken = undefined; 
      // await user.save();
      return res.status(403).json({ message: 'Refresh token mismatch or invalidated. Please log in again.' });
    }

    const newAccessToken = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Access token refreshed successfully.',
      token: newAccessToken,
    });

  } catch (error: any) {
    console.error('[Refresh Token Endpoint] Error:', error.message);
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return res.status(403).json({ message: `Invalid or expired refresh token (${error.message}). Please log in again.` });
    }
    return res.status(500).json({ message: 'Server error: Could not refresh access token.' });
  }
};

export const logoutUser = async (req: Request, res: Response) => {
  const userId = req.user?._id;

  if (!userId) {
    return res.status(401).json({ message: 'User not authenticated.' });
  }

  try {
    const user = await User.findById(userId).select('+refreshToken');;

    if (user) {
      user.refreshToken = undefined;
      await user.save();
    }

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    res.status(200).json({ message: 'Logged out successfully.' });

  } catch (error: any) {
    console.error('Error during user logout:', error.message);
    res.status(500).json({ message: 'Server error: Could not log out user.' });
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
    // console.error("Error requesting OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not request OTP." });
  }
};

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for email or mobile
// @access  Public
export const verifyOtpController = async (req: Request, res: Response) => {
  const { email, otp, type } = req.body; // 'type' can be 'email' or 'mobile'
  const purpose = req.body.purpose || "verification";
  try {
    const isValid = await verifyOtp(email, otp, type,purpose as 'verification' | 'password_reset');

    if (!isValid) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // If verifyOtp internally updates user status, no need to find and save user here again
    // just for isEmailVerified or isMobileVerified flags.
    // If it doesn't, you would:
    // const user = await User.findOne({ email });
    // if (user) {
    //   if (type === 'email') user.isEmailVerified = true;
    //   if (type === 'mobile') user.isMobileVerified = true;
    //   user.otp = undefined; user.otpExpiry = undefined; // Clear OTP after verification
    //   await user.save();
    // }
    const user = await User.findOne({ email }); // Re-fetch to update if verifyOtp doesn't save for all cases
    if (user) {
        let updated = false;
        if (purpose === 'verification') {
            if (type === 'email' && !user.isEmailVerified) { user.isEmailVerified = true; updated = true; }
            if (type === 'mobile' && user.mobileNumber && !user.isMobileVerified) { user.isMobileVerified = true; updated = true; }
        }
        // verifyOtp now clears OTP fields. If it didn't, you'd clear them here.
        if (updated) await user.save();
    }
    if (purpose === 'password_reset' && isValid) { // verifyOtp for password_reset only validates, doesn't issue token
        // The verifyPasswordResetOtpAndGenerateToken function handles token generation
        return res.status(200).json({ message: "OTP for password reset is valid. Proceed to reset password with token."})
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
    // console.error("Error resending OTP:", error.message);
    res.status(500).json({ message: "Server error: Could not resend OTP." });
  }
};

// @route   DELETE /api/auth/delete-otp (Consider if really needed, mostly for dev/debug)
// @desc    Delete OTP from user record
// @access  Public
// export const deleteOtp = async (req: Request, res: Response) => {
//   const { email } = req.body;

//   try {
//     const user = await User.findOne({ email });
//     if (!user) {
//       return res.status(404).json({ message: "User not found." });
//     }

//     user.otp = undefined;
//     user.otpExpiry = undefined;
//     await user.save();

//     res.status(200).json({ message: "OTP deleted successfully." });
//   } catch (error: any) {
//     // console.error("Error deleting OTP:", error.message);
//     res.status(500).json({ message: "Server error: Could not delete OTP." });
//   }
// };

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
        // console.error('Error requesting password reset OTP:', error.message);
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
        // console.error('Error verifying password reset OTP:', error.message);
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
            // console.log(`Reset Password: No reset token found for user: ${user.email}`);
            return res.status(400).json({ message: 'Password reset token is missing or invalid.' });
        }

        // 2. Check if the reset token has expired
        if (user.passwordResetExpires < new Date()) {
            // console.log(`Reset Password: Reset token expired for user: ${user.email}`);
            // Clear expired token fields
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            return res.status(400).json({ message: 'Password reset token has expired.' });
        }

        // 3. Compare the provided reset token with the hashed token in the database
        const isMatch = await bcrypt.compare(resetToken, user.passwordResetToken);

        if (!isMatch) {
            // console.log(`Reset Password: Provided token does not match stored token for user: ${user.email}`);
            return res.status(400).json({ message: 'Invalid password reset token.' });
        }

        // 4. Hash the new password and update the user's password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);

        // 5. Clear the password reset token fields immediately after successful use
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.otp = undefined; // Also clear OTP fields if used for this flow
        user.otpExpiry = undefined;
        user.otpPurpose = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully. You can now log in with your new password.' });

    } catch (error: any) {
        // console.error('Error resetting password:', error.message);
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
        // console.error('Error changing password:', error.message);
        res.status(500).json({ message: error.message || 'Server error: Could not change password.' });
    }
};

export const googleOAuthCallbackController = async (req: Request, res: Response) => {
  // console.log(`[Google Callback Controller] Entered at: ${new Date().toISOString()}`);
  if (!req.user) {
    console.error('[Google Callback] User not found in req.user after Google auth.');
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed`);
  }
  try {
    const userFromPassport = req.user as IUser; // User from passport verify callback
    // Re-fetch user to ensure we have the latest full document, especially if passport-setup modified it
    const userToUpdate = await User.findById(userFromPassport._id).select("+refreshToken");
    if (!userToUpdate) {
        console.error('[Google Callback] User from Passport could not be re-fetched from DB.');
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=user_not_found_db`);
    }

    const accessToken = generateToken(userToUpdate._id.toString(), userToUpdate.role);
    const refreshTokenVal = generateRefreshToken(userToUpdate._id.toString());
    userToUpdate.refreshToken = refreshTokenVal;
    await userToUpdate.save();

    res.cookie('refreshToken', refreshTokenVal, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000, path: '/' });
    const frontendUserData = {
        _id: userToUpdate._id.toString(), email: userToUpdate.email, username: userToUpdate.username, role: userToUpdate.role,
        isEmailVerified: userToUpdate.isEmailVerified, isMobileVerified: userToUpdate.isMobileVerified,
        city: userToUpdate.location?.city || "",mobileNumber: userToUpdate.mobileNumber || "",
        profilePictureUrl: userToUpdate.profilePictureUrl,
        requestedRole: userToUpdate.requestedRole, roleRequestStatus: userToUpdate.roleRequestStatus, // Include these
    };
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const queryParams = new URLSearchParams({ token: accessToken, user: JSON.stringify(frontendUserData) }).toString();
    // console.log(`[Google Callback] Redirecting to: ${clientUrl}/auth/google/success with token and user data.`);
    res.redirect(`${clientUrl}/auth/google/success?${queryParams}`);
  } catch (error: any) { console.error('[Google Callback] Error processing Google OAuth callback:', error); res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_callback_processing_error`); }
};