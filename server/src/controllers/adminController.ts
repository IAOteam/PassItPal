import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';
import { AdService } from '../services/ad.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in AdminController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

// --- User Management Methods  ---

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await AdminService.getAllUsers();
        res.status(200).json(users);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch users.');
    }
};

export const toggleUserBlock = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const adminId = req.user?._id.toString();
        if (!adminId) { return res.status(401).json({ message: 'Not authorized' }); }
        const user = await AdminService.toggleUserBlock(id, adminId);
        const blockStatus = user.isBlocked ? 'blocked' : 'unblocked';
        sendSuccess(res, `User ${user.email} has been ${blockStatus}.`, { user });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not toggle user block status.');
    }
};

// --- Role Management Methods ---

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const user = await AdminService.updateUserRole(id, role);
        sendSuccess(res, `User role updated to ${role}.`, { user });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update user role.');
    }
};

// --- Listing Management Methods ---

export const getAllListingsAdmin = async (req: Request, res: Response) => {
    try {
        const listings = await AdminService.getAllListings();
        res.status(200).json(listings);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch listings.');
    }
};

export const toggleListingPromotion = async (req: Request, res: Response) => {
    try {
        const listing = await AdminService.toggleListingPromotion(req.params.id);
        const promotionStatus = listing.isPromoted ? 'promoted' : 'unpromoted';
        sendSuccess(res, `Listing ${listing.cultPassType} has been ${promotionStatus}.`, { listing });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not toggle listing promotion.');
    }
};

export const deleteListingAdmin = async (req: Request, res: Response) => {
    try {
        await AdminService.deleteListing(req.params.id);
        sendSuccess(res, 'Listing removed by admin successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not delete listing.');
    }
};

// --- Platform Stats & Reports ---

export const getPlatformStats = async (req: Request, res: Response) => {
    try {
        const stats = await AdminService.getPlatformStats();
        res.status(200).json(stats);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch statistics.');
    }
};

export const getReports = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;
        const reports = await AdminService.getReports(status as string);
        res.status(200).json(reports);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch reports.');
    }
};

export const updateReport = async (req: Request, res: Response) => {
    try {
        const { reportId } = req.params;
        const { status, adminNotes } = req.body;
        const report = await AdminService.updateReport(reportId, status, adminNotes);
        res.status(200).json(report);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update report.');
    }
};

// --- Ad Management Methods ---

export const getAllAds = async (req: Request, res: Response) => {
    try {
        const ads = await AdService.getAllAds();
        res.status(200).json(ads);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch ads.');
    }
};

export const getAdById = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.getAdById(req.params.id);
        res.status(200).json(ad);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch ad.');
    }
};

export const createAd = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.createAd(req.body);
        sendSuccess(res, 'Ad created successfully.', { ad }, 201);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not create ad.');
    }
};

export const updateAd = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.updateAd(req.params.adId, req.body);
        sendSuccess(res, 'Ad updated successfully.', { ad });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update ad.');
    }
};

export const deleteAd = async (req: Request, res: Response) => {
    try {
        await AdService.deleteAd(req.params.adId);
        sendSuccess(res, 'Ad deleted successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not delete ad.');
    }
};

export const approveAd = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.approveAd(req.params.adId);
        sendSuccess(res, 'Ad approved. Advertiser needs to complete payment.', { ad });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not approve ad.');
    }
};

export const rejectAd = async (req: Request, res: Response) => {
    try {
        const ad = await AdService.rejectAd(req.params.adId);
        sendSuccess(res, 'Ad has been rejected.', { ad });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not reject ad.');
    }
};
