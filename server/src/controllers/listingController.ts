import { Request, Response } from 'express';
import Listing, { IListing } from '../models/Listing';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createAndEmitNotification } from './notificationController';
import mongoose, { Types } from 'mongoose';
import Order from '../models/Order';
import { geocodeAddress, reverseGeocode } from '../utils/geocodingService'; 
import Ad from '../models/Ad';
import IORedis from 'ioredis';
const redis = new IORedis(process.env.REDIS_URL!);

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// @route   POST /api/listings
// @desc    Create a new Cult Fit pass listing
// @access  Private (Seller only)
export const createListing = async (req: Request, res: Response) => {
  const {
    cultPassType,
    expiryDate,
    askingPrice,
    originalPrice,
    availableCredits,
    locationName, //  Taking locationName instead of city, latitude, longitude directly
    category,
    description,
    adImageBase64
  } = req.body;

  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create listings.' });
    }
    if (!req.user.isEmailVerified) {
        return res.status(403).json({ message: 'Seller email must be verified to create listings.' });
    }
    /*if (!req.user.isMobileVerified) {
      return res.status(403).json({ message: 'Seller mobile number must be verified to create listings.' });
    }*/ 
   // TODO: Re-enable mobile verification once Twilio subscription is active.

    // Geocode locationName
    const geocodeResult = await geocodeAddress(locationName);
    if (!geocodeResult) {
      return res.status(400).json({ message: 'Could not determine coordinates for the provided location name.' });
    }
    const { latitude, longitude, formattedAddress, city } = geocodeResult;

    let adImageUrl: string | undefined;

    if (adImageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(adImageBase64, {
        upload_preset: 'passitpal_listings',
        folder: 'listings'
      });
      adImageUrl = uploadResponse.secure_url;
    }

    const newListing = new Listing({
      seller: req.user._id,
      category,
      description,
      cultPassType,
      expiryDate: new Date(expiryDate),
      askingPrice,
      originalPrice,
      availableCredits:availableCredits ? parseFloat(availableCredits) : undefined, // Assuming it should be a number
      city: formattedAddress, // Use the formatted address from geocoding
      latitude,
      longitude,
      location: { // to Populate the GeoJSON 'location' field
        type: 'Point',
        coordinates: [longitude, latitude] // GeoJSON is [longitude, latitude]
      },
      adImageUrl
    });

    const listing = await newListing.save() as IListing;

    if (req.user) {
      await createAndEmitNotification(
        req.user._id.toString(),
        'listing_update',
        `Your listing "${listing.cultPassType}" was created successfully.`,
        { type: 'listing', id: listing._id.toString() }
      );
    }

    res.status(201).json({ message: 'Listing created successfully', listing });
  } catch (error: any) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Could not create listing.' });
  }
};

