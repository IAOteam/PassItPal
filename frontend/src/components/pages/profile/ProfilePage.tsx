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
import { EditIcon, FileEditIcon } from 'lucide-react';

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
  const {
    user,
    loading: authLoadingGlobal,
    updateProfile,
    error: authErrorFromContext,
    clearError,
    switchUserRole: switchUserRoleInContext,
    requestOtp,
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [city, setCity] = useState('');
  const [profileUpdateLoading, setProfileUpdateLoading] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  const [otpRequestLoading, setOtpRequestLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [newProfilePic, setNewProfilePic] = useState<File | null>(null);

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

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      setMobileNumber(user.mobileNumber || '');
      setCity(user.city || '');
      setMessage(null);
      setIsError(false);
      clearError();
    }
  }, [user, clearError]);

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
    clearError();
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setNewProfilePic(e.target.files[0]);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setIsError(false);
    clearError();
    setProfileUpdateLoading(true);
    
    const profileData: { username?: string; mobileNumber?: string; city?: string } = {};
    let profilePictureBase64: string | undefined;
    if (username !== user?.username) profileData.username = username;
    if (mobileNumber !== user?.mobileNumber) profileData.mobileNumber = mobileNumber;
    if (city !== user?.city) profileData.city = city;

    const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
    });

    if (newProfilePic) {
        profilePictureBase64 = await toBase64(newProfilePic); // toBase64 is a helper you'll create
    }
    await updateProfile({ ...profileData, profilePictureBase64 });
    
    if (Object.keys(profileData).length === 0) {
      setMessage('No changes to save.');
      setIsError(false);
      setIsEditing(false);
      setProfileUpdateLoading(false);
      return;
    }

    try {
      const successMessage = await updateProfile(profileData);
      setMessage(successMessage || 'Profile updated successfully!');
      setIsError(false);
      setIsEditing(false);
    } catch (err: any) {
      setMessage(err.message || 'Failed to update profile.');
      setIsError(true);
    } finally {
      setProfileUpdateLoading(false);
    }
  };

  const handleSwitchRole = async (newRole: 'buyer' | 'seller') => {
    setMessage(null);
    setIsError(false);
    clearError();
    setRoleChangeLoading(true);

    if (newRole === 'seller') {
      if (!user?.mobileNumber) {
        setMessage('Please add and save a mobile number first.');
        setIsError(true);
        setRoleChangeLoading(false);
        setIsEditing(true);
        return;
      }
      if (!user?.isMobileVerified) {
        setMessage('Please verify your mobile number first.');
        setIsError(true);
        setRoleChangeLoading(false);
        return;
      }
    }

    try {
      const successMessage = await switchUserRoleInContext(newRole);
      setMessage(successMessage);
      setIsError(false);
    } catch (err: any) {
      setMessage(err.message || 'Failed to switch role.');
      setIsError(true);
    } finally {
      setRoleChangeLoading(false);
    }
  };

  const handleRequestMobileOtp = async () => {
    if (!user?.email) {
      setMessage('User email not found. Cannot request OTP.');
      setIsError(true);
      return;
    }
    setMessage(null);
    setIsError(false);
    clearError();
    setOtpRequestLoading(true);
    try {
      const message = await requestOtp(user.email, 'mobile');
      alert(message);
      navigate('/verify-otp', {
        state: {
          email: user.email,
          purpose: 'verification',
          type: 'mobile',
        },
      });
    } catch (err: any) {
      setMessage(err.message || 'Failed to send OTP.');
      setIsError(true);
    } finally {
      setOtpRequestLoading(false);
    }
  };

  if (authLoadingGlobal && !user) {
    return <div className="flex items-center justify-center min-h-screen">Loading profile...</div>;
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-screen text-red-600 text-xl">User not found. Please log in.</div>;
  }

  const defaultProfilePicture = '/sharing.svg';

  return (
    <div className="min-h-screen bg-white text-black dark:bg-neutral-950 dark:text-white transition-colors duration-300">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="col-span-1 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 text-center">{isEditing ? "Edit Profile" : "My Profile"}</h2>

              {message && (
                <div className={`p-3 text-sm rounded border mb-4 ${isError
                  ? 'bg-red-100 text-red-700 border-red-400 dark:bg-red-900 dark:text-red-300 dark:border-red-700'
                  : 'bg-green-100 text-green-700 border-green-400 dark:bg-green-900 dark:text-green-300 dark:border-green-700'
                  }`}>
                  {message}
                </div>
              )}

              <div className="flex justify-center mb-4">
                <img
                  src={user.profilePictureUrl || defaultProfilePicture}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-primary"
                />
              </div>

              {isEditing ? (
                <>
                  <label htmlFor="picture-upload" className="absolute ... cursor-pointer">
                      <FileEditIcon/>
                  </label>
                  <input id="picture-upload" type="file" className="hidden" onChange={handlePictureChange} accept="image/*" />
    
                  <form onSubmit={handleProfileSave} className="space-y-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input id="username" className="w-full" value={username} onChange={(e) => setUsername(e.target.value)} required />
                    </div>
                    <div>
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" className="w-full" value={user.email} readOnly disabled />
                    </div>
                    <div>
                      <Label htmlFor="mobile">Mobile Number</Label>
                      <Input id="mobile" className="w-full" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input id="city" className="w-full" value={city} onChange={(e) => setCity(e.target.value)} />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="secondary" type="button" onClick={handleEditToggle}>Cancel</Button>
                      <Button type="submit" disabled={profileUpdateLoading}>Save</Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="space-y-3 break-words">
                  <div><span className="font-medium text-neutral-500">Username:</span> {user.username}</div>
                  <div><span className="font-medium text-neutral-500">Email:</span> {user.email} {user.isEmailVerified && <span className="text-green-500 text-sm">(Verified)</span>}</div>
                  <div className="flex justify-between items-center">
                    <div><span className="font-medium text-neutral-500">Mobile:</span> {user.mobileNumber || 'N/A'} {user.mobileNumber && (user.isMobileVerified ? <span className="text-green-500 text-sm">(Verified)</span> : <span className="text-red-500 text-sm">(Not Verified)</span>)}</div>
                    {user.mobileNumber && !user.isMobileVerified && (
                      <Button size="sm" variant="link" onClick={handleRequestMobileOtp} disabled={otpRequestLoading}>Verify</Button>
                    )}
                  </div>
                  <div><span className="font-medium text-neutral-500">Role:</span> {user.role}</div>
                  <div><span className="font-medium text-neutral-500">City:</span> {user.city || 'N/A'}</div>
                  <div className="pt-4 space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => navigate('/change-password')}>Change Password</Button>
                    <Button className="w-full" onClick={handleEditToggle}>Edit Profile</Button>
                  </div>
                </div>
              )}
            </div>

            {/* Role Switch */}
            {!isEditing && user.role !== 'admin' && (
              <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-3">Switch Role</h3>
                {user.role === 'buyer' ? (
                  <>
                    <p className="text-sm text-neutral-500 mb-3">Become a seller to list your own passes.</p>
                    <Button className="w-full" onClick={() => handleSwitchRole('seller')} disabled={roleChangeLoading}>Switch to Seller</Button>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-500 mb-3">Switch back to buyer mode.</p>
                    <Button className="w-full" variant="secondary" onClick={() => handleSwitchRole('buyer')} disabled={roleChangeLoading}>Switch to Buyer</Button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Reviews and Ratings */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-2xl font-bold mb-4">Your Reputation</h3>
              <div className="flex items-center space-x-4">
                <StarRating rating={user.averageRating || 0} size={28} />
                <div>
                  <div className="text-xl font-bold">{(user.averageRating || 0).toFixed(1)}</div>
                  <div className="text-neutral-500 dark:text-neutral-400">{user.reviewCount || 0} reviews</div>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-2xl font-bold mb-6">What Others Are Saying</h3>
              {reviewsLoading ? (
                <p className="text-neutral-500">Loading reviews...</p>
              ) : reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b border-neutral-200 dark:border-neutral-800 pb-6 last:border-b-0 last:pb-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <Avatar src={review.reviewer.profilePictureUrl} icon={<UserOutlined />} size={40} />
                        <div>
                          <p className="font-semibold">{review.reviewer.username}</p>
                          <p className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <StarRating rating={review.rating} size={16} className="mb-2" />
                      <p className="text-neutral-700 dark:text-neutral-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-500">No reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
