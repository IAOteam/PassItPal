import React, { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from 'react-query';
import api from '@/api/apiClient';
import { toast } from 'react-hot-toast';
import ListingLimitModal from '@/components/shared/ListingLimitModal';
import { GoogleMap, MarkerF } from '@react-google-maps/api';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Input
} from '@/components/ui/input';
import {
  Label
} from '@/components/ui/label';
import {
  Button
} from '@/components/ui/button';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Switch
} from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState('');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(
    null
  );
  const [negotiable, setNegotiable] = useState(false);

  // Preview toggle
  const [viewMode, setViewMode] = useState<'buyer' | 'seller'>('buyer');

  const { data: categories = [] } = useQuery('categories', fetchCategories);

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return;
    try {
      const created = await createNewCategory(newCategory.trim());
      toast.success('Category created successfully');
      queryClient.invalidateQueries('categories');
      setCategory(created._id);
      setNewCategory('');
    } catch (err) {
      toast.error('Failed to create category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/listings', {
        title,
        category,
        price,
        description,
        image,
        location,
        negotiable,
      });
      toast.success('Listing created successfully');
      navigate('/listings');
    } catch (err) {
      toast.error('Failed to create listing');
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      {/* Left Column - Form */}
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Create Listing</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Title */}
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter product title"
                className="mt-1"
                required
              />
            </div>

            {/* Category */}
            <div>
              <Label>Category</Label>
              <div className="flex gap-2 mt-1">
                <Select onValueChange={(val) => setCategory(val)} value={category}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Input
                  placeholder="New category name"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                />
                <Button
                  type="button"
                  onClick={handleCreateCategory}
                  variant="outline"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Price */}
            <div>
              <Label htmlFor="price">Price</Label>
              <Input
                id="price"
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Enter price"
                className="mt-1"
                required
              />
            </div>

            {/* Negotiable */}
            <div className="flex items-center gap-2">
              <Switch
                id="negotiable"
                checked={negotiable}
                onCheckedChange={setNegotiable}
              />
              <Label htmlFor="negotiable">Negotiable</Label>
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter product description"
                className="mt-1"
                required
              />
            </div>

            {/* Image */}
            <div>
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={image}
                onChange={(e) => setImage(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-1"
              />
            </div>

            {/* Location */}
            <div>
              <Label>Location</Label>
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                zoom={12}
                center={location || defaultCenter}
                onClick={(e) =>
                  setLocation({
                    lat: e.latLng?.lat() || defaultCenter.lat,
                    lng: e.latLng?.lng() || defaultCenter.lng,
                  })
                }
              >
                {location && <MarkerF position={location} />}
              </GoogleMap>
            </div>

            <Button type="submit" className="w-full">
              Create Listing
            </Button>
          </form>
        </CardContent>
      </Card>

       {/* Right Column - Live Preview */}
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={viewMode === "buyer" ? "default" : "outline"}
              onClick={() => setViewMode("buyer")}
            >
              Buyer View
            </Button>
            <Button
              size="sm"
              variant={viewMode === "seller" ? "default" : "outline"}
              onClick={() => setViewMode("seller")}
            >
              Seller View
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error Message */}
          {createListingMutation.isError && (
            <p className="text-red-500 text-sm mt-2">
              {String(createListingMutation.error)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateListingPage;
