import { Request, Response } from 'express';
import Listing, { IListing } from '../models/Listing';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createAndEmitNotification } from './notificationController';
import { Types } from 'mongoose';
import { geocodeAddress } from '../utils/geocodingService'; 

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
  const { 
    locationName, 
    latitude, 
    longitude, 
    radiusKm ,
    cultPassType,
    minPrice,
    maxPrice,
    minCredits,
    maxCredits
  } = req.query; // locationName is new

  try {
    // Allow admin to view inactive listings
    let query: any = {};
    if (req.user?.role !== 'admin' || req.query.includeInactive !== 'true') {
        query.isAvailable = true;
    }
    let searchLat: number | undefined;
    let searchLon: number | undefined;

    // If locationName is provided, geocode it
    if (locationName && typeof locationName === 'string') {
      const geocodeResult = await geocodeAddress(locationName);
      if (geocodeResult) {
        searchLat = geocodeResult.latitude;
        searchLon = geocodeResult.longitude;
        //  to filter by city name directly,  add:
        // query.city = new RegExp(geocodeResult.formattedAddress.split(',')[0].trim(), 'i');
      } else {
        // If locationName couldn't be geocoded, we might proceed without location filter
        // or return an error depending on desired behavior. For now, just warn.
        console.warn(`Could not geocode locationName: ${locationName}`);
      }
    } else if (latitude && longitude) {
      // Fallback to direct lat/lon if provided ( from browser location)
      searchLat = parseFloat(latitude as string);
      searchLon = parseFloat(longitude as string);
    }

    if (searchLat !== undefined && searchLon !== undefined && radiusKm) {
      const radius = parseFloat(radiusKm as string);

      if (!isNaN(searchLat) && !isNaN(searchLon) && !isNaN(radius) && radius > 0) {
        // Note: For a 2dsphere index, coordinates are [longitude, latitude]
        query.location = {
          $geoWithin: {
            $centerSphere: [[searchLon, searchLat], radius / 6378.1] // Earth's radius in km
          }
        };
        // If using location search, remove city filter unless specifically needed
        // delete query.city;
      }
    }
    if (cultPassType && typeof cultPassType === 'string') {
      query.cultPassType = cultPassType;
    }

    if (minPrice || maxPrice) {
      query.askingPrice = {};
      if (minPrice) {
        query.askingPrice.$gte = parseFloat(minPrice as string);
      }
      if (maxPrice) {
        query.askingPrice.$lte = parseFloat(maxPrice as string);
      }
    }

    if (minCredits || maxCredits) {
      query.availableCredits = {};
      if (minCredits) {
        query.availableCredits.$gte = parseFloat(minCredits as string);
      }
      if (maxCredits) {
        query.availableCredits.$lte = parseFloat(maxCredits as string);
      }
    }

    const listings = await Listing.find(query).populate('seller', 'username email mobileNumber role profilePictureUrl city');
    res.json(listings);
  } catch (error: any) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch listings.' });
  }
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

    res.json(listing);
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
  try {
    const listing = await Listing.findById(req.params.id) as IListing;

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized: User not logged in.' });
    }

    // Allow seller to delete their own listing, OR allow admin to delete any listing
    if (listing.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this listing.' });
    }

    await Listing.deleteOne({ _id: req.params.id });

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