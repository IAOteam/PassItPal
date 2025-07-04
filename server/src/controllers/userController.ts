import { Request, Response } from 'express';
import User, { IUser } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { Types } from 'mongoose';
import { normalizeIndianMobileNumber } from '../utils/stringUtils';
import { createAndEmitNotification } from './notificationController';
import Order , {type IOrder} from '../models/Order';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Helper function to create a consistent user response object
export const createFrontendUserObject = (user: IUser) => {
  if (!user) return null;
  return {
    _id: user._id.toString(),
    email: user.email,
    username: user.username,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    isMobileVerified: user.isMobileVerified,
    city: user.location?.city || "", // Flatten city from location
    mobileNumber: user.mobileNumber || "", // ALWAYS include mobile number if it exists
    profilePictureUrl: user.profilePictureUrl,
    requestedRole: user.requestedRole,
    roleRequestStatus: user.roleRequestStatus,
  };
};

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
  // console.log(`[UpdateProfileController] START - Request body:`, JSON.stringify(req.body));

  const { username, email: newEmailInput, mobileNumber: newMobileInputFromReq, city, latitude, longitude, profilePictureBase64 } = req.body;

  try {
    if (!req.user || !req.user._id) { // Check req.user and req.user._id
      console.error('[UpdateProfileController] Error: User not authenticated or _id missing.');
      return res.status(401).json({ message: 'Not authorized, user not logged in or user ID missing.' });
    }

    const userId = req.user._id;
    // console.log(`[UpdateProfileController] Authenticated userId: ${userId}`);
    
    const user = await User.findById(userId);

    if (!user) {
      console.error(`[UpdateProfileController] Error: User with ID ${userId} not found in DB.`);
      return res.status(404).json({ message: 'User not found.' });
    }
    // console.log(`[UpdateProfileController] User found. Current mobile: ${user.mobileNumber}, city: ${user.location?.city}`);

    let changesMade = false;

    // Username update
    if (username !== undefined && username !== user.username) {
      // console.log(`[UpdateProfileController] Updating username to: ${username}`);
      const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
      if (existingUsername) {
        // console.log(`[UpdateProfileController] Error: Username '${username}' already taken.`);
        return res.status(400).json({ message: 'Username already taken.' });
      }
      user.username = username;
      changesMade = true;
    }

    // Email update (careful with re-verification flow)
    if (newEmailInput !== undefined && newEmailInput !== user.email) {
      // console.log(`[UpdateProfileController] Updating email to: ${newEmailInput}`);
      const existingEmail = await User.findOne({ email: newEmailInput, _id: { $ne: userId } });
      if (existingEmail) {
        // console.log(`[UpdateProfileController] Error: Email '${newEmailInput}' already in use.`);
        return res.status(400).json({ message: 'Email already in use by another account.' });
      }
      user.email = newEmailInput;
      user.isEmailVerified = false; // Requires re-verification
      changesMade = true;
    }

    // Mobile Number Update
    if (newMobileInputFromReq !== undefined) {
      // console.log(`[UpdateProfileController] Mobile input received: '${newMobileInputFromReq}'`);
      if (newMobileInputFromReq === "" || newMobileInputFromReq === null) {
        if (user.mobileNumber) { // Only change if it was previously set
            // console.log(`[UpdateProfileController] Removing mobile number.`);
            user.mobileNumber = undefined;
            user.isMobileVerified = false;
            changesMade = true;
        }
      } else {
        const normalizedNewMobile = normalizeIndianMobileNumber(newMobileInputFromReq);
        // console.log(`[UpdateProfileController] Normalized new mobile: '${normalizedNewMobile}'`);
        if (!normalizedNewMobile) {
          // console.log(`[UpdateProfileController] Error: Invalid mobile format for input: '${newMobileInputFromReq}'`);
          return res.status(400).json({ message: 'Invalid mobile number format. Please provide a 10-digit Indian mobile number.' });
        }

        const currentStoredNormalizedMobile = user.mobileNumber ? normalizeIndianMobileNumber(user.mobileNumber) : null;
        if (normalizedNewMobile !== currentStoredNormalizedMobile) {
          // console.log(`[UpdateProfileController] New mobile '${normalizedNewMobile}' different from current '${currentStoredNormalizedMobile}'. Checking uniqueness.`);
          const existingMobileUser = await User.findOne({ mobileNumber: normalizedNewMobile, _id: { $ne: userId } });
          if (existingMobileUser) {
            // console.log(`[UpdateProfileController] Error: Mobile number '${normalizedNewMobile}' already registered.`);
            return res.status(400).json({ message: 'This mobile number is already registered with another account.' });
          }
          user.mobileNumber = normalizedNewMobile;
          user.isMobileVerified = false;
          changesMade = true;
          // console.log(`[UpdateProfileController] Mobile updated to: ${user.mobileNumber}, unverified.`);
        } else {
            // console.log(`[UpdateProfileController] Mobile number '${normalizedNewMobile}' is same as current, or input was invalid and resulted in no change.`);
             // Ensure stored version is the normalized one if it somehow wasn't (e.g. old data)
            if (user.mobileNumber !== normalizedNewMobile) {
                 user.mobileNumber = normalizedNewMobile;
                 changesMade = true; // This could happen if the stored number wasn't normalized
            }
        }
      }
    }

    // Location (City only, no coordinates as per request)
    if (city !== undefined) {
      // console.log(`[UpdateProfileController] Processing city update. Current city: '${user.location?.city}', New city input: '${city}'`);
      // Initialize user.location if it's missing (shouldn't happen for Google-created users if defaults are set)
      if (!user.location) {
        // console.log('[UpdateProfileController] Initializing user.location object.');
        user.location = { type: 'Point', coordinates: [0,0], city: '' }; // Default structure
      }
      if (city !== user.location.city) {
        user.location.city = city;
        changesMade = true;
        // console.log(`[UpdateProfileController] City updated in memory to: '${user.location.city}'`);
      } else {
        // console.log(`[UpdateProfileController] City is the same, no update needed.`);
      }
    }
    // Latitude/Longitude are not processed from request body based on new requirement.
    // Existing coordinates in user.location.coordinates will be preserved unless explicitly changed.

    // Profile Picture update
    if (profilePictureBase64) {
      // console.log('[UpdateProfileController] Attempting to upload profile picture...');
      try {
          const uploadResponse = await cloudinary.uploader.upload(profilePictureBase64, {
              upload_preset: 'passitpal_profiles', folder: 'profile_pictures'
          });
          if (user.profilePictureUrl !== uploadResponse.secure_url) {
            user.profilePictureUrl = uploadResponse.secure_url;
            changesMade = true;
          }
          // console.log('[UpdateProfileController] Profile picture processed. New URL:', user.profilePictureUrl);
      } catch (uploadError: any) {
          console.error('[UpdateProfileController] Cloudinary upload error:', uploadError.message);
          // Not returning error here, just logging. Profile update can proceed without picture update.
      }
    }

    if (!changesMade) {
        // console.log('[UpdateProfileController] No actual changes detected. Sending back current user data.');
        // Send back the current user data without saving if no changes
        const noChangeUserResponse = { /* ... construct response user object as below ... */ 
            _id: user._id, username: user.username, email: user.email, mobileNumber: user.mobileNumber, role: user.role,
            city: user.location?.city || "", profilePictureUrl: user.profilePictureUrl, isEmailVerified: user.isEmailVerified,
            isMobileVerified: user.isMobileVerified, requestedRole: user.requestedRole, roleRequestStatus: user.roleRequestStatus,
        };
        return res.json({ message: 'No changes to update.', user: noChangeUserResponse });
    }

    // console.log('[UpdateProfileController] Attempting to save user document...');
    await user.save(); // This triggers Mongoose validation from schema
    // console.log('[UpdateProfileController] User document saved successfully.');

    const responseUser = createFrontendUserObject(user);

    res.status(200).json({ // Explicitly set 200 OK
      message: 'Profile updated successfully!',
      user: responseUser
    });

  } catch (error: any) {
    console.error('[UpdateProfileController] CRITICAL ERROR in profile update:', error.message, error.stack);
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        console.error('[UpdateProfileController] Mongoose ValidationError:', messages.join(', '));
        return res.status(400).json({ message: messages.join(', ') });
    }
    // Ensure a response is always sent
    res.status(500).json({ message: 'Server error: Could not update profile.' });
  }
};

