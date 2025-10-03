import Listing, { IListing } from '../models/Listing';
import Order from '../models/Order';
import User, { IUser } from '../models/User';
import { v2 as cloudinary } from 'cloudinary';
import mongoose from 'mongoose';
import IORedis from 'ioredis';
import { geocodeAddress, reverseGeocode } from '../utils/geocodingService';
import { NotificationService } from './notification.service';
import { toPlainObject } from '@/utils/mongooseUtils';

const redis = new IORedis(process.env.REDIS_URL!);

const FREE_LISTING_LIMIT = 3;

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class ListingService {
    public static async createNewListing(listingData: any, seller: IUser): Promise<Partial<IListing>> {
        const { adImageBase64, locationName, categories,latitude, longitude, ...restOfListingData } = listingData;

        if (seller.role !== 'admin' && seller.monthlyListingCount >= FREE_LISTING_LIMIT) {
            throw new HttpError(`You have reached your free monthly limit of ${FREE_LISTING_LIMIT} listings. Please upgrade to post more.`, 403);
        }

        if (!adImageBase64) {
            throw new HttpError('Listing image is required.', 400);
        }
        if (!categories || !Array.isArray(categories) || categories.length === 0) {
            throw new HttpError('At least one category is required.', 400);
        }
        if (!locationName) throw new HttpError('Location name is required.', 400);

        const uploadResponse = await cloudinary.uploader.upload(adImageBase64, {
            upload_preset: 'passitpal_listings', folder: 'listings'
        }).catch(() => { throw new HttpError('Image upload failed.', 500); });

        // Geocode the location name to get structured address details.
        const geocodeResult = await geocodeAddress(locationName);

        if (!geocodeResult) {
            throw new HttpError('Could not determine coordinates for the provided location name.', 400);
        }

        // If the user provided precise coordinates (e.g. from a map), override the geocoded result.
        if (latitude && longitude) {
            geocodeResult.latitude = parseFloat(latitude);
            geocodeResult.longitude = parseFloat(longitude);
        }

        const newListing = new Listing({
            ...restOfListingData,
            categories,
            seller: seller._id,
            adImageUrl: uploadResponse.secure_url,
            city: geocodeResult.city,
            displayLocation: geocodeResult.displayLocation,
            address: geocodeResult.address,
            location: { type: 'Point', coordinates: [geocodeResult.longitude, geocodeResult.latitude] }
        });
        
        await newListing.save();
        await User.findByIdAndUpdate(seller._id, { $inc: { monthlyListingCount: 1 } });

        return toPlainObject<IListing>(newListing);
    }

    /**
     * Fetches listings using a powerful aggregation pipeline with Atlas Search.
     */
    public static async getListings(queryParams: any) {
        const { searchTerm, locationName, minPrice, maxPrice, page = '1', limit = '12', sortBy = 'relevance' } = queryParams;
        const pageNum = parseInt(page, 10);
        const limitNum = parseInt(limit, 10);
        const skip = (pageNum - 1) * limitNum;

        // Promoted listings are fetched separately as they always appear first.
        const promotedListingDocs = await Listing.find({ isPromoted: true, status: 'available' })
            .populate('seller', 'username profilePictureUrl')
            .populate('categories', 'name')
            .sort({ promotionExpiresAt: -1 })
            .limit(4);
        const promotedListings = promotedListingDocs.map(listing => toPlainObject<IListing>(listing));

        // --- Start of the Aggregation Pipeline ---
        const pipeline: mongoose.PipelineStage[] = [];

        // ATLAS SEARCH STAGE (search logic)
        if (searchTerm) {
            pipeline.push({
                $search: {
                    index: 'listings_search', // The name of the index you created in Atlas
                    compound: {
                        should: [
                            {
                                autocomplete: {
                            query: searchTerm,
                            path: 'cultPassType',
                            tokenOrder: 'any',
                            fuzzy: {
                                maxEdits: 1,
                                prefixLength: 2,
                                maxExpansions: 50
                            }
                            }
                            },
                            {
                                text: {
                                    query: searchTerm,
                                    path: ['description', 'displayLocation', 'categories', 'city'],
                                    fuzzy: {
                                        maxEdits: 1,
                                        prefixLength: 1
                                    },
                                    score: { boost: { value: 3 } }
                                }
                            }
                        ]
                    }
                }
            });
        }
        
        //GEOSPATIAL STAGE (for location-based filtering)
        if (locationName) {
            const geocodeResult = await geocodeAddress(locationName);
            if (geocodeResult) {
                pipeline.push({
                    $geoNear: {
                        near: { type: 'Point', coordinates: [geocodeResult.longitude, geocodeResult.latitude] },
                        distanceField: 'distance',
                        maxDistance: 50 * 1000, // 50km radius
                        spherical: true,
                    },
                });
            }
        }

        // MATCH STAGE (for all other filters)
        const matchStage: any = { status: 'available', isPromoted: false };
        if (minPrice || maxPrice) {
            matchStage.askingPrice = {};
            if (minPrice) matchStage.askingPrice.$gte = parseFloat(minPrice);
            if (maxPrice) matchStage.askingPrice.$lte = parseFloat(maxPrice);
        }
        const filterMatch: any = {};
            if (queryParams.city) {
                filterMatch.city = queryParams.city;
            }
            if (queryParams.category) {
                filterMatch.categories = queryParams.category;
            }
            Object.assign(matchStage, filterMatch);

        pipeline.push({ $match: matchStage });
        
        // SORTING STAGE
        const sortStage: any = {};
        if (sortBy === 'price_asc') sortStage.askingPrice = 1;
        else if (sortBy === 'price_desc') sortStage.askingPrice = -1;
        else if (sortBy === 'createdAt_desc') sortStage.createdAt = -1;
        // If a search term was used, Atlas Search automatically adds a 'score' field for relevance.
        // We default to sorting by this score if no other sort is specified.
        else if (searchTerm) sortStage.score = { $meta: "searchScore" };
        else sortStage.createdAt = -1; // Fallback for no search term and no specific sort
        pipeline.push({ $sort: sortStage });

        // FACET STAGE (for pagination and getting total count efficiently)
        pipeline.push({
            $facet: {
                listings: [
                { $skip: skip },
                { $limit: limitNum },
                {
                    $lookup: {
                    from: 'users',
                    localField: 'seller',
                    foreignField: '_id',
                    as: 'seller'
                    }
                },
                { $unwind: '$seller' },
                {
                    $lookup: {
                    from: 'categories',
                    localField: 'categories',
                    foreignField: '_id',
                    as: 'categoryObjects'
                    }
                },
                // {
                //     $addFields: {
                //     categoryName: { $arrayElemAt: ['$categoryObjects.name', 0] }
                //     }
                // },

                {
                    $project: {
                    'seller.password': 0,
                    'seller.email': 0,
                    'seller.refreshToken': 0,
                    'searchIndex': 0,
                    // 'categoryObjects': 0 // optional
                    }
                }
                ],

                totalCount: [{ $count: 'count' }]
            }
        });
        // console.log({ queryParams, matchStage, pipeline });
        // console.log('庁 Incoming Query Params:', queryParams);
        // console.log('庁 Match Stage:', matchStage);
        // console.log('庁 Aggregation Pipeline:', JSON.stringify(pipeline, null, 2));


        const results = await Listing.aggregate(pipeline);
        // console.log("剥 Aggregation Results Sample:", JSON.stringify(results[0].listings[0], null, 2));

        const regularListings = results[0].listings;
        const totalCount = results[0].totalCount[0]?.count || 0;

        return {
            promotedListings,
            regularListings,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
        };
    }

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

    public static async getMyListings(sellerId: string): Promise<Partial<IListing>[]> {
        const listings = await Listing.find({ seller: sellerId }).sort({ createdAt: -1 });
        return listings.map(listing => toPlainObject<IListing>(listing));
    }

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

    public static async getPublicStats() {
        const activeListings = await Listing.countDocuments({ status: 'available' });
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

    public static async getAddressFromCoords(latitude: number, longitude: number): Promise<{ locationName: string; address: string }> {
        const result = await reverseGeocode(latitude, longitude);
        if (!result) {
            throw new HttpError('Could not determine location from coordinates. Please check if the Google Maps API key is configured and has Geocoding API enabled.', 404);
        }
        return { 
            locationName: result.locationName, 
            address: result.locationName // For backward compatibility with frontend
        };
    }
}
