import { Request, Response } from 'express';
import { UserService } from '../services/user.service';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in UserController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

export const getMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        const user = await UserService.getProfileById(userId);
        sendSuccess(res, 'Profile fetched successfully.', { user });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch profile.');
    }
};

export const getMyPopulatedProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        const user = await UserService.getMyPopulatedProfile(userId);
        res.status(200).json({ user });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch profile.');
    }
};

export const getUserProfileById = async (req: Request, res: Response) => {
    try {
        const user = await UserService.getProfileById(req.params.id);
        sendSuccess(res, 'User profile fetched successfully.', { user });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch user profile.');
    }
};

export const updateMyProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        const updatedUser = await UserService.updateMyProfile(userId, req.body);
        sendSuccess(res, 'Profile updated successfully!', { user: updatedUser });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update profile.');
    }
};

export const switchUserRole = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        const { newRole } = req.body;
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        if (newRole !== 'buyer' && newRole !== 'seller') { return res.status(400).json({ message: 'Invalid new role specified.' }); }
        const updatedUser = await UserService.switchUserRole(userId, newRole);
        sendSuccess(res, `Your role has been successfully updated to '${newRole}'.`, { user: updatedUser });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not switch role.');
    }
};

export const addSavedListing = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        const { listingId } = req.params;
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        await UserService.addSavedListing(userId, listingId);
        sendSuccess(res, 'Listing saved successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not save listing.');
    }
};

export const removeSavedListing = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        const { listingId } = req.params;
        if (!userId) { return res.status(401).json({ message: 'Not authorized' }); }
        await UserService.removeSavedListing(userId, listingId);
        sendSuccess(res, 'Listing unsaved successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not unsave listing.');
    }
};
