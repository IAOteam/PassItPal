import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  ImagePlus, 
  X, 
  Loader2, 
  MapPin, 
  Calendar, 
  CreditCard, 
  MapPin as MapPinIcon,
  Eye,
  User,
  ShoppingCart
} from 'lucide-react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';
import ListingLimitModal from '@/components/shared/ListingLimitModal'; 
import { GoogleMap, MarkerF } from '@react-google-maps/api';

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

// Default center (Bengaluru)
const defaultCenter = {
  lat: 12.9716,
  lng: 77.5946,
};

const CreateListingPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // --- Form State ---
  const [cultPassType, setCultPassType] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [availableCredits, setAvailableCredits] = useState('');
  const [description, setDescription] = useState('');
  const [adImageBase64, setAdImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  // --- Preview State ---
  const [previewMode, setPreviewMode] = useState<'seller' | 'buyer'>('seller');
  const [hasStartedTyping, setHasStartedTyping] = useState(false);
  
  // --- Location State ---
  const { ready, value: locationValue, suggestions: { status, data: locationData }, setValue: setLocationValue, clearSuggestions } = usePlacesAutocomplete({ debounce: 300 });
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const [isMapInteractive, setIsMapInteractive] = useState(false);
  
  // --- Category State ---
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  
  // --- Modal State ---
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [limitModalMessage, setLimitModalMessage] = useState('');
  
  // Check if user has started typing
  useEffect(() => {
    if (
      cultPassType.trim() !== '' ||
      originalPrice.trim() !== '' ||
      askingPrice.trim() !== '' ||
      expiryDate !== '' ||
      description.trim() !== '' ||
      locationValue.trim() !== '' ||
      availableCredits.trim() !== '' ||
      imagePreview !== null ||
      selectedCategories.length > 0
    ) {
      setHasStartedTyping(true);
    }
  }, [cultPassType, originalPrice, askingPrice, expiryDate, description, locationValue, availableCredits, imagePreview, selectedCategories]);

  const { data: allCategories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const createCategoryMutation = useMutation({
    mutationFn: createNewCategory,
    onSuccess: (newCategory) => {
      toast.success(Category "${newCategory.name}" created!);
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
    if (mapRef) {
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
  }, [mapRef, setLocationValue]);
  
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
    
    createListingMutation.mutate({
      cultPassType,
      originalPrice: parseFloat(originalPrice),
      askingPrice: parseFloat(askingPrice),
      expiryDate,
      locationName: locationValue,
      latitude: markerPosition.lat,
      longitude: markerPosition.lng,
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
  
  const savingsPercentage = originalPrice && askingPrice 
    ? Math.round(((parseFloat(originalPrice) - parseFloat(askingPrice)) / parseFloat(originalPrice)) * 100)
    : 0;

  return (
    <> 
      <ListingLimitModal 
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        message={limitModalMessage}
      />
      <div className="container mx-auto max-w-6xl py-24 px-4">
        <h1 className="text-3xl font-bold mb-6 text-center">Create a New Listing</h1>
        
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Form Section */}
          <div className="flex-1">
            <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md border">
              
              <div>
                <Label>Listing Image</Label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto object-contain" />
                  ) : (
                    <div className="text-center">
                      <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                      <div className="mt-4 flex text-sm leading-6 text-primary">
                        <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark">
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
                  <Input 
                    id="cultPassType" 
                    value={cultPassType} 
                    onChange={(e) => setCultPassType(e.target.value)} 
                    placeholder="e.g., CultPass ELITE - 6 Months" 
                    required 
                  />
                </div>
                
                <div className="md:col-span-2 relative">
                  <Label htmlFor="category">Categories</Label>
                  <div className="flex flex-wrap items-center gap-2 p-2 border rounded-md bg-white dark:bg-neutral-800">
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
                          className="flex-grow bg-transparent outline-none text-sm"
                      />
                  </div>
                  {categorySearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-800 border rounded-md shadow-lg max-h-48 overflow-y-auto">
                          {categoriesLoading && <div className="p-2 text-xs text-gray-500">Loading...</div>}
                          {filteredCategories.length > 0 && (
                              filteredCategories.map(cat => (
                                  <div key={cat._id} onClick={() => handleCategorySelect(cat)} className="p-2 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-sm capitalize">
                                      {cat.name}
                                  </div>
                              ))
                          )}
                          <div onClick={handleCategoryCreation} className="p-2 border-t text-blue-600 hover:bg-gray-100 dark:hover:bg-neutral-700 cursor-pointer text-sm font-semibold flex items-center">
                              {createCategoryMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : + Create "${categorySearch}"}
                          </div>
                      </div>
                  )}
                </div>
                
                <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Details about your pass, benefits, transfer process, etc." 
                    required 
                    className="min-h-[120px]" 
                  />
                </div>
                
                <div>
                  <Label htmlFor="originalPrice">Original Price (₹)</Label>
                  <Input 
                    id="originalPrice" 
                    type="number" 
                    value={originalPrice} 
                    onChange={(e) => setOriginalPrice(e.target.value)} 
                    placeholder="e.g., 15000" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="askingPrice">Your Asking Price (₹)</Label>
                  <Input 
                    id="askingPrice" 
                    type="number" 
                    value={askingPrice} 
                    onChange={(e) => setAskingPrice(e.target.value)} 
                    placeholder="e.g., 12000" 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input 
                    id="expiryDate" 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    min={new Date().toISOString().split("T")[0]} 
                    required 
                  />
                </div>
                
                <div>
                  <Label htmlFor="availableCredits">Available Credits (Optional)</Label>
                  <Input 
                    id="availableCredits" 
                    type="number" 
                    value={availableCredits} 
                    onChange={(e) => setAvailableCredits(e.target.value)} 
                    placeholder="e.g., 50" 
                  />
                </div>
                
                <div className="md:col-span-2 relative">
                    <Label htmlFor="locationName">Location / City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input 
                        id="locationName" 
                        value={locationValue} 
                        onChange={(e) => setLocationValue(e.target.value)} 
                        disabled={!ready} 
                        placeholder="Start typing your address..." 
                        required 
                        className="pl-9"
                      />
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
          
          {/* Live Preview Section - Only show when user starts typing */}
          {hasStartedTyping && (
            <div className="w-full lg:w-96">
              <div className="bg-white dark:bg-neutral-900 p-6 rounded-lg shadow-md border sticky top-24">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Live Preview
                  </h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setPreviewMode('seller')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        previewMode === 'seller'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <User className="h-4 w-4 inline mr-1" />
                      Seller
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode('buyer')}
                      className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                        previewMode === 'buyer'
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 dark:bg-neutral-800 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <ShoppingCart className="h-4 w-4 inline mr-1" />
                      Buyer
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  {/* Image Preview */}
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Listing preview"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
                      <ImagePlus className="h-12 w-12 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Title */}
                  {cultPassType ? (
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {cultPassType}
                    </h3>
                  ) : (
                    <div className="h-6 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                  )}
                  
                  {/* Price Section */}
                  <div className="space-y-2">
                    {originalPrice && askingPrice && (
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold text-green-600">
                          ₹{parseInt(askingPrice).toLocaleString()}
                        </span>
                        {savingsPercentage > 0 && (
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Save {savingsPercentage}%
                          </span>
                        )}
                      </div>
                    )}
                    {originalPrice && (
                      <p className="text-sm text-gray-500 line-through">
                        Original: ₹{parseInt(originalPrice).toLocaleString()}
                      </p>
                    )}
                    {(!originalPrice || !askingPrice) && (
                      <div className="h-8 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                    )}
                  </div>
                  
                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {/* Expiry Date */}
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {expiryDate ? (
                        <span>{new Date(expiryDate).toLocaleDateString()}</span>
                      ) : (
                        <span className="text-gray-400">Expiry date</span>
                      )}
                    </div>
                    
                    {/* Credits */}
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-gray-400" />
                      {availableCredits ? (
                        <span>{availableCredits} credits</span>
                      ) : (
                        <span className="text-gray-400">Credits</span>
                      )}
                    </div>
                    
                    {/* Location */}
                    <div className="flex items-center gap-2 col-span-2">
                      <MapPinIcon className="h-4 w-4 text-gray-400" />
                      {locationValue ? (
                        <span className="text-sm">{locationValue}</span>
                      ) : (
                        <span className="text-gray-400">Location</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Categories */}
                  {selectedCategories.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {selectedCategories.map(cat => (
                        <span
                          key={cat._id}
                          className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2 py-1 rounded-full capitalize"
                        >
                          {cat.name}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Description */}
                  {description ? (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">
                      {description}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse"></div>
                      <div className="h-4 bg-gray-200 dark:bg-neutral-800 rounded animate-pulse w-3/4"></div>
                    </div>
                  )}
                  
                  {/* Action Button based on preview mode */}
                  <div className="pt-4">
                    {previewMode === 'buyer' ? (
                      <Button className="w-full" variant="default">
                        <ShoppingCart className="h-4 w-4 mr-2" />
                        Buy Now
                      </Button>
                    ) : (
                      <Button className="w-full" variant="outline">
                        <User className="h-4 w-4 mr-2" />
                        Edit Listing
                      </Button>
                    )}
                  </div>
                  
                  {/* Preview Mode Indicator */}
                  <div className="text-xs text-center text-gray-500 dark:text-gray-400">
                    Previewing as: {previewMode === 'buyer' ? 'Potential Buyer' : 'Seller'}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default CreateListingPage;
