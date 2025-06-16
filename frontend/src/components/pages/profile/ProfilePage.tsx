// frontend/src/pages/profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api'; // To fetch reviews
import StarRating from '@/components/ui/StarRating'; //Our star component
import { Avatar } from 'antd'; // For reviewer avatars
import { UserOutlined } from '@ant-design/icons';

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

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading: authLoadingGlobal, updateProfile, error: authErrorFromContext, clearError, switchUserRole: switchUserRoleInContext,requestOtp /*setUser : setUserInContext*/ } = useAuth();
  
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('');
  // const [profilePictureUrl, setProfilePictureUrl] = useState(''); 
//to implement file upload feature
  const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState<boolean>(false); 

  const [message, setMessage] = useState<string | null>(null); // Unified message state
  const [isError, setIsError] = useState<boolean>(false);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  // Effect to fetch reviews for the current user
  useEffect(() => {
    if (user?._id) {
      const fetchReviews = async () => {
        setReviewsLoading(true);
        try {
          const res = await api.get(`/reviews/user/${user._id}`);
          setReviews(res.data || []);
        } catch (err) {
          console.error("Failed to fetch reviews:", err);
        } finally {
          setReviewsLoading(false);
        }
      };
      fetchReviews();
    }
  }, [user?._id]);
  // Effect to initialize form fields from user context
  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setMobileNumber(user.mobileNumber || '');
      setCity(user.city || ''); // User object in AuthContext should have city directly
      // setProfilePictureUrl(user.profilePictureUrl || '');
      // Clear previous action messages when user data changes (e.g., after successful update from context)
      setMessage(null); 
      setIsError(false);
      clearError();
    }
  }, [user, clearError]);

  // Effect to display errors coming from AuthContext (e.g., from a failed API call in AuthContext)
  useEffect(() => {
    if (authErrorFromContext) {
      setMessage(authErrorFromContext);
      setIsError(true);
      // clearError(); // Clear immediately after displaying, or let user dismiss
    }
  }, [authErrorFromContext]);

  const handleEditToggle = () => {
    if (!isEditing && user) { // Entering edit mode
        // Reset form fields to current user state from context
        setUsername(user.username || '');
        setMobileNumber(user.mobileNumber || '');
        setCity(user.city || '');
        // setProfilePictureUrl(user.profilePictureUrl || '');
    }
    setIsEditing(!isEditing);
    setMessage(null); // Clear messages when toggling edit mode
    setIsError(false);
    clearError(); // Clear global auth error
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); setIsError(false); clearError();
    setProfileUpdateLoading(true);

    const profileData: { username?: string; mobileNumber?: string; city?: string; } = {};
    
    if (username !== (user?.username || '')) profileData.username = username;
    // Send mobile number if it's changed OR if it's empty and was previously set (to clear it)
    if (mobileNumber !== (user?.mobileNumber || '')) {
      profileData.mobileNumber = mobileNumber; // Backend will normalize
    }
    if (city !== (user?.city || '')) profileData.city = city;
    if (mobileNumber === '' && user?.mobileNumber) profileData.mobileNumber = '';

    if (Object.keys(profileData).length === 0) {
      setMessage('No changes to save.'); setIsError(false);
      setIsEditing(false);
      setProfileUpdateLoading(false);
      return;
    }

    try {
      const successMessage = await updateProfile(profileData); // This updates user in AuthContext
      setMessage(successMessage || 'Profile updated successfully!');
      setIsError(false);
      setIsEditing(false);
    } catch (err: unknown) {
      // AuthContext's updateProfile re-throws error, handleApiError sets authErrorFromContext
      // The useEffect for authErrorFromContext will display it.
      // If direct display is needed:
      setMessage((err as Error).message || 'Failed to update profile.');
      setIsError(true);
      // Error is already set by useAuth hook if handleApiError is used correctly
    } finally {
      setProfileUpdateLoading(false); // CRITICAL: Reset local loading state
    }
  };

  const handleSwitchRole = async (newRole: 'buyer' | 'seller') => {
    setMessage(null); setIsError(false); clearError();
    setRoleChangeLoading(true);

    if (newRole === 'seller') {
      if (!user?.mobileNumber) {
        setMessage('Please add and save a mobile number to your profile first.');
        setIsError(true); setRoleChangeLoading(false); setIsEditing(true); return;
      }
      if (!user?.isMobileVerified) {
        setMessage('Please verify your mobile number first. (OTP for mobile verification TBD)');
        setIsError(true); setRoleChangeLoading(false); return;
      }
    }

    try {
      const successMessage = await switchUserRoleInContext(newRole); // This updates user in AuthContext
      setMessage(successMessage);
      setIsError(false);
    } catch (err) {
      // Error handled by useEffect for authErrorFromContext or set directly
      setMessage((err as Error).message || 'Role change request failed.');
      setIsError(true);
    } finally {
      setRoleChangeLoading(false); // CRITICAL: Reset local loading state
    }
  };

   const handleRequestMobileOtp = async () => {
    if (!user?.email) {
      setMessage('User email not found. Cannot request OTP.');
      setIsError(true);
      return;
    }
    setMessage(null); setIsError(false); clearError();
    setOtpRequestLoading(true);
    try {
      const message = await requestOtp(user.email, 'mobile'); // Call the context function with type 'mobile'
      alert(message); // Let user know OTP was sent
      // Navigate to OTP page, passing necessary state
      navigate('/verify-otp', {
        state: {
          email: user.email,
          purpose: 'verification', // For mobile verification
          type: 'mobile'
        }
      });
    } catch (err) {
      setMessage((err as Error).message || 'Failed to send OTP to mobile.');
      setIsError(true);
    } finally {
      setOtpRequestLoading(false);
    }
  };

  if (authLoadingGlobal && !user) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><p>Loading profile...</p></div>;
  }
  if (!user) {
    return <div className="flex items-center justify-center min-h-[calc(100vh-80px)]"><h2 className="text-xl font-bold text-red-500">User not found. Please log in.</h2></div>;
  }
  
  const defaultProfilePicture = '/sharing.svg';

 return (
   <div className="bg-neutral-900 min-h-screen text-white">
    <div className="container mx-auto p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-black border border-neutral-800 rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-6 text-white text-center">
              {isEditing ? "Edit Profile" : "My Profile"}
            </h2>
            {/* ... rest of the profile card ... */}
             {message && (
              <div className={`p-3 text-sm rounded border mb-4 ${isError ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-green-900/50 border-green-700 text-green-300'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-center mb-4">
              <img src={user.profilePictureUrl || defaultProfilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
            </div>

            {isEditing ? (
              <form onSubmit={handleProfileSave} className="space-y-4">
                {/* ... Edit form is unchanged ... */}
                 <div><Label htmlFor="username">Username</Label><Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></div>
                 <div><Label htmlFor="email">Email (cannot be changed)</Label><Input id="email" value={user.email} readOnly disabled /></div>
                 <div><Label htmlFor="mobileNumber">Mobile Number</Label><Input id="mobileNumber" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} placeholder="10-digit number" /></div>
                 <div><Label htmlFor="city">City</Label><Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" /></div>
                 <div className="flex justify-end gap-2 mt-4"><Button type="button" variant="secondary" onClick={handleEditToggle}>Cancel</Button><Button type="submit" disabled={profileUpdateLoading}>Save Changes</Button></div>
              </form>
            ) : (
              <div className="space-y-3">
                 {/* ... View mode is unchanged ... */}
                <div><span className="font-semibold text-neutral-400">Username:</span> {user.username || 'N/A'}</div>
                <div><span className="font-semibold text-neutral-400">Email:</span> {user.email} {user.isEmailVerified && <span className="text-green-400 text-xs">(Verified)</span>}</div>
                <div className="flex items-center justify-between"><div><span className="font-semibold text-neutral-400">Mobile:</span> {user.mobileNumber || 'N/A'} {user.mobileNumber && (user.isMobileVerified ? <span className="text-green-400 text-xs">(Verified)</span> : <span className="text-red-400 text-xs">(Not Verified)</span>)}</div>{user.mobileNumber && !user.isMobileVerified && (<Button size="sm" variant="link" onClick={handleRequestMobileOtp} disabled={otpRequestLoading}>Verify</Button>)}</div>
                <div><span className="font-semibold text-neutral-400">Role:</span> <span className="capitalize">{user.role}</span></div>
                <div><span className="font-semibold text-neutral-400">City:</span> {user.city || 'N/A'}</div>
                <div className="pt-4 space-y-2"><Button variant="outline" className="w-full" onClick={() => navigate('/change-password')}>Change Password</Button><Button className="w-full" onClick={handleEditToggle}>Edit Profile</Button></div>
              </div>
            )}
          </div>
           {/* Role Change Section */}
           {!isEditing && user.role !== 'admin' && (
                <div className="bg-black border border-neutral-800 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-3">Switch Account Type</h3>
                    {user.role === 'buyer' ? (
                        <div>
                            <p className="text-sm text-neutral-400 mb-3">Become a seller to list your own passes.</p>
                            <Button className="w-full" onClick={() => handleSwitchRole('seller')} disabled={roleChangeLoading || authLoadingGlobal}>Switch to Seller</Button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-sm text-neutral-400 mb-3">Switch back to a buyer account.</p>
                            <Button className="w-full" variant="secondary" onClick={() => handleSwitchRole('buyer')} disabled={roleChangeLoading || authLoadingGlobal}>Switch to Buyer</Button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Right Column: Reputation & Reviews */}
        <div className="lg:col-span-2">
            {/* NEW: Reputation Summary */}
            <div className="bg-black border border-neutral-800 rounded-lg p-6 mb-8">
                <h3 className="text-2xl font-bold mb-4">Your Reputation</h3>
                <div className="flex items-center space-x-4">
                    <StarRating rating={user.averageRating || 0} size={28} />
                    <div className="text-neutral-300">
                        <span className="font-bold text-white text-xl">{(user.averageRating || 0).toFixed(1)}</span>
                        <span className="ml-1">out of 5</span>
                    </div>
                    <div className="text-neutral-400 text-lg">
                        ({user.reviewCount || 0} reviews)
                    </div>
                </div>
            </div>

            {/* NEW: Reviews List */}
            <div className="bg-black border border-neutral-800 rounded-lg p-6">
                <h3 className="text-2xl font-bold mb-6">What Others Are Saying</h3>
                {reviewsLoading ? (
                    <p className="text-neutral-400">Loading reviews...</p>
                ) : reviews.length > 0 ? (
                    <div className="space-y-6">
                        {reviews.map(review => (
                            <div key={review._id} className="border-b border-neutral-800 pb-6 last:border-b-0 last:pb-0">
                                <div className="flex items-center mb-2">
                                    <Avatar src={review.reviewer.profilePictureUrl} icon={<UserOutlined />} size={40} />
                                    <div className="ml-4">
                                        <p className="font-semibold text-white">{review.reviewer.username}</p>
                                        <p className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <StarRating rating={review.rating} size={16} className="my-2" />
                                <p className="text-neutral-300">{review.comment}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-neutral-400">You have not received any reviews yet.</p>
                )}
            </div>
        </div>
      </div>
    </div>
   </div>
  );
};

export default ProfilePage;
