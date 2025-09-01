import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { IUser as IMongooseUser } from '../models/User';

/**
 * Sends a standardized success response.
 */
const sendSuccess = (
  res: Response,
  message: string,
  data: object = {},
  statusCode = 200
) => {
  res.status(statusCode).json({ message, ...data });
};

/**
 * Sends a standardized error response.
 */
const sendError = (res: Response, error: any, defaultMessage: string) => {
  console.error(`Error in AuthController: ${error.message}`);
  const statusCode = error.statusCode || 500;
  const response: { message: string; needsEmailVerification?: boolean } = {
    message: error.message || defaultMessage,
  };

  if (error.needsEmailVerification) {
    response.needsEmailVerification = true;
  }

  res.status(statusCode).json(response);
};

// --- Controller Methods ---

/**
 * Registers a new user and sends OTP for verification.
 */
export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    sendSuccess(
      res,
      'User registered successfully. Please check your email for a verification OTP.',
      { user },
      201
    );
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not register user.');
  }
};

/**
 * Logs in a user and sets refresh token in an HTTP-only cookie.
 */
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { accessToken, refreshToken, user } = await AuthService.login(
      email,
      password
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, 'Login successful', { token: accessToken, user });
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not log in user.');
  }
};

/**
 * Refreshes an access token using a valid refresh token.
 */
export const refreshAccessToken = async (req: Request, res: Response) => {
  try {
    const newAccessToken = await AuthService.refreshAccessToken(
      req.cookies.refreshToken
    );
    sendSuccess(res, 'Access token refreshed successfully.', {
      token: newAccessToken,
    });
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not refresh access token.');
  }
};

/**
 * Logs out a user by clearing refresh token in DB and cookie.
 */
export const logoutUser = async (req: Request, res: Response) => {
  try {
    if (req.user?._id) {
      await AuthService.logout(req.user._id.toString());
    }

    res.cookie('refreshToken', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0),
      path: '/',
    });

    sendSuccess(res, 'Logged out successfully.');
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not log out user.');
  }
};

/**
 * Requests a verification OTP for email or mobile.
 */
export const requestOtpController = async (req: Request, res: Response) => {
  const { email, type } = req.body;
  try {
    await AuthService.requestOtp(email, type, 'verification');
    sendSuccess(res, `OTP sent successfully to your ${type}.`);
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not request OTP.');
  }
};

/**
 * Verifies an OTP and logs in user automatically if successful.
 */
export const verifyOtpController = async (req: Request, res: Response) => {
  const { email, otp, type, purpose } = req.body;
  try {
    const result = await AuthService.verifyOtp(
      email,
      otp,
      type,
      purpose || 'verification'
    );

    // Auto-login after verification: issue cookies & return tokens
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    sendSuccess(res, `${type} verified successfully!`, {
      token: result.accessToken,
      user: result.user,
    });
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not verify OTP.');
  }
};

/**
 * Resends a verification OTP (same as requestOtp).
 */
export const resendOtp = async (req: Request, res: Response) => {
  const { email, type } = req.body;
  try {
    await AuthService.requestOtp(email, type, 'verification');
    sendSuccess(res, `A new OTP has been sent to your ${type}.`);
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not resend OTP.');
  }
};

/**
 * Requests an OTP for password reset.
 * Note: always return generic success to prevent account enumeration.
 */
export const forgotPasswordRequestOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    await AuthService.requestOtp(email, 'email', 'password_reset');
    sendSuccess(
      res,
      'If a user with that email exists, a password reset OTP has been sent.'
    );
  } catch (error: any) {
    if (error.statusCode === 404) {
      return sendSuccess(
        res,
        'If a user with that email exists, a password reset OTP has been sent.'
      );
    }
    sendError(res, error, 'Server error: Could not send password reset OTP.');
  }
};

/**
 * Verifies a password reset OTP and generates a reset token.
 */
export const verifyPasswordResetOtpAndGenerateToken = async (
  req: Request,
  res: Response
) => {
  const { email, otp } = req.body;
  try {
    const resetToken = await AuthService.verifyPasswordResetOtpAndGenerateToken(
      email,
      otp
    );
    sendSuccess(
      res,
      'OTP verified. Please use the provided token to reset your password.',
      { resetToken }
    );
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not verify password reset OTP.');
  }
};

/**
 * Resets password using a valid password reset token.
 */
export const resetPassword = async (req: Request, res: Response) => {
  const { email, resetToken, newPassword } = req.body;
  try {
    await AuthService.resetPassword(email, resetToken, newPassword);
    sendSuccess(
      res,
      'Password has been reset successfully. You can now log in.'
    );
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not reset password.');
  }
};

/**
 * Changes password for logged-in users.
 */
export const changePassword = async (req: Request, res: Response) => {
  if (!req.user?._id) {
    return res.status(401).json({ message: 'Not authorized' });
  }
  const { currentPassword, newPassword } = req.body;
  try {
    await AuthService.changePassword(
      req.user._id.toString(),
      currentPassword,
      newPassword
    );
    sendSuccess(res, 'Password changed successfully.');
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not change password.');
  }
};

/**
 * Handles Google OAuth callback, sets refresh token, and redirects to frontend.
 */
export const googleOAuthCallbackController = async (
  req: Request,
  res: Response
) => {
  try {
    const { accessToken, refreshToken, user } =
      await AuthService.handleGoogleAuth(req.user as IMongooseUser);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    const clientUrl =
      req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    const queryParams = new URLSearchParams({
      token: accessToken,
      user: JSON.stringify(user),
    }).toString();

    res.redirect(`${clientUrl}/auth/google/success?${queryParams}`);
  } catch (error: any) {
    console.error(
      '[Google Callback] Error processing Google OAuth callback:',
      error
    );
    const clientUrl =
      req.headers.origin || process.env.CLIENT_URL || 'http://localhost:5173';
    res.redirect(
      `${clientUrl}/login?error=google_callback_processing_error`
    );
  }
};
