// frontend/src/pages/profile/ProfilePage.tsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Mail, Phone, MapPin, Edit, Save, X, FileEditIcon } from 'lucide-react';

interface IReview {
  _id: string;
  rating: number;
  comment?: string;
  reviewer: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
}

// Helper function to convert a file to a base64 string
const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoadingGlobal, updateProfile, error: authErrorFromContext, clearError, switchUserRole, requestOtp } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('');
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState<boolean>(false);

  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState<boolean>(false);

  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Effect to fetch reviews for the current user
  useEffect(() => {
    if (user?._id) {
      setReviewsLoading(true);
      api.get(`/reviews/user/${user._id}`)
        .then(res => setReviews(res.data || []))
        .catch(err => console.error("Failed to fetch reviews:", err))
        .finally(() => setReviewsLoading(false));
    }
  }, [user?._id]);

  // Effect to initialize or reset form fields from user context
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setMobileNumber(user.mobileNumber || '');
      setCity(user.city || '');
      setPreviewUrl(user.profilePictureUrl || null);
    }
    clearError();
  }, [user, clearError, isEditing]); // Reset form when entering edit mode

  // Effect to display errors from AuthContext
  useEffect(() => {
    if (authErrorFromContext) {
      setMessage(authErrorFromContext);
      setIsError(true);
    }
  }, [authErrorFromContext]);

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    setMessage(null);
    setIsError(false);
    setNewProfilePic(null); // Clear any staged photo on cancel
  };
  
  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProfilePic(file);
      setPreviewUrl(URL.createObjectURL(file)); // Create a temporary URL for preview
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    setProfileUpdateLoading(true);

    const profileData: { username?: string; mobileNumber?: string; city?: string; profilePictureBase64?: string } = {};

    if (username !== user?.username) profileData.username = username;
    if (mobileNumber !== user?.mobileNumber) profileData.mobileNumber = mobileNumber;
    if (city !== user?.city) profileData.city = city;
    if (newProfilePic) {
        profileData.profilePictureBase64 = await toBase64(newProfilePic);
    }

    if (Object.keys(profileData).length === 0) {
      setMessage('No changes to save.');
      setIsEditing(false);
      setProfileUpdateLoading(false);
      return;
    }

    try {
      const successMessage = await updateProfile(profileData);
      setMessage(successMessage || 'Profile updated successfully!');
      setIsError(false);
      setIsEditing(false);
      setNewProfilePic(null);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile.');
      setIsError(true);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  // ... handleSwitchRole and handleRequestMobileOtp functions remain the same as your 'main' branch ...

  if (authLoadingGlobal && !user) return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  if (!user) return <div className="flex items-center justify-center min-h-screen text-red-600 text-xl">User not found. Please log in.</div>;
  
  const defaultProfilePicture = '/sharing.svg';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-black dark:text-white">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- MERGED: Left Column for Interactive Profile Card --- */}
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-6 shadow-lg">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">{isEditing ? "Edit Profile" : "My Profile"}</h2>
                <Button variant="ghost" size="icon" onClick={handleEditToggle} className="text-muted-foreground">
                  {isEditing ? <X size={20} /> : <Edit size={20} />}
                </Button>
              </div>

              {message && (
                <div className={`p-3 text-sm rounded border mb-4 ${isError ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-green-900/50 border-green-700 text-green-300'}`}>
                  {message}
                </div>
              )}

              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <Avatar src={previewUrl || defaultProfilePicture} size={96} icon={<UserOutlined />} />
                  {isEditing && (
                    <label htmlFor="picture-upload" className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer hover:bg-primary/90 transition-colors">
                      <FileEditIcon size={16} />
                      <input id="picture-upload" type="file" className="hidden" onChange={handlePictureChange} accept="image/*" />
                    </label>
                  )}
                </div>
                {!isEditing && <h1 className="text-2xl font-bold">{user.username}</h1>}
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileSave} className="space-y-4 mt-4">
                  <div><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                  <div><Label htmlFor="mobileNumber">Mobile Number</Label><Input id="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="10-digit number" /></div>
                  <div><Label htmlFor="city">City</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" /></div>
                  <Button type="submit" className="w-full" disabled={profileUpdateLoading}>
                    <Save className="mr-2 h-4 w-4" /> {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-3 mt-4 text-center">
                  <p className="flex items-center justify-center gap-2 text-muted-foreground"><Mail size={16} /> {user.email} {user.isEmailVerified && <span className="text-green-500 text-xs">(Verified)</span>}</p>
                  <p className="flex items-center justify-center gap-2 text-muted-foreground"><Phone size={16} /> {user.mobileNumber || 'Not provided'}</p>
                  <p className="flex items-center justify-center gap-2 text-muted-foreground"><MapPin size={16} /> {user.city || 'Not specified'}</p>
                </div>
              )}
            </div>

            {/* --- MERGED: Separate Card for Account Actions --- */}
            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-6 shadow-lg space-y-2">
                <Button variant="ghost" className="w-full justify-start" onClick={() => navigate('/change-password')}>Change Password</Button>
                {user.role === 'buyer' ? (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>Switch to Seller</Button>
                ) : user.role === 'seller' && (
                    <Button variant="ghost" className="w-full justify-start" onClick={() => {}}>Switch to Buyer</Button>
                )}
            </div>
          </div>

          {/* --- MERGED: Right Column for Reputation and Reviews using UI Branch's style --- */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-4">Your Reputation</h3>
              <div className="flex items-center space-x-4">
                <StarRating rating={user.averageRating || 0} size={28} />
                <div>
                  <div className="text-xl font-bold">{(user.averageRating || 0).toFixed(1)} / 5.0</div>
                  <div className="text-muted-foreground">{user.reviewCount || 0} reviews</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border dark:border-neutral-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-2xl font-bold mb-6">What Others Are Saying</h3>
              {reviewsLoading ? <p className="text-muted-foreground">Loading reviews...</p> : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review._id} className="border-b dark:border-neutral-800 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Avatar src={review.reviewer.profilePictureUrl} icon={<UserOutlined />} size={40} />
                        <div>
                          <p className="font-semibold">{review.reviewer.username}</p>
                          <p className="text-xs text-muted-foreground">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={16} className="mb-2" />
                      <p className="text-neutral-700 dark:text-neutral-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : <p className="text-muted-foreground">No reviews yet.</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;