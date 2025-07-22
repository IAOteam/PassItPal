import { Request, Response } from 'express';
import { ListingService } from '../services/listing.service';
import { IUser } from '../models/User';

const sendSuccess = (res: Response, message: string, data: object = {}, statusCode = 200) => {
    res.status(statusCode).json({ message, ...data });
};

const sendError = (res: Response, error: any, defaultMessage: string) => {
    console.error(`Error in ListingController: ${error.message}`);
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ message: error.message || defaultMessage });
};

export const createListing = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user || user.role !== 'seller') {
            return res.status(403).json({ message: 'Only sellers can create listings.' });
        }
        const listing = await ListingService.createNewListing(req.body, user);
        sendSuccess(res, 'Listing created successfully', { listing }, 201);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not create listing.');
    }
};

export const getListings = async (req: Request, res: Response) => {
    try {
        const data = await ListingService.getListings(req.query);
        sendSuccess(res, 'Listings fetched successfully', data);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch listings.');
    }
};

export const getListingById = async (req: Request, res: Response) => {
    try {
        const listing = await ListingService.getListingById(req.params.id);
        res.status(200).json(listing);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch listing.');
    }
};

export const getMyListings = async (req: Request, res: Response) => {
    try {
        const sellerId = req.user?._id.toString();
        if (!sellerId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const listings = await ListingService.getMyListings(sellerId);
        res.status(200).json(listings);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch your listings.');
    }
};

export const updateListing = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const listing = await ListingService.updateListing(req.params.id, req.body, user);
        sendSuccess(res, 'Listing updated successfully', { listing });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not update listing.');
    }
};

export const deleteListing = async (req: Request, res: Response) => {
    try {
        const user = req.user as IUser;
        if (!user) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        await ListingService.deleteListing(req.params.id, user);
        sendSuccess(res, 'Listing removed successfully.');
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not delete listing.');
    }
};

export const promoteListing = async (req: Request, res: Response) => {
    try {
        const userId = req.user?._id.toString();
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }
        const listing = await ListingService.promoteListing(req.params.id, userId);
        sendSuccess(res, 'Listing promoted successfully.', { listing });
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not promote listing.');
    }
};

export const getPublicStats = async (req: Request, res: Response) => {
    try {
        const stats = await ListingService.getPublicStats();
        res.status(200).json(stats);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not fetch public stats.');
    }
};

export const getAddressFromCoords = async (req: Request, res: Response) => {
    try {
        const { latitude, longitude } = req.body;
        const data = await ListingService.getAddressFromCoords(latitude, longitude);
        res.status(200).json(data);
    } catch (error: any) {
        sendError(res, error, 'Server error: Could not determine location.');
    }
};
