// frontend/src/components/pages/landing/HeroSection.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'motion/react';
import usePlacesAutocomplete from 'use-places-autocomplete';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const uniqueCallbackName = "initAutoCompleteHeroCallback";

const HeroSection: React.FC = () => {
  const navigate = useNavigate();
  const heroRef = useRef(null); // Ref for the entire hero section for scroll tracking
  const googleMapsApiKey = import.meta.env.VITE_Maps_API_KEY;

  // --- MERGED ANIMATION LOGIC ---
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"], // Track scroll from the start of the hero section
  });
  // Transform to move the content up as the user scrolls down
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);

  // --- AUTOCOMPLETE LOGIC (from the newer version) ---
  const {
    ready,
    value,
    suggestions: { status, data: suggestions },
    setValue,
    clearSuggestions,
    init,
  } = usePlacesAutocomplete({
    initOnMount: false,
    debounce: 300,
    // requestOptions: {
    //   componentRestrictions: { country: 'in' }, // Restrict search to India
    // },
  });

  /*const initializeAutocomplete = useCallback(() => {
    if (window.google && window.google.maps && window.google.maps.places) {
      init();
    }
  }, [init]);*/
  useEffect(() => {
    if (window.google) {
      init();
    }
  }, [init]);

  /*useEffect(() => {
    if (googleMapsApiKey) {
      if (!window.google) {
        (window as any)[uniqueCallbackName] = initializeAutocomplete;
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=places&callback=${uniqueCallbackName}`;
        script.id = 'googleMapsScriptHero';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);

        return () => {
            const scriptTag = document.getElementById('googleMapsScriptHero');
            if (scriptTag) document.head.removeChild(scriptTag);
            delete (window as any)[uniqueCallbackName];
        };
      } else {
        initializeAutocomplete();
      }
    } else {
      console.warn("VITE_Maps_API_KEY is not set. Location autocomplete will not work.");
    }
  }, [googleMapsApiKey, initializeAutocomplete]);*/

  const handleSelectSuggestion = (description: string) => {
    setValue(description, false);
    clearSuggestions();
    navigate(`/listings?locationName=${encodeURIComponent(description)}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value) {
      handleSelectSuggestion(value);
    }
  };

  // const heroBackgroundImage = "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2670&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  const heroBackgroundImage = "/herobg.png"
  return (
    <div
      ref={heroRef}
      className="relative h-[145vh]  bg-cover bg-center overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center dark:bg-neutral-800"
        style={{ backgroundImage: ` url(${heroBackgroundImage})` }}
      />
      
      {/* Animated Content Container */}
      <motion.div
        style={{ y: contentY }}
        className="relative z-10 flex flex-col items-center justify-center h-full text-center p-4"
      >
        <div className="max-w-3xl">
          <h1 className="text-4xl md:text-6xl font-black text-gray-800 leading-tight tracking-tight uppercase" style={{ textShadow: '3px 3px 6px rgba(0,0,0,0.5)' }}>
            <div>Pass<span className='text-blue-500'>Karo</span> & Cash<span className='text-blue-500'>Karo</span></div>
            
          </h1>
          <p className="mt-4 text-base md:text-xl text-black " style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.5)' }}>
            Discover gym passes, event tickets, and subscriptions near you and get personalized deals!
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="mt-8 w-full max-w-lg relative">
          <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-800 dark:text-gray-200" />
              <Input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  disabled={!ready}
                  placeholder="Enter your location (e.g., Koramangala, Bengaluru)"
                  className="w-full h-14 pl-12 pr-32 rounded-full bg-neutral-100/40 placeholder:text-gray-800  dark:bg-neutral-800/80  dark:text-white dark:placeholder:text-gray-400 drop-shadow-xl"
                  autoComplete="off"
              />
              <Button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-10 rounded-full px-6 text-gray-800 dark:text-gray-400"
                  disabled={!value}
              >
                  Search
              </Button>
          </div>
          {status === 'OK' && (
            <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-md mt-1 shadow-lg max-h-60 overflow-y-auto text-left">
              {suggestions.map(({ place_id, description, structured_formatting }) => (
                <li
                  key={place_id}
                  onClick={() => handleSelectSuggestion(description)}
                  className="p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer"
                >
                  <strong className='text-gray-900 dark:text-gray-100'>{structured_formatting.main_text}</strong>{' '}
                  <small className="text-gray-600 dark:text-gray-400">{structured_formatting.secondary_text}</small>
                </li>
              ))}
            </ul>
          )}
        </form>
      </motion.div>
    </div>
  );
};

export default HeroSection;