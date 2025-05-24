import { Request, Response } from 'express';
import Listing, { IListing } from '../models/Listing.model';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import { createAndEmitNotification } from './notificationController'; // Import notification helper

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
    city,
    latitude,
    longitude,
    adImageBase64
  } = req.body;

  try {
    if (!req.user || req.user.role !== 'seller') {
      return res.status(403).json({ message: 'Only sellers can create listings.' });
    }

    if (!req.user.isMobileVerified) {
      return res.status(403).json({ message: 'Seller mobile number must be verified to create listings.' });
    }

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
      availableCredits,
      city,
      latitude,
      longitude,
      adImageUrl
    });

    const listing = await newListing.save();

    // Notify the seller that their listing was created successfully
    if (req.user) { // Added check for req.user
      await createAndEmitNotification(
        req.user._id.toString(),
        'listing_update',
        `Your listing "${listing.cultPassType}" was created successfully.`,
        `/listing/${listing._id.toString()}` // Ensure _id is string
      );
    }

    res.status(201).json({ message: 'Listing created successfully', listing });
  } catch (error: any) {
    console.error('Error creating listing:', error.message);
    res.status(500).json({ message: 'Server error: Could not create listing.' });
  }
};

// @route   GET /api/listings
// @desc    Get all active Cult Fit pass listings (optionally by location)
// @access  Public
export const getListings = async (req: Request, res: Response) => {
  const { city, latitude, longitude, radiusKm } = req.query;

  try {
    let query: any = { isAvailable: true };

    if (city && typeof city === 'string') {
      query.city = new RegExp(city, 'i');
    }

    if (latitude && longitude && radiusKm) {
      const lat = parseFloat(latitude as string);
      const lon = parseFloat(longitude as string);
      const radius = parseFloat(radiusKm as string);

      if (!isNaN(lat) && !isNaN(lon) && !isNaN(radius)) {
        query.location = {
          $geoWithin: {
            $centerSphere: [[lon, lat], radius / 6378.1]
          }
        };
        delete query.city;
      }
    }

    const listings = await Listing.find(query).populate('seller', 'username email mobileNumber role location');
    res.json(listings);
  } catch (error: any) {
    console.error('Error fetching listings:', error.message);
    res.status(500).json({ message: 'Server error: Could not fetch listings.' });
  }
};

// @route   GET /api/listings/:id
// @desc    Get a single Cult Fit pass listing by ID
// @access  Public
export const getListingById = async (req: Request, res: Response) => { // Exported correctly
  try {
    const listing = await Listing.findById(req.params.id).populate('seller', 'username email mobileNumber role location');

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
    availableCredits,
    city,
    latitude,
    longitude,
    adImageBase64
  } = req.body;

  try {
    let listing = await Listing.findById(id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (!req.user || listing.seller.toString() !== req.user._id.toString()) {
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
      availableCredits,
      city,
      latitude,
      longitude,
      adImageUrl: newAdImageUrl,
      updatedAt: new Date()
    };

    Object.keys(updatedFields).forEach(key => updatedFields[key as keyof IListing] === undefined && delete updatedFields[key as keyof IListing]);


    listing = await Listing.findByIdAndUpdate(id, { $set: updatedFields }, { new: true });

    if (listing && req.user) { // Added check for req.user
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
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return res.status(404).json({ message: 'Listing not found.' });
    }

    if (!req.user || listing.seller.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this listing.' });
    }

    await Listing.deleteOne({ _id: req.params.id });

    if (req.user) { // Added check for req.user
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