// @route   GET /api/users/all
// @desc    Get all users (Admin only)
// @access  Private (Admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Only return essential user info for admin view, exclude password, OTPs
    const users = await User.find().select('-password -otp -otpExpiry');
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching all users:', error.message);
    res.status(500).send('Server error: Could not fetch users.');
  }
};

// @route   PUT /api/users/block/:id
// @desc    Block/Unblock a user (Admin only)
// @access  Private (Admin)
export const blockUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { isBlocked } = req.body; // Expecting true or false

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Admins cannot block other admins or themselves
    if (user.role === 'admin' && user._id.toString() !== req.user?._id.toString()) {
        return res.status(403).json({ message: 'Cannot block another admin.' });
    }
    if (user._id.toString() === req.user?._id.toString()) {
        return res.status(403).json({ message: 'Cannot block/unblock your own admin account.' });
    }

    user.isBlocked = isBlocked;
    await user.save();

    res.json({ message: `User ${isBlocked ? 'blocked' : 'unblocked'} successfully.`, user: { id: user._id, username: user.username, email: user.email, isBlocked: user.isBlocked } });

  } catch (error: any) {
    console.error(`Error ${isBlocked ? 'blocking' : 'unblocking'} user:`, error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).send(`Server error: Could not ${isBlocked ? 'block' : 'unblock'} user.`);
  }
};

