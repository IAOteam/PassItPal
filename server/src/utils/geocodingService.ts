// server/src/utils/geocodingService.ts
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

interface GeocodingResult {
  city: string;
  latitude: number;
  longitude: number;
  address: IAddress;
  displayLocation: string;
}

interface IAddress {
  street?: string;
  suburb?: string;
  city: string;
  state: string;
  country: string;
  postalCode?: string;
  fullAddress: string;
}

const Maps_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!Maps_API_KEY) {
  console.warn(
    "[Geocoding Service] WARNING: GOOGLE_MAPS_API_KEY is not set in .env. Geocoding will not work."
  );
}

/**
 * Geocodes an address using the Google Maps Geocoding API.
 *
 * @param {string} address - The address or location name to geocode.
 * @returns {Promise<GeocodingResult | null>} The parsed geocoding result, or null if not found.
 */
export const geocodeAddress = async (
  address: string
): Promise<GeocodingResult | null> => {
  if (!Maps_API_KEY) {
    console.error("Geocoding failed: API key is missing.");
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  try {
    const response = await axios.get(url, {
      params: { address, key: Maps_API_KEY },
    });

    if (response.data.status !== "OK" || !response.data.results[0]) return null;

    const result = response.data.results[0];
    const { lat, lng } = result.geometry.location;

    const addressComponents = result.address_components;
    const componentMap = new Map(
      addressComponents.map((c: any) => [c.types[0], c.long_name])
    );

    const parsedAddress: IAddress = {
      street: componentMap.get("street_number")
        ? `${componentMap.get("street_number") as string} ${
            componentMap.get("route") as string
          }`
        : (componentMap.get("route") as string | undefined),
      suburb:
        (componentMap.get("sublocality_level_1") as string | undefined) ||
        (componentMap.get("neighborhood") as string | undefined),
      city:
        (componentMap.get("locality") as string | undefined) ||
        (componentMap.get("administrative_area_level_2") as string),
      state: componentMap.get("administrative_area_level_1") as string,
      country: componentMap.get("country") as string,
      postalCode: componentMap.get("postal_code") as string | undefined,
      fullAddress: result.formatted_address,
    };

    // Use suburb if available, otherwise fallback to city
    const displayLocation = parsedAddress.suburb || parsedAddress.city;

    return {
      city: parsedAddress.city,
      latitude: lat,
      longitude: lng,
      address: parsedAddress,
      displayLocation,
    };
  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        "Error during geocoding API call:",
        error.response?.data || error.message
      );
    } else {
      console.error("An unexpected error occurred during geocoding:", error);
    }
    return null;
  }
};

/**
 * Reverse geocodes coordinates (latitude & longitude) into a human-readable city name.
 *
 * @param {number} lat - The latitude.
 * @param {number} lng - The longitude.
 * @returns {Promise<{ locationName: string } | null>} The city/location name, or null if not found.
 */
export const reverseGeocode = async (
  lat: number,
  lng: number
): Promise<{ locationName: string } | null> => {
  if (!Maps_API_KEY) return null;

  const url = `https://maps.googleapis.com/maps/api/geocode/json`;

  try {
    const response = await axios.get(url, {
      params: {
        latlng: `${lat},${lng}`,
        key: Maps_API_KEY,
        result_type: "locality", // Prioritize getting the city name
      },
    });

    if (response.data.status === "OK" && response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressComponents = result.address_components;
      const cityComponent = addressComponents.find((comp: any) =>
        comp.types.includes("locality")
      );

      const locationName = cityComponent
        ? cityComponent.long_name
        : result.formatted_address;

      return { locationName };
    }
    return null;
  } catch (error) {
    console.error("Error during reverse geocoding:", error);
    return null;
  }
};

