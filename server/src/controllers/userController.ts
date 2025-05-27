import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   GET /api/users/profile/:id
// @desc    Get user profile by ID (public, for viewing other users' profiles)
// @access  Public
export const getUserProfileById = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(user);
  } catch (error: any) {
    console.error('Error fetching user profile:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).send('Server error: Could not fetch user profile.');
  }
};


// @route   GET /api/users/me
// @desc    Get logged in user's profile
// @access  Private
export const getMyProfile = async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }
    res.json(req.user);
  } catch (error: any) {
    console.error('Error fetching my profile:', error.message);
    res.status(500).send('Server error: Could not fetch my profile.');
  }
};

// @route   PUT /api/users/profile
// @desc    Update user profile (only logged in user can update their own)
// @access  Private
export const updateMyProfile = async (req: Request, res: Response) => {
  const { username, email, mobileNumber, city, latitude, longitude, profilePictureBase64 } = req.body;

  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    const userId = req.user._id;
    let user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (username !== undefined && user.role === 'buyer') {
      if (username !== user.username) {
        const existingUsername = await User.findOne({ username });
        if (existingUsername && existingUsername._id.toString() !== user._id.toString()) { // _id is now correctly typed
          return res.status(400).json({ message: 'Username already taken.' });
        }
      }
      user.username = username;
    }

    if (email !== undefined) {
      if (email !== user.email) {
        const existingEmail = await User.findOne({ email });
        if (existingEmail && existingEmail._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Email already in use.' });
        }
        user.email = email;
        user.isEmailVerified = false;
      }
    }

    if (mobileNumber !== undefined && user.role === 'seller') {
      if (mobileNumber !== user.mobileNumber) {
        const existingMobile = await User.findOne({ mobileNumber });
        if (existingMobile && existingMobile._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Mobile number already in use.' });
        }
      }
      user.mobileNumber = mobileNumber;
      user.isMobileVerified = false;
    }

    if (city !== undefined && latitude !== undefined && longitude !== undefined) {
      user.location = { 
        type: 'Point', 
        coordinates: [longitude, latitude], 
        city 
      };
    } else if (city !== undefined) {
        user.location = { ...user.location, city: city || undefined };
    }

    if (profilePictureBase64) {
        const uploadResponse = await cloudinary.uploader.upload(profilePictureBase64, {
            upload_preset: 'passitpal_profiles',
            folder: 'profile_pictures'
        });
        user.profilePictureUrl = uploadResponse.secure_url;
    }

    await user.save();

    res.json({
      message: 'Profile updated successfully!',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        mobileNumber: user.mobileNumber,
        role: user.role,
        location: user.location,
        profilePictureUrl: user.profilePictureUrl,
        isEmailVerified: user.isEmailVerified,
        isMobileVerified: user.isMobileVerified
      }
    });

  } catch (error: any) {
    console.error('Error updating profile:', error.message);
    res.status(500).send('Server error: Could not update profile.');
  }
};