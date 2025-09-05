import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Loader2, MapPin } from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

import ListingLimitModal from '@/components/shared/ListingLimitModal'; 
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { BackButton } from '@/components/shared/BackButton';


interface Category {
  _id: string;
  name: string;
}

const fetchCategories = async (): Promise<Category[]> => {
  const { data } = await api.get('/categories');
  return data;
};

const createNewCategory = async (name: string): Promise<Category> => {
    const { data } = await api.post('/categories', { name });
    return data;
};

const mapContainerStyle = {
  width: '100%',
  height: '300px',
  borderRadius: '0.5rem',
};

const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cultPassType, setCultPassType] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [availableCredits, setAvailableCredits] = useState('');
  const [description, setDescription] = useState('');
  const [adImageBase64, setAdImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const { ready, value: locationValue, suggestions: { status, data: locationData }, setValue: setLocationValue, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');


  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createCategoryMutation = useMutation({
    mutationFn: createNewCategory,
    onSuccess: (newCategory) => {
      toast.success(`Category "${newCategory.name}" created!`);
      setSelectedCategories(prev => [...prev, newCategory]);
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCategorySearch('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to create category.");
    }
  });
  
  const createListingMutation = useMutation({
      mutationFn: (listingData: any) => api.post('/listings', listingData),
      onSuccess: () => {
          toast.success("Listing created successfully!");
          navigate('/dashboard');
      },
      onError: (error: any) => {
          if (error.response?.status === 403) {
              setLimitModalMessage(error.response.data.message);
              setIsLimitModalOpen(true);
          } else {
              toast.error(error.response?.data?.message || 'An unexpected error occurred.');
          }
      }
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      setAdImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleLocationSelect = useCallback(async (address: string) => {
    setLocationValue(address, false);
    clearSuggestions();
    try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        const newPosition = { lat, lng };
        setMapCenter(newPosition);
        setMarkerPosition(newPosition);
        if (mapRef) {
          mapRef.panTo(newPosition);
        }
    } catch (error) {
        console.error("Error geocoding address: ", error);
        toast.error("Could not find that location on the map.");
    }
  }, [setLocationValue, clearSuggestions, mapRef]); 

  const handleMarkerDragEnd = useCallback(async (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarkerPosition({ lat, lng });
        try {
            const { data } = await api.post('/listings/get-address-from-coords', { latitude: lat, longitude: lng });
            if (data.address) {
                setLocationValue(data.address, false);
            }
        } catch (error) {
            console.error("Reverse geocoding failed:", error);
            toast.error("Could not get address for this location.");
        }
    }
  }, [setLocationValue]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    setMapRef(map);
  }, []);

  const handleMapIdle = useCallback(async () => {
    if (mapRef && isMapInteractive) {
        const newCenter = mapRef.getCenter();
        if (newCenter) {
            const lat = newCenter.lat();
            const lng = newCenter.lng();
            setMarkerPosition({ lat, lng });
            try {
                const { data } = await api.post('/listings/get-address-from-coords', { latitude: lat, longitude: lng });
                if (data.address) {
                    setLocationValue(data.address, false);
                }
            } catch (error) {
                console.error("Reverse geocoding failed:", error);
                toast.error("Could not get address for this location.");
            }
        }
    }
  }, [mapRef, isMapInteractive, setLocationValue]);

  const handleCategorySelect = (category: Category) => {
    if (!selectedCategories.some(c => c._id === category._id)) {
      setSelectedCategories([...selectedCategories, category]);
    }
    setCategorySearch('');
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories(selectedCategories.filter(c => c._id !== categoryId));
  };
  
  const handleCategoryCreation = () => {
      if (categorySearch.trim() && !createCategoryMutation.isPending) {
          createCategoryMutation.mutate(categorySearch);
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategories.length === 0) {
        toast.error("Please select at least one category.");
        return;
    }
    
    // Check if locationValue is set. If not, trigger geocoding manually before submitting.
    let lat = markerPosition.lat;
    let lng = markerPosition.lng;

    if (!locationValue && !lat && !lng) {
        toast.error("Please enter a valid location.");
        return;
    }

    if (locationValue && (!lat || !lng)) {
        try {
            const results = await getGeocode({ address: locationValue });
            const { lat: newLat, lng: newLng } = getLatLng(results[0]);
            lat = newLat;
            lng = newLng;
        } catch (error) {
            toast.error("Could not geocode the provided address. Please try again.");
            console.error("Geocoding failed on form submit:", error);
            return;
        }
    }

    createListingMutation.mutate({
      cultPassType,
      originalPrice: parseFloat(originalPrice),
      askingPrice: parseFloat(askingPrice),
      expiryDate,
      locationName: locationValue,
      latitude: lat,
      longitude: lng,
      categories: selectedCategories.map(c => c._id),
      description,
      availableCredits: availableCredits ? parseInt(availableCredits, 10) : undefined,
      adImageBase64: adImageBase64 || undefined,
    });
  };

  const filteredCategories = allCategories.filter(
    (cat) =>
      cat.name.toLowerCase().includes(categorySearch.toLowerCase()) &&
      !selectedCategories.some((selected) => selected._id === cat._id)
  );

  return (
    <>
      <ListingLimitModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        message={limitModalMessage}
      />
      <div className="container mx-auto max-w-2xl py-24 px-4">
        <BackButton/>
        <h1 className="text-3xl font-bold mb-6 text-center dark:text-white">Create a New Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md border dark:border-neutral-800">
          
           <div>
          <Label>Listing Image</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 dark:border-neutral-700">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto object-contain" />
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-12 w-12 text-gray-400 dark:text-neutral-500" />
                <div className="mt-4 flex text-sm leading-6 text-primary dark:text-blue-400">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white dark:bg-neutral-900 font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" required />
                  </label>
                  <p className="pl-1 text-gray-600 dark:text-gray-400">or drag and drop</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
            <Label htmlFor="cultPassType">Pass / Ticket Name</Label>
            <Input id="cultPassType" value={cultPassType} onChange={(e) => setCultPassType(e.target.value)} placeholder="e.g., CultPass ELITE - 6 Months" required />
          </div>

          <div className="md:col-span-2 relative">
            <Label htmlFor="category">Categories</Label>
            <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-white dark:bg-neutral-800 dark:border-neutral-700">
                {selectedCategories.map(cat => (
                    <div key={cat._id} className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold px-2 py-1 rounded-full">
                        <span className="capitalize">{cat.name}</span>
                        <button type="button" onClick={() => handleRemoveCategory(cat._id)} className="focus:outline-none">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                ))}
                <input
                    id="category"
                    type="text"
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                    placeholder={selectedCategories.length === 0 ? "Search or create categories..." : ""}
                    className="flex-grow bg-transparent outline-none text-sm dark:text-white"
                />
            </div>
            {categorySearch && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border rounded-md shadow-lg max-h-48 overflow-y-auto dark:border-neutral-700">
                    {categoriesLoading && <div className="p-2 text-xs text-gray-500">Loading...</div>}
                    {filteredCategories.length > 0 && (
                        filteredCategories.map(cat => (
                            <div key={cat._id} onClick={() => handleCategorySelect(cat)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-sm capitalize dark:text-white">
                                {cat.name}
                            </div>
                        ))
                    )}
                    <div onClick={handleCategoryCreation} className="p-2 border-t text-blue-600 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-sm font-semibold flex items-center dark:text-blue-400 dark:border-neutral-700">
                        {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : `+ Create "${categorySearch}"`}
                    </div>
                </div>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about your pass, benefits, transfer process, etc." required className="min-h-[120px]" />
          </div>
          
          <div>
            <Label htmlFor="originalPrice">Original Price (₹)</Label>
            <Input id="originalPrice" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} placeholder="e.g., 15000" required />
          </div>
          <div>
            <Label htmlFor="askingPrice">Your Asking Price (₹)</Label>
            <Input id="askingPrice" type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} placeholder="e.g., 12000" required />
          </div>
          <div>
            <Label htmlFor="expiryDate">Expiry Date</Label>
            <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
          </div>
          <div>
            <Label htmlFor="availableCredits">Available Credits (Optional)</Label>
            <Input id="availableCredits" type="number" value={availableCredits} onChange={(e) => setAvailableCredits(e.target.value)} placeholder="e.g., 50" />
          </div>
          <div className="md:col-span-2 relative">
              <Label htmlFor="locationName">Location / City</Label>
              <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  
              <Input id="locationName" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} disabled={!ready} placeholder="Start typing your address..." required className="pl-9"/>
              </div>
              {status === 'OK' && (
                <div className="relative">
                  <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 shadow-lg dark:border-neutral-700">
                      {locationData.map(suggestion => (
                          <li key={suggestion.place_id} onClick={() => handleLocationSelect(suggestion.description)} className="p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer dark:text-white">
                              {suggestion.description}
                          </li>
                      ))}
                  </ul>
                  </div>
              )}
              <div className="mt-2">
                <GoogleMap
                    mapContainerStyle={mapContainerStyle}
                    center={isMapInteractive ? undefined : mapCenter}
                    zoom={14}
                    onLoad={onMapLoad}
                    onIdle={handleMapIdle}
                    onCenterChanged={() => setIsMapInteractive(true)}
                >
                    <MarkerF position={markerPosition} draggable={true} onDragEnd={handleMarkerDragEnd} />
                </GoogleMap>
              </div>
          </div>
        </div>
       
        <Button type="submit" className="w-full" disabled={createListingMutation.isPending}>
          {createListingMutation.isPending ? 'Submitting...' : 'Create Listing'}
        </Button>
        </form>
      </div>
    </>
  );
};
export default CreateListingPage;
