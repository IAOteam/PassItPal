import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";
import { generateToken } from "../utils/jwt";
import { sendOtp, verifyOtp } from "../utils/otp";
import { EMAIL_VERIFICATION_SUBJECT } from "../config/constants";
import { sendEmail } from "../utils/emailService";

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
      username: role === "buyer" ? username : undefined,
      mobileNumber: role === "seller" ? mobileNumber : undefined,
      role,
      location,
      isMobileVerified: false, // Default to false
      isEmailVerified: false, // New: Default to false on registration
      isBlocked: false,
    });

    await user.save();

    // After successful registration, send email verification OTP
    await sendOtp(user.email, user.mobileNumber, "email");

    res.status(201).json({
      message:
        "User registered successfully. Please check your email for a verification OTP.",
      user: {
        _id: user._id,
        email: user.email,
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

    await sendOtp(user.email, user.mobileNumber, type);

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
    const isValid = await verifyOtp(email, otp, type);

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

    await sendOtp(user.email, user.mobileNumber, type);

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
