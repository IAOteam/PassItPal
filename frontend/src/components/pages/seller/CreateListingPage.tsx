// src/pages/seller/CreateListingPage.tsx
import React, { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { useNavigate } from 'react-router-dom'; // To redirect after creation
import { useAuth } from '@/hooks/useAuth';
import { ImagePlus } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface FormErrors {
  cultPassType?: string;
  originalPrice?: string;
  askingPrice?: string;
  expiryDate?: string;
  locationName?: string;
  category?: string;
  form?: string; // For general form errors
}

const CreateListingPage: React.FC = () => {
  const { user,createListing, loading, error: apiError, clearError } = useAuth();
  const navigate = useNavigate();

  const [cultPassType, setCultPassType] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [availableCredits, setAvailableCredits] = useState('');
  const [locationName, setLocationName] = useState('');
  const [adImageBase64, setAdImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  
  // e.g., const [images, setImages] = useState<File[]>([]); for file uploads

  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);
  const [errors, setErrors] = useState<FormErrors>({});
  useEffect(() => {
    // Redirect if user is not a seller
    if (user && user.role !== 'seller') {
      navigate('/dashboard', { state: { message: "You must be a seller to create a listing." } });
    }
    clearError();
    // Pre-fill location if user has one
    if (user?.city) {
      setLocationName(user.city);
    }
  }, [user, navigate, clearError]);

  useEffect(() => {
    if(apiError) {
      setErrors({ form: apiError });
    }
  }, [apiError]);

const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
      // Set base64 for API call
      setAdImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!cultPassType.trim()) newErrors.cultPassType = "Pass name is required.";
    if (!originalPrice) {
      newErrors.originalPrice = "Original price is required.";
    } else if (isNaN(Number(originalPrice)) || Number(originalPrice) <= 0) {
      newErrors.originalPrice = "Please enter a valid positive number.";
    }
    
    if (!askingPrice) {
      newErrors.askingPrice = "Asking price is required.";
    } else if (isNaN(Number(askingPrice)) || Number(askingPrice) <= 0) {
      newErrors.askingPrice = "Please enter a valid positive number.";
    } else if (Number(askingPrice) > Number(originalPrice)) {
      newErrors.askingPrice = "Asking price cannot be higher than the original price.";
    }

    if (!expiryDate) {
      newErrors.expiryDate = "Expiry date is required.";
    } else if (new Date(expiryDate) <= new Date()) {
      newErrors.expiryDate = "Expiry date must be in the future.";
    }
    
    if (!locationName.trim()) newErrors.locationName = "Location is required.";

    if (!category) newErrors.category = "Category is required.";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if no errors
  };
const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    clearError();

    
    // Basic validation
    if (!cultPassType || !originalPrice || !askingPrice || !expiryDate || !locationName) {
      setMessage('Please fill in all required fields.');
      setIsError(true);
      return;
    }

    const isValid = validateForm();
    if (!isValid) {
      return; // Stop submission if form is not valid
    } 

    try {
      const successMessage = await createListing({
        cultPassType,
        originalPrice: parseFloat(originalPrice),
        askingPrice: parseFloat(askingPrice),
        expiryDate,
        locationName,
        category, 
        description,
        availableCredits: availableCredits ? parseInt(availableCredits, 10) : undefined,
        adImageBase64: adImageBase64 || undefined,
      });
      
      alert(successMessage); // Simple success feedback
      navigate('/dashboard'); // Redirect to seller dashboard on success
    } catch (err: any) {
      setMessage(err.message || 'An unexpected error occurred.');
      setIsError(true);
    }
  };

const handleNumericInput = (setter: React.Dispatch<React.SetStateAction<string>>, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, ''); // Allow only digits
    setter(numericValue);
  };

  return (
    <div className="container mx-auto max-w-2xl py-8">
      <h1 className="text-3xl font-bold mb-6 text-center">Create a New Listing</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-neutral-900 p-8 rounded-lg shadow-md border">
        {message && (
          <div className={`p-3 text-sm rounded border ${isError ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
            {message}
          </div>
        )}

        {/* Image Upload */}
        <div>
          <Label>Listing Image (Optional)</Label>
          <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="mx-auto h-48 w-auto object-contain" />
            ) : (
              <div className="text-center">
                <ImagePlus className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4 flex text-sm leading-6 text-green-600">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md bg-white font-semibold text-primary focus-within:outline-none focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 hover:text-primary-dark ">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp" />
                  </label>
                  <p className="pl-1 text-gray-600">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-gray-500">PNG, JPG, WEBP up to 10MB</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
            <Label htmlFor="cultPassType">Pass / Ticket Name</Label>
            <Input id="cultPassType" value={cultPassType} onChange={(e) => setCultPassType(e.target.value)} placeholder="e.g., CultPass ELITE - 6 Months" />
            {errors.cultPassType && <p className="text-sm text-red-500 mt-1">{errors.cultPassType}</p>}
          </div>
          <div>
                <Label htmlFor="category">Category</Label>
                <Select onValueChange={setCategory} value={category}>
                    <SelectTrigger className="w-full mt-1"><SelectValue placeholder="Select a category..." /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="GYM_FITNESS">Gym & Fitness</SelectItem>
                        <SelectItem value="EVENT_TICKET">Event Tickets</SelectItem>
                        <SelectItem value="COUPON_VOUCHER">Coupons & Vouchers</SelectItem>
                    </SelectContent>
                </Select>
                  {errors.category && <p className="text-sm text-red-500 mt-1">{errors.category}</p>}
            </div>

            <div className="md:col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Provide details about your pass, like included benefits, transfer process, how to redeem a coupon, etc."
                      required 
                      className="mt-1 min-h-[120px]"
                  />
                  {/* Add your errors.description logic here if needed */}
            </div>
          <div>
            <Label htmlFor="originalPrice">Original Price (₹)</Label>
            <Input id="originalPrice" type="text" inputMode="numeric" value={originalPrice} onChange={(e) => handleNumericInput(setOriginalPrice, e.target.value)} placeholder="e.g., 15000" />
            {errors.originalPrice && <p className="text-sm text-red-500 mt-1">{errors.originalPrice}</p>}
          </div>
          <div>
            <Label htmlFor="askingPrice">Your Asking Price (₹)</Label>
            <Input id="askingPrice" type="text" inputMode="numeric" value={askingPrice} onChange={(e) => handleNumericInput(setAskingPrice, e.target.value)} placeholder="e.g., 12000" />
            {errors.askingPrice && <p className="text-sm text-red-500 mt-1">{errors.askingPrice}</p>}
          </div>
          <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                  {errors.expiryDate && <p className="text-sm text-red-500 mt-1">{errors.expiryDate}</p>}
            
          </div>
          <div>
            <Label htmlFor="availableCredits">Available Credits (Optional)</Label>
            <Input id="availableCredits" type="text" inputMode="numeric" value={availableCredits} onChange={(e) => handleNumericInput(setAvailableCredits, e.target.value)} placeholder="e.g., 50" />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="locationName">Location / City</Label>
            <Input id="locationName" value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g., Bengaluru" />
            {errors.locationName && <p className="text-sm text-red-500 mt-1">{errors.locationName}</p>}
          </div>
        </div>
       
        <Button type="submit" className="border" disabled={loading}>
          {loading ? 'Submitting Listing...' : 'Create Listing'}
        </Button>
      </form>
    </div>
  );
};

export default CreateListingPage;