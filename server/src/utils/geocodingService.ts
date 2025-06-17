// server/src/utils/geocodingService.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

const Maps_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!Maps_API_KEY) {
    console.warn("[Geocoding Service] WARNING: Maps_API_KEY is not set in .env. Geocoding will not work.");
}

/**
 * Geocodes an address using the Google Maps Geocoding API.
 *
 * @param {string} address - The address or location name to geocode.
 * @returns {Promise<GeocodingResult | null>} The latitude, longitude, and formatted address, or null if not found.
 */
export const geocodeAddress = async (address: string): Promise<GeocodingResult | null> => {
  if (!Maps_API_KEY) {
    console.error("Geocoding failed: API key is missing.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  try {
    const response = await axios.get(url, {
      params: {
        address: address,
        key: Maps_API_KEY,
      },
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      const { lat, lng } = result.geometry.location;
      const formattedAddress = result.formatted_address;
      
      console.log(`[Geocoding] Successfully geocoded "${address}" to: ${lat}, ${lng}`);
      return { latitude: lat, longitude: lng, formattedAddress };
    } else {
      console.warn(`[Geocoding] No results found for address: "${address}". Status: ${response.data.status}`);
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error during geocoding API call:', error.response?.data || error.message);
    } else {
        console.error('An unexpected error occurred during geocoding:', error);
    }
    return null;
  }
};