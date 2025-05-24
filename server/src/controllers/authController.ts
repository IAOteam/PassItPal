import { Request, Response } from 'express';
import User, { IUser } from '../models/User.model';
import { generateToken } from '../utils/jwt';
import { sendOtp } from '../utils/otp';
// import { v4 as uuidv4 } from 'uuid'; // Removed as it's not used

// Temporary store for OTPs (In a real app, use Redis or a database with expiry)
const otpStore: { [key: string]: { otp: string; expiresAt: Date; email: string; mobileNumber: string } } = {};

// @route   POST /api/auth/register
// @desc    Register a new user (buyer or seller)
// @access  Public
export const registerUser = async (req: Request, res: Response) => {
  const { username, email, password, mobileNumber, role, city, latitude, longitude } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ message: 'User already exists with this email.' });
    }

    if (role === 'buyer' && username) {
      const existingUsername = await User.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username already taken.' });
      }
    }

    if (role === 'seller' && mobileNumber) {
      const existingMobile = await User.findOne({ mobileNumber });
      if (existingMobile) {
        return res.status(400).json({ message: 'Mobile number already registered.' });
      }
    } else if (role === 'seller' && !mobileNumber) {
      return res.status(400).json({ message: 'Seller must provide a mobile number.' });
    }

    user = new User({
      username: role === 'buyer' ? username : undefined,
      email,
      password,
      mobileNumber: role === 'seller' ? mobileNumber : undefined,
      role: role || 'buyer',
      location: (city && latitude && longitude) ? { city, latitude, longitude } : undefined,
      isEmailVerified: false,
      isMobileVerified: role === 'buyer' ? true : false,
      isBlocked: false // Default to not blocked
    });

    await user.save();

    // If seller, prompt for OTP verification for mobile
    if (user.role === 'seller' && user.mobileNumber) {
      // Don't send OTP directly here, instead, user will call /request-otp
      return res.status(201).json({
        message: 'User registered successfully. Please proceed to verify your mobile number.',
        userId: user._id, // _id is now correctly typed
        email: user.email,
        role: user.role
      });
    }

    // For buyers, directly return token
    const token = generateToken(user._id.toString(), user.role);
    res.status(201).json({
      message: 'User registered successfully.',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error during registration.');
  }
};

// @route   POST /api/auth/request-otp
// @desc    Request OTP for mobile number verification (for sellers)
// @access  Public
export const requestOtp = async (req: Request, res: Response) => {
  const { email, mobileNumber } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'seller') {
      return res.status(400).json({ message: 'OTP verification is only for sellers.' });
    }

    if (user.mobileNumber !== mobileNumber) {
      return res.status(400).json({ message: 'Provided mobile number does not match registered mobile number.' });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({ message: 'Mobile number is already verified.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes

    otpStore[user._id.toString()] = { otp, expiresAt, email, mobileNumber };

    const otpSent = await sendOtp(mobileNumber, otp);

    if (otpSent) {
      res.status(200).json({ message: 'OTP sent to your mobile number for verification.' });
    } else {
      res.status(500).json({ message: 'Failed to send OTP. Please try again.' });
    }

  } catch (error: any) {
    console.error('Error requesting OTP:', error.message);
    res.status(500).send('Server error during OTP request.');
  }
};


// @route   POST /api/auth/verify-otp
// @desc    Verify OTP for seller mobile verification
// @access  Public
export const verifyOtp = async (req: Request, res: Response) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'seller' || !user.mobileNumber) {
      return res.status(400).json({ message: 'OTP verification is only for sellers with mobile numbers.' });
    }

    const storedOtpData = otpStore[user._id.toString()];

    if (!storedOtpData || storedOtpData.otp !== otp || new Date() > storedOtpData.expiresAt) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    user.isMobileVerified = true;
    await user.save();

    delete otpStore[user._id.toString()]; // Remove OTP from temporary store

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      message: 'Mobile number verified successfully!',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error during OTP verification.');
  }
};

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP for seller mobile verification
// @access  Public
export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'seller' || !user.mobileNumber) {
      return res.status(400).json({ message: 'OTP resend is only for sellers with mobile numbers.' });
    }

    if (user.isMobileVerified) {
      return res.status(400).json({ message: 'Mobile number is already verified.' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // OTP expires in 5 minutes
    otpStore[user._id.toString()] = { otp, expiresAt, email: user.email, mobileNumber: user.mobileNumber };

    const otpSent = await sendOtp(user.mobileNumber, otp);

    if (otpSent) {
      return res.status(200).json({ message: 'New OTP sent to your mobile number.' });
    } else {
      return res.status(500).json({ message: 'Failed to resend OTP.' });
    }

  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error during OTP resend.');
  }
};

// @route   DELETE /api/auth/delete-otp
// @desc    Delete OTP from store (e.g., if user cancels verification)
// @access  Public
export const deleteOtp = async (req: Request, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (otpStore[user._id.toString()]) {
      delete otpStore[user._id.toString()];
      return res.status(200).json({ message: 'OTP cleared.' });
    } else {
      return res.status(404).json({ message: 'No active OTP found for this user.' });
    }
  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error during OTP deletion.');
  }
};

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (!user.password) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    if (user.isBlocked) { // Check if user is blocked
      return res.status(403).json({ message: 'Your account has been blocked.' });
    }

    if (user.role === 'seller' && !user.isMobileVerified) {
        return res.status(403).json({ message: 'Please verify your mobile number first.' });
    }

    const token = generateToken(user._id.toString(), user.role);

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error: any) {
    console.error(error.message);
    res.status(500).send('Server error during login.');
  }
};