// @route   GET /api/listings
// @desc    Get all active Cult Fit pass listings (optionally by location or name)
// @access  Public
export const getListings = async (req: Request, res: Response) => {
  try {
    const { 
      locationName, cultPassType,
      minPrice, maxPrice,
      minCredits, maxCredits, // Added credits filter
      page = '1', limit = '12', sortBy = 'createdAt_desc'
    } = req.query;

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    // --- AGGREGATION PIPELINE FOR ADVANCED SEARCH ---
    const pipeline: mongoose.PipelineStage[] = [];

    // **  $search (Fuzzy Search for Location and Pass Type) **
    if (locationName || cultPassType) {
      const searchStage: any = {
        $search: {
          compound: {
            must: []
          }
        }
      };

      if (locationName && typeof locationName === 'string') {
    const geocodeResult = await geocodeAddress(locationName);
    if (geocodeResult) {
        pipeline.push({
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [geocodeResult.longitude, geocodeResult.latitude]
                },
                distanceField: 'distance', 
                maxDistance: 50000, // 50km radius, to do : dinamically can adjust this
                spherical: true
            }
        });
    }
}
      if (cultPassType && typeof cultPassType === 'string') {
        searchStage.$search.compound.must.push({
          text: {
            query: cultPassType,
            path: 'cultPassType',
            fuzzy: { maxEdits: 1 }
          }
        });
      }
      pipeline.push(searchStage);
    }

    // ** $match (Standard Filtering after search) **
    const matchStage: any = { isAvailable: true };
    if (minPrice || maxPrice) {
      matchStage.askingPrice = {};
      if (minPrice) matchStage.askingPrice.$gte = parseFloat(minPrice as string);
      if (maxPrice) matchStage.askingPrice.$lte = parseFloat(maxPrice as string);
    }
    if (minCredits || maxCredits) {
      matchStage.availableCredits = {};
      if (minCredits) matchStage.availableCredits.$gte = parseFloat(minCredits as string);
      if (maxCredits) matchStage.availableCredits.$lte = parseFloat(maxCredits as string);
    }
    pipeline.push({ $match: matchStage });

    // **  $sort (Sorting Logic) **
    const sortStage: any = {};
    switch (sortBy) {
        case 'price_asc': sortStage.askingPrice = 1; break;
        case 'price_desc': sortStage.askingPrice = -1; break;
        default: sortStage.createdAt = -1; break;
    }
    pipeline.push({ $sort: sortStage });

    // **  Pagination and Data Fetching **
    const countPipeline = [...pipeline, { $count: 'total' }];
    const dataPipeline = [
        ...pipeline,
        { $skip: skip },
        { $limit: limitNum },
        { $lookup: { from: 'users', localField: 'seller', foreignField: '_id', as: 'sellerInfo' } },
        { $unwind: '$sellerInfo' },
        { $project: {
            seller: { _id: '$sellerInfo._id', username: '$sellerInfo.username', profilePictureUrl: '$sellerInfo.profilePictureUrl' },
            cultPassType: 1, askingPrice: 1, originalPrice: 1, city: 1, isPromoted: 1,
            adImageUrl: 1, expiryDate: 1, availableCredits: 1, isAvailable: 1, createdAt: 1
          }
        }
    ];

    const countResult = await Listing.aggregate(countPipeline);
    const totalCount = countResult.length > 0 ? countResult[0].total : 0;
    
    const allListings = await Listing.aggregate(dataPipeline);
    const promotedListings = allListings.filter(l => l.isPromoted);
    const regularListings = allListings.filter(l => !l.isPromoted);

    const totalPages = Math.ceil(totalCount / limitNum);

    // --- Ad Fetching ---
    const adQuery: any = { isActive: true };
    if (locationName) {
      adQuery.$or = [{ locations: { $in: [new RegExp(locationName as string, 'i')] } }, { locations: { $size: 0 } }];
    } else {
      adQuery.locations = { $size: 0 };
    }
    const ads = await Ad.find(adQuery).sort({ priority: -1 }).limit(2);

    res.status(200).json({
      message: 'Listings fetched successfully',
      totalCount: totalCount,
      promotedListings,
      regularListings,
      ads,
      totalPages,
      currentPage: pageNum,
    });

  } catch (error: any) {
    console.error('Error fetching listings with aggregation:', error);
    res.status(500).json({ message: 'Server error: Could not fetch listings.' });
  }
};

// @route   GET /api/listings/:id
// @desc    Get a single Cult Fit pass listing by ID
// @access  Public
export const getListingById = async (req: Request, res: Response) => {
 /* try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username email mobileNumber role city profilePictureUrl') as IListing;

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }
    // ---  Increment View Count Logic ---
    // Increment views only if the person viewing is NOT the seller of the listing.
    // This prevents sellers from inflating their own view counts.
    // req.user is available if the viewer is logged in.
    if (listing.seller._id.toString() !== req.user?._id.toString()) {
      listing.views = (listing.views || 0) + 1;
      // We save this in the background and don't need to wait for it to complete
      // to send the response. This is a fire-and-forget update for performance.
      listing.save().catch(err => console.error(`Failed to save view count for listing ${listing._id}:`, err));
    }*/

    try {
    const listingId = req.params.id;
    const cacheKey = `listing:${listingId}`;

    // 1. Check cache first
    const cachedListing = await redis.get(cacheKey);
    if (cachedListing) {
      // console.log(`[Cache HIT] for ${cacheKey}`);
      const listing = JSON.parse(cachedListing);
      // We still increment views, but don't wait for it
      Listing.updateOne({ _id: listingId }, { $inc: { views: 1 } }).exec();
      return res.json(listing);
    }

    // console.log(`[Cache MISS] for ${cacheKey}`);
    // 2. If not in cache, get from DB
    const listing = await Listing.findById(listingId).populate('seller', 'username profilePictureUrl averageRating reviewCount');
    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // 3. Save to cache with an expiry (e.g., 1 hour) and return
    redis.setex(cacheKey, 3600, JSON.stringify(listing));
    listing.views = (listing.views || 0) + 1;
    await listing.save(); // Save the view count update


    res.json(listing); // Send the response immediately
  } catch (error: any) {
    console.error('Error fetching listing by ID:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not fetch listing.' });
  }
};
// @route   GET /api/listings/my-listings
// @desc    Get all listings created by the logged-in user
// @access  Private (Seller only)
export const getMyListings = async (req: Request, res: Response) => {
  try {
    // Ensure a user is logged in and their ID is available from the protect middleware
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Not authorized, user not logged in.' });
    }

    // Find listings where the seller field matches the logged-in user's ID
    const listings = await Listing.find({ seller: req.user._id })
      .populate('seller', 'username email mobileNumber role profilePictureUrl city') // Populate seller details
      .sort({ createdAt: -1 }); // Sort by newest first

    res.json(listings);
  } catch (error: any) {
    console.error('Error fetching my listings:', error.message);
    res.status(500).send('Server error: Could not fetch your listings.');
  }
};


