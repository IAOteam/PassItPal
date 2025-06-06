import { Request, Response } from 'express';
import User from '../models/User';
import Listing from '../models/Listing';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Notification from '../models/Notification'; // This import is used by createAndEmitNotification
import { createAndEmitNotification } from './notificationController';

// @route   GET /api/admin/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await User.find({}).select('-password -refreshToken -otp -otpExpiry -otpPurpose -passwordResetToken -passwordResetExpires');
    res.json(users);
  } catch (error: any) {
    console.error('Error fetching all users:', error.message);
    res.status(500).send('Server error: Could not fetch users.');
  }
};

// @route   PUT /api/admin/users/:id/role
// @desc    Update a user's role (admin only)
// @access  Private (Admin)
export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body;

  try {
    if (!['buyer', 'seller', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role provided.' });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.role === role) return res.status(400).json({ message: `User is already a ${role}.`});


    user.role = role as 'buyer' | 'seller' | 'admin';
    user.requestedRole = undefined;
    user.roleRequestStatus = undefined;
    user.roleRequestTimestamp = undefined;
    user.roleReviewNotes = undefined;
    await user.save();

    await createAndEmitNotification(
      user._id.toString(),
      'admin_announcement',
      `Your role has been updated to "${role}".`,
      `/profile`
    );

    res.json({ message: `User role updated to ${role}.`, user });
  } catch (error: any) {
    console.error('Error updating user role:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).send('Server error: Could not update user role.');
  }
};

// @route   PUT /api/admin/users/:id/block
// @desc    Block/unblock a user (admin only)
// @access  Private (Admin)
export const toggleUserBlock = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (!req.user) { // Ensure admin is logged in
      return res.status(401).json({ message: 'Not authorized.' });
    }

    // Admins cannot block other admins or themselves
    if (user.role === 'admin' && user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot block another admin.' });
    }
    if (user._id.toString() === req.user._id.toString()&& user.role === 'admin') {
        return res.status(403).json({ message: 'Cannot block your own account.' });
    }

    user.isBlocked = !user.isBlocked; // Toggle the isBlocked field
    await user.save();

    const blockStatus = user.isBlocked ? 'blocked' : 'unblocked';
    // res.json({ message: `User ${user.email} ${blockStatus}.`, user });

    await createAndEmitNotification(
      user._id.toString(),
      'admin_announcement',
      `Your account has been ${blockStatus} by an administrator.`,
      `/`
    );
    res.json({ message: `User ${user.email} ${blockStatus}.`, user: user.toObject({ transform: (doc, ret) => { delete ret.password; delete ret.refreshToken; return ret; }}) });
 

  } catch (error: any) {
    console.error('Error toggling user block status:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).send('Server error: Could not toggle user block status.');
  }
};


// @route   GET /api/admin/listings
// @desc    Get all listings (admin only)
// @access  Private (Admin)
export const getAllListingsAdmin = async (req: Request, res: Response) => {
  try {
    const listings = await Listing.find({}).populate('seller', 'username email mobileNumber');
    res.json(listings);
  } catch (error: any) {
    console.error('Error fetching all listings for admin:', error.message);
    res.status(500).send('Server error: Could not fetch listings.');
  }
};

// @route   PUT /api/admin/listings/:id/promote
// @desc    Promote/unpromote a listing (admin only)
// @access  Private (Admin)
export const toggleListingPromotion = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    listing.isPromoted = !listing.isPromoted;
    await listing.save();

    const promotionStatus = listing.isPromoted ? 'promoted' : 'unpromoted';
    res.json({ message: `Listing ${listing.cultPassType} ${promotionStatus}.`, listing });

    await createAndEmitNotification(
      listing.seller.toString(),
      'promoted_listing',
      `Your listing "${listing.cultPassType}" has been ${promotionStatus} by an administrator.`,
      `/listing/${listing._id.toString()}`
    );

  } catch (error: any) {
    console.error('Error toggling listing promotion:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).send('Server error: Could not toggle listing promotion.');
  }
};

// @route   DELETE /api/admin/listings/:id
// @desc    Delete a listing (admin only)
// @access  Private (Admin)
export const deleteListingAdmin = async (req: Request, res: Response) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    await Listing.deleteOne({ _id: req.params.id });

    res.json({ message: 'Listing removed by admin successfully.' });

    await createAndEmitNotification(
      listing.seller.toString(),
      'listing_update',
      `Your listing "${listing.cultPassType}" was deleted by an administrator.`,
      `/my-listings`
    );

  } catch (error: any) {
    console.error('Error deleting listing by admin:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).send('Server error: Could not delete listing.');
  }
};


