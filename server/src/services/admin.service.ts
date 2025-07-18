import User, { IUser } from '../models/User';
import Listing, { IListing } from '../models/Listing';
import Report, { ReportStatus } from '../models/Report';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import { NotificationService } from './notification.service';
import { toPlainObject } from '../utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

interface IPlatformStats {
    totalUsers: number;
    totalBuyers: number;
    totalSellers: number;
    totalListings: number;
    activeListings: number;
    totalConversations: number;
    totalMessages: number;
}

export class AdminService {

    // --- User Management (Moved from original userController) ---

    /**
     * Fetches all users in the system, excluding sensitive fields.
     */
    public static async getAllUsers(): Promise<Partial<IUser>[]> {
        const users = await User.find({}).select('-password -refreshToken -otp -otpExpiry');
        return users.map(user => toPlainObject<IUser>(user));
    }

    /**
     * Toggles the blocked status of a user.
     * @param targetUserId The ID of the user to block/unblock.
     * @param adminId The ID of the admin performing the action.
     */
    public static async toggleUserBlock(targetUserId: string, adminId: string): Promise<Partial<IUser>> {
        const user = await User.findById(targetUserId);
        if (!user) {
            throw new HttpError('User not found.', 404);
        }
        if (user.role === 'admin' || user.id.toString() === adminId) {
            throw new HttpError('Admins cannot be blocked or block themselves.', 403);
        }

        user.isBlocked = !user.isBlocked;
        await user.save();
        const blockStatus = user.isBlocked ? 'blocked' : 'unblocked';

        await NotificationService.createAndEmitNotification(
            user._id.toString(),
            'admin_announcement',
            `Your account has been ${blockStatus} by an administrator.`,
            { type: 'profile', id: user._id.toString() }
        );
        return toPlainObject<IUser>(user);
    }
    
    // --- Role Management ---

    public static async updateUserRole(targetUserId: string, newRole: 'buyer' | 'seller' | 'admin'): Promise<Partial<IUser>> {
        if (!['buyer', 'seller', 'admin'].includes(newRole)) {
            throw new HttpError('Invalid role provided.', 400);
        }
        const user = await User.findById(targetUserId);
        if (!user) { throw new HttpError('User not found.', 404); }
        if (user.role === newRole) { throw new HttpError(`User is already a ${newRole}.`, 400); }

        user.role = newRole;
        await user.save();
        await NotificationService.createAndEmitNotification(user._id.toString(), 'admin_announcement', `An administrator has updated your role to "${newRole}".`, { type: 'profile', id: user._id.toString() });
        return toPlainObject<IUser>(user);
    }

    // --- Listing Management ---

    public static async getAllListings() {
        return Listing.find({}).populate('seller', 'username email');
    }
    
    public static async toggleListingPromotion(listingId: string): Promise<IListing> {
        const listing = await Listing.findById(listingId);
        if (!listing) { throw new HttpError('Listing not found.', 404); }
        listing.isPromoted = !listing.isPromoted;
        await listing.save();
        const promotionStatus = listing.isPromoted ? 'promoted' : 'unpromoted';
        await NotificationService.createAndEmitNotification(listing.seller.toString(), 'promoted_listing', `Your listing "${listing.cultPassType}" has been ${promotionStatus} by an administrator.`, { type: 'listing', id: listing._id.toString() });
        return listing;
    }

    public static async deleteListing(listingId: string): Promise<void> {
        const listing = await Listing.findById(listingId);
        if (!listing) { throw new HttpError('Listing not found.', 404); }
        await Listing.deleteOne({ _id: listingId });
        await NotificationService.createAndEmitNotification(listing.seller.toString(), 'listing_update', `Your listing "${listing.cultPassType}" was removed by an administrator.`, { type: 'profile', id: listing.seller.toString() });
    }

    // --- Platform Stats ---

    public static async getPlatformStats(): Promise<IPlatformStats> {
        const [totalUsers, totalBuyers, totalSellers, totalListings, activeListings, totalConversations, totalMessages] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: 'buyer' }),
            User.countDocuments({ role: 'seller' }),
            Listing.countDocuments(),
            Listing.countDocuments({ isAvailable: true }),
            Conversation.countDocuments(),
            Message.countDocuments()
        ]);
        return { totalUsers, totalBuyers, totalSellers, totalListings, activeListings, totalConversations, totalMessages };
    }
    
    // --- Report Management ---
    
    public static async getReports(status?: string) {
         const reports = await Report.find(status ? { status } : {})
            .populate('reporter', 'username email')
            .sort({ createdAt: -1 });
        return reports.map(report => toPlainObject(report));
    }
    
    public static async updateReport(reportId: string, status: ReportStatus, adminNotes: string) {
        const report = await Report.findById(reportId);
        if (!report) { throw new HttpError('Report not found.', 404); }
        report.status = status;
        if (adminNotes) { report.adminNotes = adminNotes; }
        await report.save();
        await NotificationService.createAndEmitNotification(report.reporter.toString(), 'admin_announcement', `Your report regarding a ${report.reportedContentType} has been updated to "${status}".`, { type: 'profile', id: report.reporter.toString() });
        
        return toPlainObject(report);
    }
}
