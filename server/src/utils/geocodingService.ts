// server/src/utils/geocodingService.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
  city : string;
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
      // Extract city from address_components
      const addressComponents = result.address_components;
      const cityComponent = addressComponents.find((comp: any) => comp.types.includes('locality'));
      const city = cityComponent ? cityComponent.long_name : '';

      // console.log(`[Geocoding] Successfully geocoded "${address}" to: ${lat}, ${lng}`);
      return { latitude: lat, longitude: lng, formattedAddress, city };
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

/**
 *  Converts coordinates into a city name using Google Maps Geocoding API.
 *
 * @param {number} lat - The latitude.
 * @param {number} lng - The longitude.
 * @returns {Promise<string | null>} The city name, or null if not found.
 */
export const reverseGeocode = async (lat: number, lng: number): Promise<string | null> => {
  if (!Maps_API_KEY) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  try {
    const response = await axios.get(url, {
      params: {
        latlng: `${lat},${lng}`,
        key: Maps_API_KEY,
        result_type: 'locality', // Prioritize getting the city name
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      // Find the 'locality' component which typically represents the city
      const addressComponents = response.data.results[0].address_components;
      const cityComponent = addressComponents.find((comp: any) => comp.types.includes('locality'));
      
      const cityName = cityComponent ? cityComponent.long_name : response.data.results[0].formatted_address.split(',')[0];
      // console.log(`[Reverse Geocode] Found city: ${cityName}`);
      return cityName;
    }
    return null;
  } catch (error) {
    console.error('Error during reverse geocoding:', error);
    return null;
  }
};
