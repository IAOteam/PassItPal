import Listing, { IListing } from '../models/Listing';
import Order from '../models/Order';
import { IUser } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import { geocodeAddress, reverseGeocode } from '../utils/geocodingService';
import { NotificationService } from './notification.service';
import { toPlainObject } from '@/utils/mongooseUtils';

const redis = new IORedis(process.env.REDIS_URL!);

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class ListingService {
    /**
     * Creates a new listing.
     */
    public static async createNewListing(listingData: any, seller: IUser): Promise<Partial<IListing>> {
        if (!listingData.adImageBase64) {
            throw new HttpError('Listing image is required.', 400);
        }

        const uploadResponse = await cloudinary.uploader.upload(listingData.adImageBase64, {
            upload_preset: 'passitpal_listings', folder: 'listings'
        }).catch(() => { throw new HttpError('Image upload failed.', 500); });

        const geocodeResult = await geocodeAddress(listingData.locationName);
        if (!geocodeResult) {
            throw new HttpError('Could not determine coordinates for the provided location.', 400);
        }

        const newListing = new Listing({
            ...listingData,
            seller: seller._id,
            adImageUrl: uploadResponse.secure_url,
            city: geocodeResult.city,
            location: { type: 'Point', coordinates: [geocodeResult.longitude, geocodeResult.latitude] }
        });
        await newListing.save();
        return toPlainObject<IListing>(newListing);
    }

    /**
     * Fetches listings with advanced filtering, sorting, and pagination.
     */
    public static async getListings(queryParams: any) {
        const { locationName, cultPassType, minPrice, maxPrice, page = '1', limit = '12', sortBy = 'createdAt_desc' } = queryParams;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        const promotedListingDocs = await Listing.find({ isPromoted: true, isAvailable: true })
            .populate('seller', 'username profilePictureUrl')
            .limit(4);
        
        // Transform promoted listings to plain objects
        const promotedListings = promotedListingDocs.map(listing => toPlainObject<IListing>(listing));

        const pipeline: mongoose.PipelineStage[] = [];
        if (locationName) {
            const geocodeResult = await geocodeAddress(locationName);
            if (geocodeResult) {
                pipeline.push({
                    $geoNear: {
                        near: { type: 'Point', coordinates: [geocodeResult.longitude, geocodeResult.latitude] },
                        distanceField: 'distance', maxDistance: 50 * 1000, spherical: true,
                    },
                });
            }
        }

        const matchStage: any = { isAvailable: true, isPromoted: false };
        if (cultPassType) {
            matchStage.$or = [
                { cultPassType: { $regex: cultPassType, $options: 'i' } },
                { description: { $regex: cultPassType, $options: 'i' } }
            ];
        }
        if (minPrice || maxPrice) {
            matchStage.askingPrice = {};
            if (minPrice) matchStage.askingPrice.$gte = parseFloat(minPrice);
            if (maxPrice) matchStage.askingPrice.$lte = parseFloat(maxPrice);
        }
        pipeline.push({ $match: matchStage });

        const sortStage: any = {};
        if (sortBy === 'distance' && locationName) sortStage.distance = 1;
        else if (sortBy === 'price_asc') sortStage.askingPrice = 1;
        else if (sortBy === 'price_desc') sortStage.askingPrice = -1;
        else sortStage.createdAt = -1;
        pipeline.push({ $sort: sortStage });

        pipeline.push({
            $facet: {
                listings: [
                    { $skip: skip }, { $limit: limitNum },
                    { $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'seller' } },
                    { $unwind: '$seller' },
                    { $project: { 'seller.password': 0, 'seller.email': 0, 'seller.refreshToken': 0 } }
                ],
                totalCount: [{ $count: 'count' }]
            }
        });

        const results = await Listing.aggregate(pipeline);
        // Aggregation results are already plain objects, so no transformation needed here.
        const regularListings = results[0].listings;
        const totalCount = results[0].totalCount[0]?.count || 0;

        return {
            promotedListings,
            regularListings,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            totalCount: totalCount + promotedListings.length
        };
    }

    /**
     * Fetches a single listing by its ID, using a cache.
     */
    public static async getListingById(listingId: string): Promise<Partial<IListing>> {
        const cacheKey = `listing:${listingId}`;
        const cachedListing = await redis.get(cacheKey);

        if (cachedListing) {
            Listing.updateOne({ _id: listingId }, { $inc: { views: 1 } }).exec();
            return JSON.parse(cachedListing);
        }

        const listing = await Listing.findById(listingId).populate('seller', 'username profilePictureUrl averageRating reviewCount');
        if (!listing) {
            throw new HttpError('Listing not found.', 404);
        }

        listing.views = (listing.views || 0) + 1;
        await listing.save();
        
        const plainListing = toPlainObject<IListing>(listing);
        redis.setex(cacheKey, 3600, JSON.stringify(plainListing));

        return plainListing;
    }

    /**
     * Fetches all listings for a specific seller.
     */
    public static async getMyListings(sellerId: string): Promise<Partial<IListing>[]> {
        const listings = await Listing.find({ seller: sellerId }).sort({ createdAt: -1 });
        return listings.map(listing => toPlainObject<IListing>(listing));
    }

    /**
     * Updates a listing.
     */
    public static async updateListing(listingId: string, updateData: any, user: IUser): Promise<Partial<IListing>> {
        const listing = await Listing.findById(listingId);
        if (!listing) { throw new HttpError('Listing not found.', 404); }
        if (listing.seller.toString() !== user._id.toString() && user.role !== 'admin') {
            throw new HttpError('You are not authorized to update this listing.', 403);
        }
        
        const updatedListingDoc = await Listing.findByIdAndUpdate(listingId, { $set: updateData }, { new: true });
        if (!updatedListingDoc) { throw new HttpError('Failed to update listing.', 500); }
        
        redis.del(`listing:${listingId}`);
        return toPlainObject<IListing>(updatedListingDoc);
    }

    /**
     * Deletes a listing after checking for active orders.
     */
    public static async deleteListing(listingId: string, user: IUser): Promise<void> {
        const listing = await Listing.findById(listingId);
        if (!listing) {
            throw new HttpError('Listing not found.', 404);
        }
        if (listing.seller.toString() !== user._id.toString() && user.role !== 'admin') {
            throw new HttpError('You are not authorized to delete this listing.', 403);
        }
        if (await Order.findOne({ listing: listingId, status: { $in: ['pending', 'accepted'] } })) {
            throw new HttpError('Cannot delete listing with active orders.', 409);
        }
        await Listing.deleteOne({ _id: listingId });
        redis.del(`listing:${listingId}`);
    }
    
    /**
     * Promotes a listing, simulating a successful payment.
     */
    public static async promoteListing(listingId: string, userId: string): Promise<Partial<IListing>> {
        const listing = await Listing.findById(listingId);
        if (!listing) { throw new HttpError('Listing not found.', 404); }
        if (listing.seller.toString() !== userId) { throw new HttpError('You are not authorized to promote this listing.', 403); }
        if (listing.isPromoted) { throw new HttpError('This listing is already promoted.', 400); }

        const promotionDurationInDays = 7;
        listing.isPromoted = true;
        const now = new Date();
        listing.promotionExpiresAt = new Date(now.setDate(now.getDate() + promotionDurationInDays));
        
        await listing.save();
        redis.del(`listing:${listingId}`);

        await NotificationService.createAndEmitNotification(
            listing.seller.toString(), 'promoted_listing',
            `Your listing "${listing.cultPassType}" has been successfully promoted for ${promotionDurationInDays} days!`,
            { type: 'listing', id: listing._id.toString() }
        );

        return toPlainObject<IListing>(listing);
    }

    /**
     * Gets public-facing platform statistics.
     */
    public static async getPublicStats() {
        const activeListings = await Listing.countDocuments({ isAvailable: true });
        const successfulDeals = await Order.countDocuments({ status: 'completed' });
        const moneySavedAggregate = await Order.aggregate([
            { $match: { status: 'completed' } },
            { $lookup: { from: 'listings', localField: 'listing', foreignField: '_id', as: 'listingDetails' } },
            { $unwind: '$listingDetails' },
            { $group: {
                _id: null,
                totalSaved: { $sum: { $subtract: ['$listingDetails.originalPrice', '$listingDetails.askingPrice'] } }
            }}
        ]);
        const moneySaved = moneySavedAggregate[0]?.totalSaved || 0;
        return { activeListings, successfulDeals, moneySaved };
    }

    /**
     * Gets a city name from coordinates.
     */
    public static async getCityFromCoords(latitude: number, longitude: number): Promise<string> {
        const cityName = await reverseGeocode(latitude, longitude);
        if (!cityName) {
            throw new HttpError('Could not determine location from coordinates.', 404);
        }
        return cityName;
    }
}