// @route   GET /api/admin/stats
// @desc    Get overall platform statistics (admin only)
// @access  Private (Admin)
export const getPlatformStats = async (req: Request, res: Response) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBuyers = await User.countDocuments({ role: 'buyer' });
    const totalSellers = await User.countDocuments({ role: 'seller' });
    const totalListings = await Listing.countDocuments();
    const activeListings = await Listing.countDocuments({ isAvailable: true });
    const totalConversations = await Conversation.countDocuments();
    const totalMessages = await Message.countDocuments();

    res.json({
      totalUsers,
      totalBuyers,
      totalSellers,
      totalListings,
      activeListings,
      totalConversations,
      totalMessages,
    });
  } catch (error: any) {
    console.error('Error fetching platform statistics:', error.message);
    res.status(500).send('Server error: Could not fetch statistics.');
  }
};
// @route   GET /api/admin/role-requests
// @desc    List all pending role change requests
// @access  Private (Admin)
export const listRoleChangeRequests = async (req: Request, res: Response) => {
  try {
    // Find users who have a pending role change request
    const pendingRequests = await User.find({ roleRequestStatus: 'pending' })
      .select('username email role requestedRole roleRequestTimestamp isMobileVerified isEmailVerified') // Select relevant fields
      .sort({ roleRequestTimestamp: 1 }); // Oldest requests first

    res.status(200).json(pendingRequests);
  } catch (error: any) {
    console.error('Error fetching pending role change requests:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch role change requests.' });
  }
};

// @route   PUT /api/admin/role-requests/:userId/approve
// @desc    Approve a user's role change request
// @access  Private (Admin)
export const approveRoleChangeRequest = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const adminNotes = req.body.notes || `Approved by admin ${req.user?.username || req.user?.email || 'N/A'}`; // Optional notes

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.roleRequestStatus !== 'pending' || !user.requestedRole) {
      return res.status(400).json({ message: 'No pending role change request found for this user or requested role is missing.' });
    }

    // Prerequisites for becoming a seller (double check on admin side)
    if (user.requestedRole === 'seller') {
        if (!user.isMobileVerified) {
            return res.status(400).json({ message: 'Cannot approve seller role: User mobile number is not verified.' });
        }
        // Add any other critical server-side checks here
    }

    const oldRole = user.role;
    user.role = user.requestedRole; // Update the role
    user.requestedRole = undefined;
    user.roleRequestStatus = 'approved';
    user.roleReviewNotes = adminNotes;
    // user.roleRequestTimestamp = new Date(); // Optionally update timestamp to approval time

    await user.save();

    // Notify the user
    await createAndEmitNotification(
      userId,
      'admin_announcement', // Or a more specific 'role_change_approved'
      `Your request to change your role from ${oldRole} to ${user.role} has been approved.`,
      '/profile'
    );

    res.status(200).json({ message: `User ${user.username}'s role change to ${user.role} approved.`, user });
  } catch (error: any) {
    console.error('Error approving role change request:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not approve role change request.' });
  }
};

// @route   PUT /api/admin/role-requests/:userId/reject
// @desc    Reject a user's role change request
// @access  Private (Admin)
export const rejectRoleChangeRequest = async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { notes } = req.body; // Admin's reason for rejection

  if (!notes) {
    return res.status(400).json({ message: 'Rejection notes are required.' });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (user.roleRequestStatus !== 'pending' || !user.requestedRole) {
      return res.status(400).json({ message: 'No pending role change request found for this user.' });
    }

    const rejectedRole = user.requestedRole; // Store it before clearing
    user.requestedRole = undefined;
    user.roleRequestStatus = 'rejected';
    user.roleReviewNotes = notes;
    // user.roleRequestTimestamp = new Date(); // Optionally update timestamp to rejection time

    await user.save();

    // Notify the user
    await createAndEmitNotification(
      userId,
      'admin_announcement', // Or 'role_change_rejected'
      `Your request to change your role to ${rejectedRole} has been rejected. Reason: ${notes}`,
      '/profile'
    );

    res.status(200).json({ message: `User ${user.username}'s role change request to ${rejectedRole} rejected.`, user });
  } catch (error: any) {
    console.error('Error rejecting role change request:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid user ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not reject role change request.' });
  }
};