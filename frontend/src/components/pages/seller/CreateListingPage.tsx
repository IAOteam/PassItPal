// src/pages/seller/CreateListingPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea'; // For description
import { useNavigate } from 'react-router-dom'; // To redirect after creation

const CreateListingPage: React.FC = () => {
  const { createListing, loading, error, clearError } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(''); // Use string for input, convert to number for API
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState('');
  // Add more state variables as per your Listing model fields
  // e.g., const [images, setImages] = useState<File[]>([]); for file uploads

  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isLocalError, setIsLocalError] = useState<boolean>(false);

  useEffect(() => {
    if (error) {
      setLocalMessage(error);
      setIsLocalError(true);
    } else {
      // Optionally clear local message if auth error clears and it was an error displayed by this useEffect
      // This prevents clearing form validation messages prematurely
      if (isLocalError && localMessage === error) {
         setLocalMessage(null);
         setIsLocalError(false);
      }
    }
  }, [error, isLocalError, localMessage]); 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setIsLocalError(false);
    clearError();

    // Basic validation
    if (!title || !description || !price || !category || !condition) {
      setLocalMessage('Please fill in all required fields.');
      setIsLocalError(true);
      return;
    }
    if (isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setLocalMessage('Price must be a positive number.');
      setIsLocalError(true);
      return;
    }

    try {
      const message = await createListing({
        title,
        description,
        price: parseFloat(price), // Convert to number for backend
        category,
        condition,
        // Add other fields from state here
      });
      setLocalMessage(message);
      setIsLocalError(false);
      // Clear form after successful submission
      setTitle('');
      setDescription('');
      setPrice('');
      setCategory('');
      setCondition('');
      // Redirect user or show a success message
      navigate('/dashboard', { state: { message: message } }); // Redirect to dashboard with message
    } catch (err: unknown) {
      setLocalMessage((err as Error).message || 'Failed to create listing.');
      setIsLocalError(true);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Create New Listing</h2>
      <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg space-y-4">
        {localMessage && (
          <div className={`p-3 text-sm rounded border ${isLocalError ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
            {localMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
                id="description"
                value={description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                required
            />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="category">Category</Label>
            <Input id="category" type="text" value={category} onChange={(e) => setCategory(e.target.value)} required />
          </div>
          <div>
            <Label htmlFor="condition">Condition</Label>
            <Input id="condition" type="text" value={condition} onChange={(e) => setCondition(e.target.value)} required />
          </div>
          {/* Add more input fields for other listing properties like images, etc. */}
          {/* For images, you might need a file input and handle base64 conversion */}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Creating...' : 'Create Listing'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateListingPage;