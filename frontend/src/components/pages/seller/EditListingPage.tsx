// frontend/src/components/pages/seller/EditListingPage.tsx
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ImagePlus, X, Loader2, MapPin } from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import { BackButton } from '@/components/shared/BackButton';

// Types
import type { IListing, ICategory } from '@passitpal/types';

// API Functions for TanStack Query
const fetchListingForEdit = async (listingId: string): Promise<IListing> => {
  const { data } = await api.get(`/listings/${listingId}`);
  return data;
};

const fetchCategories = async (): Promise<ICategory[]> => {
  const { data } = await api.get('/categories');
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

const EditListingPage: React.FC = () => {
  const { listingId } = useParams<{ listingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Form State ---
  const [cultPassType, setCultPassType] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [description, setDescription] = useState('');
  const [adImageBase64, setAdImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // --- Location State ---
  const { ready, value: locationValue, suggestions: { status, data: locationData }, setValue: setLocationValue, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  // --- Category State ---
  const [selectedCategories, setSelectedCategories] = useState<ICategory[]>([]);
  
  // --- Data Fetching ---
  const { data: listingData, isLoading: isListingLoading, isError: isListingError } = useQuery<IListing, Error>({
    queryKey: ['listing', listingId],
    queryFn: () => fetchListingForEdit(listingId!),
    enabled: !!listingId,
  });

  const { data: allCategories = [] } = useQuery<ICategory[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  // --- Data Mutation ---
  const updateListingMutation = useMutation({
      mutationFn: (updatedData: Partial<IListing>) => api.put(`/listings/${listingId}`, updatedData),
      onSuccess: () => {
          toast.success("Listing updated successfully!");
          queryClient.invalidateQueries({ queryKey: ['sellerDashboardData'] });
          navigate('/dashboard');
      },
      onError: (error: any) => {
          toast.error(error.response?.data?.message || 'Failed to update listing.');
      }
  });

  // --- Effect to pre-fill form when data loads ---
  useEffect(() => {
    if (listingData) {
      setCultPassType(listingData.cultPassType);
      setOriginalPrice(String(listingData.originalPrice));
      setAskingPrice(String(listingData.askingPrice));
      setDescription(listingData.description);
      // Format date for input type="date" which requires YYYY-MM-DD
      setExpiryDate(new Date(listingData.expiryDate).toISOString().split('T')[0]);
      setImagePreview(listingData.adImageUrl || null);
      setLocationValue(listingData.displayLocation, false);
      
      const position = { lat: listingData.latitude, lng: listingData.longitude };
      setMarkerPosition(position);
      setMapCenter(position);

      // Pre-populate categories if they are objects
      const populatedCategories = listingData.categories.filter(
        (cat): cat is ICategory => typeof cat === 'object' && cat !== null && '_id' in cat
      );
      setSelectedCategories(populatedCategories);
    }
  }, [listingData, setLocationValue]);

  // --- Handlers ---
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
  
  const handleLocationSelect = async (address: string) => {
    setLocationValue(address, false);
    clearSuggestions();
    try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        setMapCenter({ lat, lng });
        setMarkerPosition({ lat, lng });
    } catch (error) {
        toast.error("Could not find that location on the map.");
    }
  };

  const handleMarkerDragEnd = async (e: google.maps.MapMouseEvent) => {
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
            toast.error("Could not get address for this location.");
        }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedData: any = {
      cultPassType,
      originalPrice: parseFloat(originalPrice),
      askingPrice: parseFloat(askingPrice),
      expiryDate,
      locationName: locationValue,
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
      categories: selectedCategories.map(c => c._id),
      description,
    };
    if (adImageBase64) {
      updatedData.adImageBase64 = adImageBase64;
    }
    updateListingMutation.mutate(updatedData);
  };

  if (isListingLoading) return <div className="flex h-screen items-center justify-center">Loading listing data...</div>;
  if (isListingError) return <div className="flex h-screen items-center justify-center text-red-500">Error loading listing. Please try again.</div>;

  return (
    <div className="container mx-auto max-w-2xl py-12 px-4">
        <BackButton />
        <h1 className="text-3xl font-bold mb-6 text-center">Edit Your Listing</h1>
        <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md border">
            {/* Image Upload Section */}
            <div>
                <Label>Listing Image</Label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                    {imagePreview ? (
                        <div className="relative">
                            <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto object-contain" />
                            <Button variant="destructive" size="icon" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setImagePreview(null); setAdImageBase64(null); }}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="text-center">
                            <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                            <div className="mt-4 flex text-sm leading-6 text-primary">
                                <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none hover:text-primary-dark">
                                    <span>Upload a new image</span>
                                    <input id="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                                </label>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div className="md:col-span-2">
                    <Label htmlFor="cultPassType">Pass / Ticket Name</Label>
                    <Input id="cultPassType" value={cultPassType} onChange={(e) => setCultPassType(e.target.value)} required />
                </div>
                <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="min-h-[120px]" />
                </div>
                <div>
                    <Label htmlFor="originalPrice">Original Price (₹)</Label>
                    <Input id="originalPrice" type="number" value={originalPrice} onChange={(e) => setOriginalPrice(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="askingPrice">Your Asking Price (₹)</Label>
                    <Input id="askingPrice" type="number" value={askingPrice} onChange={(e) => setAskingPrice(e.target.value)} required />
                </div>
                <div>
                    <Label htmlFor="expiryDate">Expiry Date</Label>
                    <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} required />
                </div>
            </div>
            
            {/* Location Section */}
            <div className="relative">
                <Label htmlFor="locationName">Location / City</Label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="locationName" value={locationValue} onChange={(e) => setLocationValue(e.target.value)} disabled={!ready} required className="pl-9"/>
                </div>
                {status === 'OK' && (
                    <div className="relative">
                        <ul className="absolute z-10 w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 shadow-lg">
                            {locationData.map(suggestion => (
                                <li key={suggestion.place_id} onClick={() => handleLocationSelect(suggestion.description)} className="p-3 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer">
                                    {suggestion.description}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="mt-2">
                    <GoogleMap mapContainerStyle={mapContainerStyle} center={mapCenter} zoom={14}>
                        <MarkerF position={markerPosition} draggable={true} onDragEnd={handleMarkerDragEnd} />
                    </GoogleMap>
                </div>
            </div>

            <Button type="submit" className="w-full" disabled={updateListingMutation.isPending}>
                {updateListingMutation.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Updating...</> : 'Save Changes'}
            </Button>
        </form>
    </div>
  );
};

export default EditListingPage;
