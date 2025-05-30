import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Mock Geocoding Service
// In a real application,  integrate with a service like Google Maps Geocoding API
//  https://developers.google.com/maps/documentation/geocoding/overview

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

/**
 * Mocks a geocoding service to convert a location name to coordinates.
 * For a real application, replace this with an actual geocoding API call.
 *
 * @param {string} locationName - The name of the location (e.g., "Bengaluru, India").
 * @returns {Promise<GeocodingResult | null>} The latitude, longitude, and formatted address, or null if not found.
 */
export const geocodeAddress = async (locationName: string): Promise<GeocodingResult | null> => {
  console.log(`Mocking geocoding for: ${locationName}`);
  // In production, you'd make an API call here, e.g.:
  /*
  try {
    const response = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json`, {
      params: {
        address: locationName,
        key: process.env.Maps_API_KEY,
      },
    });

    if (response.data.results && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      const formattedAddress = response.data.results[0].formatted_address;
      return { latitude: lat, longitude: lng, formattedAddress };
    }
    return null;
  } catch (error) {
    console.error('Error during geocoding:', error);
    return null;
  }
  */

  // --- MOCK IMPLEMENTATION ---
  // Replace with actual API call in production
  const mockLocations: { [key: string]: GeocodingResult } = {
    "bengaluru": { latitude: 12.9716, longitude: 77.5946, formattedAddress: "Bengaluru, Karnataka, India" },
    "mumbai": { latitude: 19.0760, longitude: 72.8777, formattedAddress: "Mumbai, Maharashtra, India" },
    "delhi": { latitude: 28.7041, longitude: 77.1025, formattedAddress: "Delhi, India" },
    "new york": { latitude: 40.7128, longitude: -74.0060, formattedAddress: "New York, USA" },
    "london": { latitude: 51.5074, longitude: -0.1278, formattedAddress: "London, UK" },
  };

  const lowerCaseLocation = locationName.toLowerCase();
  const result = mockLocations[lowerCaseLocation];

  if (result) {
    console.log(`Mock geocoding found for ${locationName}: ${result.latitude}, ${result.longitude}`);
    return result;
  }

  // Fallback for unknown locations (you'd typically return null or throw error)
  // For now, let's return a default for demonstration
  console.warn(`Mock geocoding not found for ${locationName}. Returning default.`);
  return { latitude: 0, longitude: 0, formattedAddress: locationName }; // Placeholder for unknown
};