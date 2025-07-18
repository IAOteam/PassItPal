import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { IUser } from '../models/User';


/**
 * Sends a standardized success response.
 * @param res The Express response object.
 * @param message A descriptive success message.
 * @param data An object containing any data to be sent in the response.
 * @param statusCode The HTTP status code, defaults to 200.
 */
const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

/**
 * Sends a standardized error response.
 * @param res The Express response object.
 * @param error The error object caught in the try-catch block.
 * @param defaultMessage A fallback message if the error has no message.
 */
const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in AuthController: ${error.message}`);
    // Use the status code from our custom HttpError, or default to 500
    const statusCode = error.statusCode || 500;
    const response: { message: string; needsEmailVerification?: boolean } = {
        message: error.message || defaultMessage,
    };

    // Pass along the needsEmailVerification flag if it exists
    if (error.needsEmailVerification) {
        response.needsEmailVerification = true;
    }

    res.status(statusCode).json(response);
};

// --- Controller Methods ---

export const registerUser = async (req: Request, res: Response) => {
  try {
    const user = await AuthService.register(req.body);
    sendSuccess(res, 'User registered successfully. Please check your email for a verification OTP.', { user }, 201);
  } catch (error: any) {
    sendError(res, error, 'Server error: Could not register user.');
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const { accessToken, refreshToken, user } = await AuthService.login(email, password);
    
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

export const refreshAccessToken = async (req: Request, res: Response) => {
    try {
        const newAccessToken = await AuthService.refreshAccessToken(req.cookies.refreshToken);
        sendSuccess(res, 'Access token refreshed successfully.', { token: newAccessToken });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not refresh access token.');
    }
};

export const logoutUser = async (req: Request, res: Response) => {
    try {
        // Ensure req.user exists before trying to access its properties
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

export const requestOtpController = async (req: Request, res: Response) => {
    const { email, type } = req.body;
    try {
        // This is a generic OTP request for verification purposes.
        await AuthService.requestOtp(email, type, 'verification');
        sendSuccess(res, `OTP sent successfully to your ${type}.`);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not request OTP.');
    }
};

export const verifyOtpController = async (req: Request, res: Response) => {
    const { email, otp, type, purpose } = req.body;
    try {
        await AuthService.verifyOtp(email, otp, type, purpose || 'verification');
        sendSuccess(res, `${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully!`);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not verify OTP.');
    }
};

export const resendOtp = async (req: Request, res: Response) => {
    const { email, type } = req.body;
    try {
        // "Resending" is functionally the same as requesting a new OTP for verification.
        await AuthService.requestOtp(email, type, 'verification');
        sendSuccess(res, `A new OTP has been sent to your ${type}.`);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not resend OTP.');
    }
};

export const forgotPasswordRequestOtp = async (req: Request, res: Response) => {
    const { email } = req.body;
    try {
        // This is a specific request for an OTP with the purpose of resetting a password.
        await AuthService.requestOtp(email, 'email', 'password_reset');
        sendSuccess(res, 'If a user with that email exists, a password reset OTP has been sent.');
    } catch (error: any) {
        // For security, even if the user is not found (404), we send a generic success message.
        // This prevents attackers from checking which emails are registered in our system.
        if (error.statusCode === 404) {
            return sendSuccess(res, 'If a user with that email exists, a password reset OTP has been sent.');
        }
        sendError(res, error, 'Server error: Could not send password reset OTP.');
    }
};

export const verifyPasswordResetOtpAndGenerateToken = async (req: Request, res: Response) => {
    const { email, otp } = req.body;
    try {
        const resetToken = await AuthService.verifyPasswordResetOtpAndGenerateToken(email, otp);
        sendSuccess(res, 'OTP verified. Please use the provided token to reset your password.', { resetToken });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not verify password reset OTP.');
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    const { email, resetToken, newPassword } = req.body;
    try {
        await AuthService.resetPassword(email, resetToken, newPassword);
        sendSuccess(res, 'Password has been reset successfully. You can now log in.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not reset password.');
    }
};

export const changePassword = async (req: Request, res: Response) => {
    if (!req.user?._id) {
        return res.status(401).json({ message: 'Not authorized' });
    }
    const { currentPassword, newPassword } = req.body;
    try {
        await AuthService.changePassword(req.user._id.toString(), currentPassword, newPassword);
        sendSuccess(res, 'Password changed successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not change password.');
    }
};

export const googleOAuthCallbackController = async (req: Request, res: Response) => {
    try {
        const { accessToken, refreshToken, user } = await AuthService.handleGoogleAuth(req.user as IUser);

        res.cookie('refreshToken', refreshToken, { 
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'lax', 
            maxAge: 7 * 24 * 60 * 60 * 1000, 
            path: '/' 
        });

        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        const queryParams = new URLSearchParams({
            token: accessToken,
            user: JSON.stringify(user)
        }).toString();
        
        res.redirect(`${clientUrl}/auth/google/success?${queryParams}`);

    } catch (error: any) {
        console.error('[Google Callback] Error processing Google OAuth callback:', error);
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_callback_processing_error`);
    }
};
