import { useEffect, useState } from 'react';

import { useSearchParams } from 'react-router-dom';
import api from '@/lib/api';

const LocationPrompt = () => {
  //  Use setSearchParams to update URL query parameters without a full page reload.
  const [searchParams, setSearchParams] = useSearchParams();
  const [prompted, setPrompted] = useState(sessionStorage.getItem('locationPrompted') === 'true');

  useEffect(() => {
    // Only run if the user hasn't been prompted in this session
    if (!prompted) {
      navigator.geolocation.getCurrentPosition(
        // Success callback
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Ask our backend to convert coordinates to a city name
            const response = await api.post('/listings/reverse-geocode', { latitude, longitude });
            if (response.data.locationName) {
              // FIX: Update the search params to filter by the user's location.
              // This will trigger a re-fetch on the ListingsPage without a page refresh.
              const newParams = new URLSearchParams(searchParams);
              newParams.set('locationName', response.data.locationName);
              setSearchParams(newParams);
            }
          } catch (error) {
            console.error("Failed to reverse geocode:", error);
          } finally {
            // Mark as prompted so we don't ask again this session
            sessionStorage.setItem('locationPrompted', 'true');
            setPrompted(true);
          }
        },
        // Error callback (user denied permission or an error occurred)
        () => {
          console.log("Location permission denied by user.");
          sessionStorage.setItem('locationPrompted', 'true');
          setPrompted(true);
        },
        // Geolocation options
        {
          enableHighAccuracy: false,
          timeout: 10000,
          maximumAge: 0
        }
      );
    }
  }, [prompted, setSearchParams, searchParams]); // Added dependencies

  // This component renders nothing, it only contains logic
  return null;
};

export default LocationPrompt;
