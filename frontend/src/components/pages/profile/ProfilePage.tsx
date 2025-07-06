// frontend/src/pages/profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge"
import api from '@/lib/api'; // To fetch reviews
import { toBase64 } from '@/lib/utils'
import StarRating from '@/components/ui/StarRating'; //Our star component
import { Avatar } from 'antd'; // For reviewer avatars
import { UserOutlined } from '@ant-design/icons';
import { Mail, Phone, MapPin, Edit3, Save, X, Shield, Settings, ChevronRight, XCircle, CheckCircle2 } from 'lucide-react';


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
  const { user, loading: authLoadingGlobal, updateProfile, error: authErrorFromContext, clearError, switchUserRole: switchUserRoleInContext, requestOtp /*setUser : setUserInContext*/ } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('');
  // const [profilePictureUrl, setProfilePictureUrl] = useState(''); 
  //to implement file upload feature
  const [profileUpdateLoading, setProfileUpdateLoading] = useState<boolean>(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState<boolean>(false);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);
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

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewProfilePic(e.target.files[0]);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null); setIsError(false); clearError();
    setProfileUpdateLoading(true);

    const profileData: { username?: string; mobileNumber?: string; city?: string; } = {};

    let profilePictureBase64: string | undefined;
    if (newProfilePic) {
        profilePictureBase64 = await toBase64(newProfilePic); // toBase64 is a helper you'll create
    }
    await updateProfile({ ...profileData, profilePictureBase64 });

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

  const [activeTab, setActiveTab] = useState<'profile'>('profile');


  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-1/4 p-6 pt-20 bg-white dark:bg-neutral-900 dark:text-white">

        {/* Tab Navigation */}
        <nav className="space-y-2">
          <Button
            className="w-full justify-between bg-neutral-200 dark:bg-neutral-800"

            onClick={() => setActiveTab('profile')}
          >
            My Profile
            <ChevronRight />
          </Button>

          <Button
            className="w-full justify-between"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
            <ChevronRight />
          </Button>

          <Button
            className="w-full justify-between"
            onClick={() => navigate('/change-password')}
          >
            Change Password
            <ChevronRight />
          </Button>

          {user.role !== 'admin' && (
            <div>
              {user.role === 'buyer' ? (
                <>
                  <Button
                    className="w-full justify-between"
                    onClick={() => handleSwitchRole('seller')}
                    disabled={roleChangeLoading || authLoadingGlobal}>
                    Switch to Seller
                    <ChevronRight />
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    className="w-full justify-between"
                    onClick={() => handleSwitchRole('buyer')}
                    disabled={roleChangeLoading || authLoadingGlobal}
                  >
                    Switch to Buyer
                    <ChevronRight />
                  </Button>
                </>
              )}
            </div>
          )}
        </nav>

      </aside>

      {/* Right Content */}
      <main className="w-3/4 p-10 pt-20 bg-neutral-300 dark:bg-neutral-800">
        {activeTab === 'profile' && (
          <>
            <div className="p-6 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow-lg dark:text-white">

              {message && (
                <div className={`p-3 text-sm rounded border mb-4 ${isError ? 'bg-red-900/50 border-red-700 text-red-300' : 'bg-green-900/50 border-green-700 text-green-300'}`}>
                  {message}
                </div>
              )}

              {isEditing ? (

                <form onSubmit={handleProfileSave} className=" space-y-6  ">
                  <div>
                    <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
                      <Edit3 className="w-5 h-5" />
                      Edit Profile
                    </h2>
                  </div>
                  <label htmlFor="picture-upload" className="absolute ... cursor-pointer">
                      {/* Edit Icon */}
                  </label>
                  <input id="picture-upload" type="file" className="hidden" onChange={handlePictureChange} accept="image/*" />
                  {/* Grid layout for fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className='space-y-2'>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor="email">Email (cannot be changed)</Label>
                      <Input
                        id="email"
                        value={user.email}
                        readOnly
                        disabled
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor="mobileNumber">Mobile Number</Label>
                      <Input
                        id="mobileNumber"
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value)}
                        placeholder="10-digit number"
                      />
                    </div>

                    <div className='space-y-2'>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Your city"
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="outline" onClick={handleEditToggle}>
                      Cancel
                    </Button>
                    <Button className='bg-black dark:bg-white text-white dark:text-black' type="submit" disabled={profileUpdateLoading}>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </Button>
                  </div>
                </form>


              ) :

                (

                  <div className="flex flex-col md:flex-row justify-center md:items-start gap-20">
                    <div className="relative">
                      <img
                        src={user.profilePictureUrl || defaultProfilePicture}
                        alt="Profile"
                        className="w-28 h-28 rounded-full object-cover border-4 border-blue-500 shadow-md"
                      />
                      <div className="absolute -bottom-2 -right-2 bg-green-500 rounded-full p-2">
                        <Shield className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div>
                      <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                          <h1 className="text-3xl font-bold">{user.username}</h1>
                          <div className="flex items-center gap-2">
                            <Badge  className="capitalize bg-neutral-300 dark:bg-neutral-800">
                              {user.role}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-3 text-muted-foreground">
                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <Mail className="w-4 h-4" />
                            <span>{user.email}</span>
                             <span title={user.isEmailVerified ? "Verified" : "Not Verified"}></span>
                                                    <span>
                              {user.isEmailVerified ? (
                                <CheckCircle2
                                  className="w-4 h-4 text-green-600"
                                  
                                />
                              ) : (
                                <XCircle
                                  className="w-4 h-4 text-red-600"
                                  
                                />
                              )}
                            </span>
                          </div>

                          <div className="flex items-center justify-center md:justify-start gap-2">
                              <Phone className="w-4 h-4" />
                              <span>{user.mobileNumber || "Not provided"}</span>
                                  {user.mobileNumber && (
                                    <span title={user.isMobileVerified ? "Verified" : "Not Verified"}>
                                      {user.isMobileVerified ? (
                                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <XCircle className="w-4 h-4 text-red-600" />
                                      )}
                                    </span>
                                  )}
                              
                              {/* Mobile verify button if unverified */}
                              {user.mobileNumber && !user.isMobileVerified && (
                                <Button
                                  className="ml-4 dark:text-white"
                                  size="sm"
                                  variant="link"
                                  onClick={handleRequestMobileOtp}
                                  disabled={otpRequestLoading}
                                >
                                  Verify
                                </Button>
                              )}
                            </div>

                          <div className="flex items-center justify-center md:justify-start gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{user.city || "Not specified"}</span>
                          </div>


                        </div>

                        <div className="mt-6 flex flex-col sm:flex-row justify-between gap-16">
                          <div className="flex items-center gap-4">
                            <StarRating rating={user.averageRating} size={20} />
                            <div>
                              <span className="font-bold text-xl">{(user.averageRating || 0).toFixed(1)}</span>
                              <span className="ml-1">out of 5</span>
                            </div>
                          </div>

                          <Button className='bg-black dark:bg-white text-white dark:text-black' onClick={handleEditToggle} variant={isEditing ? "outline" : "default"}>
                            {isEditing ? (
                              <>
                                <X className="w-4 h-4 mr-2" />
                                Cancel
                              </>
                            ) : (
                              <>
                                <Edit3 className="w-4 h-4 mr-2" />
                                Edit Profile
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>


            <div className='mt-10'>
              <div className='flex items-center space-x-4'>
                <h3 className="text-2xl font-bold dark:text-white">Reviews</h3>
                <p className="dark:text-neutral-300 text-lg">({user.reviewCount || 0} reviews)</p>
              </div>
              {reviewsLoading ? (
                <p className="text-neutral-400">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-4">
                  {reviews.map((review: any) => (
                    <div key={review._id}>
                      <div className="mt-6 p-6 bg-neutral-100 dark:bg-neutral-700 rounded-lg shadow-lg dark:text-white">
                        <div className="flex items-start gap-4">
                          <Avatar src={review.reviewer.profilePictureUrl} icon={<UserOutlined />} size={40} />

                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-semibold">{review.reviewer.username}</h4>
                              <span className="text-sm text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                            </div>

                            <StarRating rating={review.rating} size={16} />

                            <p className="mt-2 text-muted-foreground">{review.comment}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">You have not received any reviews yet.</p>
              )}
            </div>

          </>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;