// @route   PUT /api/listings/:id
// @desc    Update a Cult Fit pass listing (only by seller)
// @access  Private (Seller only)
export const updateListing = async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    cultPassType,
    expiryDate,
    askingPrice,
    originalPrice,
    availableCredits,// Note: Consider making this a Number type in schema and here
    locationName, //  Allow updating via locationName
    adImageBase64,
    isAvailable, // Allow seller to mark as sold/available
    isPromoted // Admin-only, but useful to keep in sync for clarity (controller logic will restrict)
  } = req.body;

  try {
    let listing = await Listing.findById(id) as IListing;

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized: User not logged in.' });
    }

    // Allow seller to update their own listing, OR allow admin to update any listing
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this listing.' });
    }

    let newAdImageUrl: string | undefined = listing.adImageUrl;
    if (adImageBase64) {
      const uploadResponse = await cloudinary.uploader.upload(adImageBase64, {
        upload_preset: 'passitpal_listings',
        folder: 'listings'
      });
      newAdImageUrl = uploadResponse.secure_url;
    }

    const updatedFields: Partial<IListing> = {
      cultPassType,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      askingPrice,
      originalPrice,
      // Parse availableCredits to a Number if it's stored as such in the schema
      availableCredits: availableCredits ? parseFloat(availableCredits) : undefined, // Assuming it should be a number
      
      adImageUrl: newAdImageUrl,
      isAvailable, // Allow seller to update availability
      updatedAt: new Date()
    };

    // Handle locationName update
    if (locationName) {
      const geocodeResult = await geocodeAddress(locationName);
      if (geocodeResult) {
        updatedFields.latitude = geocodeResult.latitude;
        updatedFields.longitude = geocodeResult.longitude;
        updatedFields.city = geocodeResult.formattedAddress;
         updatedFields.location = { //  Update the GeoJSON 'location' field
          type: 'Point',
          coordinates: [geocodeResult.longitude, geocodeResult.latitude] // GeoJSON is [longitude, latitude]
        };
      } else {
        return res.status(400).json({ message: 'Could not determine coordinates for the provided location name.' });
      }
    }

    // Only allow admin to update isPromoted directly
    if (req.user.role === 'admin' && typeof isPromoted === 'boolean') {
      updatedFields.isPromoted = isPromoted;
    }


    Object.keys(updatedFields).forEach(key => {
      // Ensure we don't set undefined values for fields that are not optional
      // Also, explicitly check for undefined to avoid removing valid false/0 values
      if (updatedFields[key as keyof IListing] === undefined) {
          delete updatedFields[key as keyof IListing];
      }
    });


    listing = await Listing.findByIdAndUpdate(id, { $set: updatedFields }, { new: true }) as IListing;

    if (listing && req.user) {
      await createAndEmitNotification(
        req.user._id.toString(),
        'listing_update',
        `Your listing "${listing.cultPassType}" was updated.`,
        { type: 'listing', id: listing._id.toString() }
      );
    }

    res.json({ message: 'Listing updated successfully', listing });
  } catch (error: any) {
    console.error('Error updating listing:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not update listing.' });
  }
};

