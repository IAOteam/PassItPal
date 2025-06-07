// frontend/src/components/pages/landing/HeroSection.tsx
import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import usePlacesAutocomplete, {
  // getGeocode,
} from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const uniqueCallbackName = "initAutoCompleteHeroCallback"; // Ensure this is unique if multiple maps/places instances load scripts

const loadGoogleMapsScript = (apiKey: string, callbackName: string) => {
  if (window.google && window.google.maps && window.google.maps.places) {
    console.log("Google Maps script already seems loaded.");
    // If already loaded, and our callback exists, call it.
    // This handles cases where the script might be loaded by another component or a previous render.
    if (typeof window[uniqueCallbackName as keyof Window] === 'function') {
        (window[uniqueCallbackName as keyof Window] as () => void)();
    }
    return;
  }

  const existingScript = document.getElementById('googleMapsScriptHero'); // Unique ID for this script tag
  if (!existingScript) {
    console.log("Loading Google Maps script for HeroSection...");
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}`;
    script.id = 'googleMapsScriptHero'; // Use a unique ID
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  } else {
    console.log("Google Maps script tag already exists in DOM for HeroSection.");
    // If script tag exists but window.google.maps.places is not ready,
    // the script is still loading or failed. The callback will fire when it's ready.
  }
};

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const googleMapsApiKey = import.meta.env.VITE_Maps_API_KEY;

  const {
    ready,
    value,
    suggestions: { status, data: suggestions },
    setValue,
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    initOnMount: false, // We will call init manually
    debounce: 300,
  });

  // useCallback for init to stabilize its reference if used in useEffect deps
  const initializeAutocomplete = useCallback(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      console.log("Google Maps Places library is ready. Initializing usePlacesAutocomplete.");
      init(); // Call init for usePlacesAutocomplete
    } else {
      console.warn("Attempted to init usePlacesAutocomplete, but Google Maps Places library not ready.");
    }
  }, [init]);


  useEffect(() => {
    if (googleMapsApiKey) {
      // Define the callback function on window before loading the script
      // window[uniqueCallbackName as keyof Window] = initializeAutocomplete as () => void;
       window[uniqueCallbackName] = initializeAutocomplete;
       loadGoogleMapsScript(googleMapsApiKey, uniqueCallbackName);
    } else {
      console.warn("VITE_Maps_API_KEY is not set. Location autocomplete will not work.");
    }
    
    // Cleanup the global callback function when the component unmounts
    return () => {
      delete window[uniqueCallbackName as keyof Window];
    };
  }, [googleMapsApiKey, initializeAutocomplete]);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  const handleSelectSuggestion = async (description: string) => {
    setValue(description, false);
    clearSuggestions();
    try {
      // const results = await getGeocode({ address: description }); // Optional
      // console.log('Selected location:', description);
      navigate(`/listings?locationName=${encodeURIComponent(description)}`);
    } catch (error) {
      console.error('Error processing selected place:', error);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen text-center relative py-10 px-4">
      <div className="mt-10 md:mt-20">
        <h1 className="font-bold text-4xl sm:text-5xl md:text-6xl tracking-tighter">
          Find Your Exchange
        </h1>
        <h4 className="font-semibold text-xl sm:text-2xl tracking-wider mt-2">
          Quick &amp; Easy
        </h4>
      </div>

      <div className="mt-8 sm:mt-12 w-full max-w-md md:max-w-lg relative">
        <Input
          type="text"
          value={value}
          onChange={handleInputChange}
          disabled={!ready}
          placeholder="Enter a city or location..."
          className="w-full p-3 text-lg border-2 border-primary rounded-md shadow-sm focus:ring-2 focus:ring-primary-focus focus:border-primary-focus"
        />
        {ready && status === 'OK' && (
          <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto text-left">
            {suggestions.map((suggestion) => (
              <li
                key={suggestion.place_id}
                onClick={() => handleSelectSuggestion(suggestion.description)}
                className="p-3 hover:bg-gray-100 cursor-pointer"
              >
                <strong>{suggestion.structured_formatting.main_text}</strong>{' '}
                <small className="text-gray-600">{suggestion.structured_formatting.secondary_text}</small>
              </li>
            ))}
          </ul>
        )}
         {ready && status === 'ZERO_RESULTS' && (
            <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-md mt-1 shadow-lg p-3 text-gray-500 text-left">
                No results found.
            </div>
        )}
         <Button 
            onClick={() => { if (value) handleSelectSuggestion(value); }}
            disabled={!value || !ready}
            className="mt-3 w-full md:w-auto md:ml-2 px-6 py-3 text-lg"
        >
            Search Listings
        </Button>
      </div>
      <div className="mt-10 md:mt-16">
        <img
          src="/sharing.svg"
          alt="Sharing Tickets and Memberships"
          className="w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96"
        />
      </div>
    </div>
  );
};

export default HeroSection;
