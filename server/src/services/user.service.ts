import User, { IUser as IMongooseUser } from '../models/User';
import Order from '../models/Order';
import { v2 as cloudinary } from 'cloudinary';
import { normalizeIndianMobileNumber } from '../utils/stringUtils';
import { toPlainObject } from '../utils/mongooseUtils';
import { NotificationService } from './notification.service';
import { IListing } from '@passitpal/types';

// --- Type Definitions ---
export interface IFrontendUser {
    _id: string;
    googleId?: string;
    email: string;
    username: string;
    role: 'buyer' | 'seller' | 'admin';
    isEmailVerified: boolean;
    isMobileVerified: boolean;
    city?: string;
    mobileNumber?: string;
    profilePictureUrl?: string;
    requestedRole?: 'buyer' | 'seller';
    roleRequestStatus?: 'pending' | 'approved' | 'rejected';
    savedListings?: string[]| Partial<IListing>[];
}

export interface IProfileUpdateData {
    username?: string;
    email?: string;
    mobileNumber?: string;
    city?: string;
    profilePictureBase64?: string;
}

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class UserService {
    /**
     * Creates a clean, frontend-safe user object from a Mongoose document.
     */
    public static createFrontendUserObject(user: IMongooseUser): IFrontendUser {
        const plainUser = toPlainObject<IMongooseUser>(user);
        return {
            _id: plainUser._id.toString(),
            googleId: plainUser.googleId,
            email: plainUser.email,
            username: plainUser.username,
            role: plainUser.role,
            isEmailVerified: plainUser.isEmailVerified,
            isMobileVerified: plainUser.isMobileVerified,
            city: plainUser.location?.city,
            mobileNumber: plainUser.mobileNumber,
            profilePictureUrl: plainUser.profilePictureUrl,
            requestedRole: plainUser.requestedRole,
            roleRequestStatus: plainUser.roleRequestStatus,
            savedListings: plainUser.savedListings?.map(id => id.toString()),
        };
    }

    public static async getProfileById(userId: string): Promise<IFrontendUser> {
        const user = await User.findById(userId);
        if (!user) { throw new HttpError('User not found.', 404); }
        return this.createFrontendUserObject(user);
    }

   public static async getMyPopulatedProfile(userId: string): Promise<Partial<IFrontendUser>> {
        const user = await User.findById(userId)
            .select('-password -otp -refreshToken')
            .populate({
                path: 'savedListings',
                model: 'Listing',
                populate: { path: 'seller', select: 'username profilePictureUrl' }
            });
        if (!user) { throw new HttpError('User not found.', 404); }
        
        // Transform the entire populated document into a plain object before returning.
        return toPlainObject<IFrontendUser>(user);
    }

    public static async updateMyProfile(userId: string, updateData: IProfileUpdateData): Promise<IFrontendUser> {
        const user = await User.findById(userId);
        if (!user) { throw new HttpError('User not found.', 404); }

        if (updateData.username && updateData.username !== user.username) {
            if (await User.findOne({ username: updateData.username, _id: { $ne: userId } })) {
                throw new HttpError('Username already taken.', 400);
            }
            user.username = updateData.username;
        }

        if (updateData.email && updateData.email !== user.email) {
            if (await User.findOne({ email: updateData.email, _id: { $ne: userId } })) {
                throw new HttpError('Email already in use.', 400);
            }
            user.email = updateData.email;
            user.isEmailVerified = false;
        }

        if (updateData.mobileNumber !== undefined) {
             const normalized = normalizeIndianMobileNumber(updateData.mobileNumber);
             if (updateData.mobileNumber && !normalized) { throw new HttpError('Invalid mobile number format.', 400); }
             if (normalized && await User.findOne({ mobileNumber: normalized, _id: { $ne: userId } })) {
                 throw new HttpError('This mobile number is already registered.', 400);
             }
             user.mobileNumber = normalized || undefined;
             user.isMobileVerified = false;
        }
        
        if (updateData.city && updateData.city !== user.location?.city) {
            if (!user.location) { user.location = { type: 'Point', coordinates: [0, 0], city: '' }; }
            user.location.city = updateData.city;
        }

        if (updateData.profilePictureBase64) {
            const uploadResponse = await cloudinary.uploader.upload(updateData.profilePictureBase64, {
                upload_preset: 'passitpal_profiles', folder: 'profile_pictures'
            }).catch(e => { throw new HttpError('Failed to upload profile picture.', 500); });
            user.profilePictureUrl = uploadResponse.secure_url;
        }

        await user.save();
        return this.createFrontendUserObject(user);
    }

    public static async switchUserRole(userId: string, newRole: 'buyer' | 'seller'): Promise<IFrontendUser> {
        const user = await User.findById(userId);
        if (!user) { throw new HttpError('User not found.', 404); }
        if (user.role === newRole) { throw new HttpError(`You are already a ${newRole}.`, 400); }

        if (!user.isEmailVerified) { throw new HttpError('Your email must be verified to switch roles.', 403); }
        if (newRole === 'seller' && !user.isMobileVerified) { throw new HttpError('To become a seller, your mobile number must be verified.', 403); }
        
        if (user.role === 'seller' && newRole === 'buyer') {
            if (await Order.findOne({ seller: userId, status: { $in: ['pending', 'accepted'] } })) {
                throw new HttpError('You cannot switch to a buyer role while you have active orders. Please resolve them first.', 400);
            }
        }

        user.role = newRole;
        await user.save();

        await NotificationService.createAndEmitNotification(userId, 'admin_announcement', `Your role has been successfully updated to ${newRole}.`, { type: 'profile', id: userId });
        return this.createFrontendUserObject(user);
    }
    
    public static async addSavedListing(userId: string, listingId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { $addToSet: { savedListings: listingId } });
    }
    
    public static async removeSavedListing(userId: string, listingId: string): Promise<void> {
        await User.findByIdAndUpdate(userId, { $pull: { savedListings: listingId } });
    }
}