// @route   DELETE /api/listings/:id
// @desc    Delete a Cult Fit pass listing (only by seller)
// @access  Private (Seller only)
export const deleteListing = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?._id;
  try {
    const listing = await Listing.findById(id) as IListing;

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized: User not logged in.' });
    }

    // Allow seller to delete their own listing, OR allow admin to delete any listing
    if (listing.seller.toString() !== req.user?._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing.' });
    }

    const activeOrders = await Order.findOne({
      listing: id,
      status: { $in: ['pending', 'accepted'] } // Check for pending or accepted orders
    });

    if (activeOrders) {
      return res.status(409).json({ // 409 Conflict status code is appropriate here
        message: 'Cannot delete listing: There are pending or accepted orders associated with this listing. Please resolve them first.'
      });
    }

    await Listing.deleteOne({ _id: id });

    if (req.user) {
      await createAndEmitNotification(
        req.user._id.toString(),
        'listing_update',
        `Your listing "${listing.cultPassType}" was deleted.`,
        { type: 'profile', id: req.user._id.toString() }
      );
    }

    res.json({ message: 'Listing removed successfully.' });
  } catch (error: any) {
    console.error('Error deleting listing:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not delete listing.' });
  }
};
// --- Promote a Listing ---
// @route   PUT /api/listings/:id/promote
// @desc    Promote a specific listing (simulates after successful payment)
// @access  Private (Seller who owns the listing)
export const promoteListing = async (req: Request, res: Response) => {
  const { id } = req.params;
  // For now, we'll assume a fixed promotion duration, e.g., 7 days.
  // In the future, this could come from the request body based on payment tier.
  const promotionDurationInDays = 7; 

  try {
    const listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    // Authorization check: Ensure the user owns this listing
    if (listing.seller.toString() !== req.user?._id.toString()) {
      return res.status(403).json({ message: 'User not authorized to promote this listing.' });
    }
    
    if (listing.isPromoted) {
      return res.status(400).json({ message: 'This listing is already promoted.' });
    }

    // --- PAYMENT SIMULATION ---
    // In a real application, you would integrate a payment gateway like Razorpay or Stripe here.
    // The logic would only proceed after confirming a successful payment.
    // For now, we'll assume payment was successful.
    // console.log(`[Promote Listing] Simulating successful payment for listing: ${id}`);

    // Update the listing's promotion status
    listing.isPromoted = true;
    const now = new Date();
    listing.promotionExpiresAt = new Date(now.setDate(now.getDate() + promotionDurationInDays));
    
    await listing.save();

    // Notify the seller
    await createAndEmitNotification(
      listing.seller.toString(),
      'promoted_listing',
      `Your listing "${listing.cultPassType}" has been successfully promoted for ${promotionDurationInDays} days!`,
      { type: 'listing', id: listing._id.toString() }
    );

    res.status(200).json({
      message: 'Listing promoted successfully.',
      listing: listing, // Send back the updated listing
    });

  } catch (error: any) {
    console.error('Error promoting listing:', error.message);
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid listing ID.' });
    }
    res.status(500).json({ message: 'Server error: Could not promote listing.' });
  }
};

// @route   POST /api/listings/reverse-geocode
// @desc    Get city name from coordinates
// @access  Public
export const getCityFromCoords = async (req: Request, res: Response) => {
  const { latitude, longitude } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ message: 'Latitude and longitude are required.' });
  }

  try {
    const cityName = await reverseGeocode(latitude, longitude);
    if (cityName) {
      res.status(200).json({ locationName: cityName });
    } else {
      res.status(404).json({ message: 'Could not determine location from coordinates.' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error during reverse geocoding.' });
  }
};


// @route   GET /api/listings/stats/public
// @desc    Get public-facing platform statistics
// @access  Public
export const getPublicStats = async (req: Request, res: Response) => {
  try {
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

    const moneySaved = moneySavedAggregate.length > 0 ? moneySavedAggregate[0].totalSaved : 0;

    res.json({ activeListings, successfulDeals, moneySaved });

  } catch (error) {
    res.status(500).json({ message: 'Server error fetching stats.' });
  }
};