// @route   GET /api/users/me
// @desc    Get current authenticated user's profile
// @access  Private
export const getMe = async (req: Request, res: Response) => { 
    try {
        if (!req.user || !req.user._id) return res.status(401).json({ message: 'Not authorized' });
        const user = await User.findById(req.user._id).select('-password -otp -otpExpiry -refreshToken -passwordResetToken -passwordResetExpires');
        if (!user) return res.status(404).json({ message: 'User not found.' });
        
        const responseUser = createFrontendUserObject(user);
        res.status(200).json({ message: 'User profile fetched successfully.', user: responseUser });
    } catch (error: any) {
        console.error('Error fetching user profile /me:', error.message);
        res.status(500).json({ message: 'Server error: Could not fetch user profile.' });
    }
};

// @route   PUT /api/users/me
// @desc    Update current authenticated user's profile
// @access  Private
export const updateMe = async (req: Request, res: Response) => {
  const userId = req.user?._id; // User's ID from the token
  const { username, mobileNumber, profilePictureUrl, city } = req.body; // Fields allowed for update

  try {
    if (!userId) {
      return res.status(401).json({ message: 'Not authenticated.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Update fields if they are provided in the request body
    if (username) {
      user.username = username;
    }
    if (mobileNumber) {
      user.mobileNumber = mobileNumber;
    }
    if (profilePictureUrl) {
      user.profilePictureUrl = profilePictureUrl;
    }
    // Update city within the location object
    if (city) {
      //  re-geocode the city to update coordinates if needed,
      // we'll just update the city name. then map api later
      // If you decide to re-geocode, ensure you have the geocodeAddress function available here.
      user.location.city = city;
    }

    // Prevent direct modification of sensitive fields or roles through this endpoint
    // Example: if (req.body.role) { delete req.body.role; } etc.

    user.updatedAt = new Date(); // Manually update updatedAt if not handled by schema options

    await user.save();

    // Return updated user profile, excluding sensitive fields
    const updatedUser = await User.findById(userId).select('-password -otp -otpExpiry');

    res.status(200).json({
      message: 'User profile updated successfully.',
      user: updatedUser
    });

  } catch (error: any) {
    console.error('Error updating user profile:', error.message);
    // Handle unique constraint errors (e.g., mobileNumber already exists)
    if (error.code === 11000) {
        return res.status(400).json({ message: 'Mobile number already registered.' });
    }
    res.status(500).json({ message: 'Server error: Could not update user profile.' });
  }
};

// NEW FUNCTION: Request Role Change
// @route   POST /api/users/me/request-role-change
// @desc    User requests to change their role
// @access  Private
export const switchUserRole = async (req: Request, res: Response) => {  
  const userId = req.user?._id;
  const { newRole } = req.body as { newRole: 'buyer' | 'seller' };

  if (!userId) return res.status(401).json({ message: 'User not authenticated.' });
  if (!newRole || (newRole !== 'buyer' && newRole !== 'seller')) return res.status(400).json({ message: 'Invalid new role specified.' });

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found.' });
    if (user.role === newRole) return res.status(400).json({ message: `You are already a ${newRole}.` });
    // if (user.roleRequestStatus === 'pending') return res.status(400).json({ message: `You already have a pending role change request to become a ${user.requestedRole}.`});

     // 1. Check Prerequisites
    if (!user.isEmailVerified) {
        return res.status(400).json({ message: 'Your email must be verified to switch roles.' });
    }
    if (newRole === 'seller') {
      // Prerequisite check to become a seller
      if (!user.isEmailVerified || !user.isMobileVerified) {
        return res.status(403).json({ message: 'To become a seller, your email and mobile number must both be verified.' });
      }
    } 
    // if (!user.isMobileVerified) {
    //     return res.status(400).json({ message: 'Your mobile number must be verified to switch roles.' });
    // }
    // 2. Check for Active Transactions (if switching from seller to buyer)
    if (user.role === 'seller' && newRole === 'buyer') {
        const activeListingsWithOrders = await Order.findOne({
            seller: userId,
            status: { $in: ['pending', 'accepted'] } // Check for orders that are not finalized
        });
        if (activeListingsWithOrders) {
            return res.status(400).json({ message: 'You cannot switch to a buyer role while you have active or pending orders on your listings. Please resolve them first.' });
        }
        // Optional: you could also check for listings that are just 'active' but have no orders yet.
        // For now, checking orders is a strong guarantee.
    }
    const oldRole = user.role;
    user.role = newRole;

    user.requestedRole = undefined;
    user.roleRequestStatus = undefined;
    user.roleRequestTimestamp = undefined;
    user.roleReviewNotes = undefined;

    await user.save();
    // console.log(`User ${user.email} successfully switched role from ${oldRole} to ${newRole}.`);

    // Notify user of the successful role change
    await createAndEmitNotification(
      userId.toString(),
      'admin_announcement', // Or a new type like 'role_changed'
      `Your role has been successfully updated to ${newRole}.`,
      '/profile'
    );

    // Send back the updated user fields related to role request
    const responseUser = createFrontendUserObject(user);

    res.status(200).json({
      message: `Your role has been successfully updated to '${newRole}'.`,
      user: responseUser // Send back updated user subset
    });
  } catch (error: any) {
    console.error('Error requesting role change:', error.message, error.stack);
    res.status(500).json({ message: 'Server error while processing your request.' });
  }
};

// @route   POST /api/users/me/saved/:listingId
export const addSavedListing = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const userId = req.user?._id;

    await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listingId } });
    res.status(200).json({ message: 'Listing saved successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while saving listing.' });
  }
};

// @route   DELETE /api/users/me/saved/:listingId
export const removeSavedListing = async (req: Request, res: Response) => {
  try {
    const { listingId } = req.params;
    const userId = req.user?._id;

    await User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } });
    res.status(200).json({ message: 'Listing unsaved successfully.' });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error while unsaving listing.' });
  }
};