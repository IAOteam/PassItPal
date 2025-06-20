import { Request, Response } from 'express';
import Listing, { IListing } from '../models/Listing';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createAndEmitNotification } from './notificationController';
import { Types } from 'mongoose';
import Order from '../models/Order';
import { geocodeAddress, reverseGeocode } from '../utils/geocodingService'; 
import Ad from '../models/Ad';

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
    availableCredits,// Note: Consider making this a Number type in  schema and here .
    locationName, //  Taking locationName instead of city, latitude, longitude directly
    adImageBase64
  } = req.body;

  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create listings.' });
    }
    if (!req.user.isEmailVerified) {
        return res.status(403).json({ message: 'Seller email must be verified to create listings.' });
    }
    if (!req.user.isMobileVerified) {
      return res.status(403).json({ message: 'Seller mobile number must be verified to create listings.' });
    }

    // Geocode locationName
    const geocodeResult = await geocodeAddress(locationName);
    if (!geocodeResult) {
      return res.status(400).json({ message: 'Could not determine coordinates for the provided location name.' });
    }
    const { latitude, longitude, formattedAddress } = geocodeResult;

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
        `/listing/${listing._id.toString()}`
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
    locationName, 
    latitude, 
    longitude, 
    radiusKm ,
    cultPassType,
    minPrice,
    maxPrice,
    minCredits,
    maxCredits,
    page = '1', // Default to page 1
    limit = '10', // Default to 10 listings per page
    sortBy = 'createdAt_desc', // Default sort field
    // sortOrder = '-1' // Default sort order (1 for ascending, -1 for descending)
  } = req.query; 

    let baseQuery: any = { isAvailable: true };
    let searchCity: string | null = null;
    if (req.user?.role === 'admin' && req.query.includeInactive === 'true') {
        delete baseQuery.isAvailable; // Admin can override to see all
    }

    // Allow admin to view inactive listings
    let query: any = {};
    if (req.user?.role !== 'admin' || req.query.includeInactive !== 'true') {
        query.isAvailable = true;
    }
    // let searchLat: number | undefined;
    // let searchLon: number | undefined;

    // If locationName is provided, geocode it
    if (locationName && typeof locationName === 'string') {
      const geocodeResult = await geocodeAddress(locationName);
      if (geocodeResult) {
        baseQuery.location = {
                $geoWithin: {
                    // This is a simple city-based search, for radius search, see below
                    // A more precise way would be to get a bounding box for the city
                    // For now, we'll filter by city name for simplicity with location search
                    $centerSphere: [[geocodeResult.longitude, geocodeResult.latitude], 50 / 6378.1] // Example: 50km radius around city center
                }
            };
            // Extract the city name for ad targeting
        searchCity = geocodeResult.formattedAddress.split(',')[0].trim();
        // searchLat = geocodeResult.latitude;
        // searchLon = geocodeResult.longitude;
        //  to filter by city name directly,  add:
        // query.city = new RegExp(geocodeResult.formattedAddress.split(',')[0].trim(), 'i');
      } else {
        // If locationName couldn't be geocoded, we might proceed without location filter
        // or return an error depending on desired behavior. For now, just warn.
        //console.warn(`Could not geocode locationName: ${locationName}`);
        console.warn(`Could not geocode locationName: ${locationName}. Returning empty for this filter.`);
             return res.status(200).json({
                message: 'Location not found.',
                totalCount: 0,
                promotedListings: [],
                regularListings: [],
                ads: [],
                totalPages: 0,
                currentPage: 1,
             });
      }
    } else if (latitude && longitude && radiusKm) {
      // Fallback to direct lat/lon if provided ( from browser location)
      // searchLat = parseFloat(latitude as string);
      // searchLon = parseFloat(longitude as string);
      baseQuery.location = {
          $geoWithin: { $centerSphere: [[parseFloat(longitude as string), parseFloat(latitude as string)], parseFloat(radiusKm as string) / 6378.1] }
        };
    }

    // if (searchLat !== undefined && searchLon !== undefined && radiusKm) {
    //   const radius = parseFloat(radiusKm as string);

    //   if (!isNaN(searchLat) && !isNaN(searchLon) && !isNaN(radius) && radius > 0) {
    //     // Note: For a 2dsphere index, coordinates are [longitude, latitude]
    //     query.location = {
    //       $geoWithin: {
    //         $centerSphere: [[searchLon, searchLat], radius / 6378.1] // Earth's radius in km
    //       }
    //     };
    //     // If using location search, remove city filter unless specifically needed
    //     // delete query.city;
    //   }
    // }
    // if (cultPassType && typeof cultPassType === 'string') {
    //   query.cultPassType = cultPassType;
    // }
    // if (cultPassType && typeof cultPassType === 'string') baseQuery.cultPassType = new RegExp(cultPassType, 'i');
    if (cultPassType && typeof cultPassType === 'string') {
      baseQuery.$text = { $search: cultPassType };
    }
    if (minPrice || maxPrice) {
      baseQuery.askingPrice = {};
      if (minPrice) baseQuery.askingPrice.$gte = parseFloat(minPrice as string);
      if (maxPrice) baseQuery.askingPrice.$lte = parseFloat(maxPrice as string);
    }

    // if (minPrice || maxPrice) {
    //   query.askingPrice = {};
    //   if (minPrice) {
    //     query.askingPrice.$gte = parseFloat(minPrice as string);
    //   }
    //   if (maxPrice) {
    //     query.askingPrice.$lte = parseFloat(maxPrice as string);
    //   }
    // }

    if (minCredits || maxCredits) {
      query.availableCredits = {};
      if (minCredits) {
        query.availableCredits.$gte = parseFloat(minCredits as string);
      }
      if (maxCredits) {
        query.availableCredits.$lte = parseFloat(maxCredits as string);
      }
    }
    const sortOptions: { [key: string]: 1 | -1 } = {};
    switch (sortBy) {
        case 'price_asc':
            sortOptions.askingPrice = 1;
            break;
        case 'price_desc':
            sortOptions.askingPrice = -1;
            break;
        case 'expiry_desc': // Longest expiry first
            sortOptions.expiryDate = -1;
            break;
        case 'createdAt_asc': // Oldest first
            sortOptions.createdAt = 1;
            break;
        case 'createdAt_desc': // Newest first (default)
        default:
            sortOptions.createdAt = -1;
            break;
    }

    // --- PAGINATION LOGIC ---
    const pageNum = parseInt(page as string,10);
    const limitNum = parseInt(limit as string,10);
    const skip = (pageNum - 1) * limitNum;

    // Get total count of documents matching the query (before pagination)
    const totalCount = await Listing.countDocuments(query);

    // --- 5. FETCH PROMOTED & REGULAR LISTINGS SEPARATELY ---
    // This is the most reliable way to ensure promoted listings are always first.
    
    // First, fetch all promoted listings that match the base query (no pagination/limit)
    const promotedQuery = { ...baseQuery, isPromoted: true };
    const promotedListings = await Listing.find(promotedQuery)
      .populate('seller', 'username profilePictureUrl city')
      .sort(sortOptions); // Sort promoted listings among themselves

    // --- SORTING LOGIC ---
    // const sortOptions: { [key: string]: 1 | -1 } = {};
    // if (sortBy) {
    //   sortOptions[sortBy as string] = sortOrder === '1' ? 1 : -1;
    // } else {
    //   // Default sort if not specified
    //   sortOptions.createdAt = -1; // Newest first
    // }

    // Then, fetch the paginated regular listings
    const regularQuery = { ...baseQuery, isPromoted: false };
    const totalRegularCount = await Listing.countDocuments(regularQuery);
    const regularListings = await Listing.find(regularQuery)
      .populate('seller', 'username profilePictureUrl city')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

      const adQuery: any = { isActive: true };
      if (searchCity) {
        // Fetch ads that are targeted to the searched city OR are global (locations array is empty)
        adQuery.$or = [
          { locations: { $in: [new RegExp(searchCity, 'i')] } },
          { locations: { $size: 0 } }
        ];
      } else {
        // If no location is searched, only fetch global ads
        adQuery.locations = { $size: 0 };
      }
      // Fetch up to 2 active, relevant ads, sorted by priority
      const ads = await Ad.find(adQuery).sort({ priority: -1 }).limit(2);
      res.status(200).json({
      message: 'Listings fetched successfully',
      totalCount: promotedListings.length + totalRegularCount, // Combined total
      promotedListings, // Send promoted listings as a separate array
      regularListings,  // Send paginated regular listings
      ads,
      totalPages: Math.ceil(totalRegularCount / limitNum), // Pagination based on regular listings
      currentPage: pageNum,
    });
    } catch (error: any) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch listings.' });
  }
    // const listings = await Listing.find(query)
    //   .populate('seller', 'username email mobileNumber role profilePictureUrl city')
    //   .sort(sortOptions) // Apply sorting
    //   .skip(skip) // Apply pagination skip
    //   .limit(limitNum); // Apply pagination limit

    // res.status(200).json({
    //   message: 'Listings fetched successfully',
    //   totalCount,
    //   currentPage: pageNum,
    //   totalPages: Math.ceil(totalCount / limitNum),
    //   limit: limitNum,
    //   listings
    // });
  // } catch (error: any) {
  //   console.error('Error fetching listings:', error.message);
  //   res.status(500).json({ message: 'Server error: Could not fetch listings.' });
  // }
};

// @route   GET /api/listings/:id
// @desc    Get a single Cult Fit pass listing by ID
// @access  Public
export const getListingById = async (req: Request, res: Response) => {
  try {
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
    }

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
        `/listing/${listing._id.toString()}`
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
        `/my-listings`
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
// --- NEW FUNCTION: Promote a Listing ---
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
    console.log(`[Promote Listing] Simulating successful payment for listing: ${id}`);

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
      `/listing/${listing._id.toString()}`
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
