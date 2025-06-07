// frontend/src/pages/profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth'; 
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';


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
   <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
        {isEditing ? "Edit Your Profile" : "Your Profile"}
      </h2>
      <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg space-y-4">
        {message && (
          <div className={`p-3 text-sm rounded border ${isError ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
            {message}
          </div>
        )}

        <div className="flex justify-center mb-4">
          <img src={user.profilePictureUrl || defaultProfilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-2 border-primary" />
        </div>

        {isEditing ? (
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email (cannot be changed)</Label>
              <Input id="email" type="email" value={user.email} readOnly disabled className="bg-gray-100 dark:bg-neutral-800" />
            </div>
            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input 
                id="mobileNumber" 
                type="tel" 
                value={mobileNumber} 
                onChange={(e) => setMobileNumber(e.target.value)} 
                placeholder="10-digit number (e.g. 98...)"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" />
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={handleEditToggle}>Cancel</Button>
              <Button type="submit" disabled={profileUpdateLoading || authLoadingGlobal}>
                {profileUpdateLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          
            <div className="space-y-2 text-gray-800 dark:text-gray-200">
            <div><span className="font-semibold">Username:</span> {user.username || 'N/A'}</div>
            <div><span className="font-semibold">Email:</span> {user.email} {user.isEmailVerified && <span className="text-green-500 text-sm">(Verified)</span>}</div>
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Mobile Number:</span> {user.mobileNumber || 'N/A'}{' '}
                {user.mobileNumber && (user.isMobileVerified ? <span className="text-green-500 text-sm">(Verified)</span> : <span className="text-red-500 text-sm">(Not Verified)</span>)}
              </div>
              {user.mobileNumber && !user.isMobileVerified && (
                <Button size="sm" variant="link" onClick={handleRequestMobileOtp} disabled={otpRequestLoading} className="p-0 h-auto text-sm">
                  {otpRequestLoading ? 'Sending...' : 'Verify Now'}
                </Button>
              )}
            </div>
            <div><span className="font-semibold">Role:</span> <span className="capitalize">{user.role}</span></div>
            <div><span className="font-semibold">City:</span> {user.city || 'N/A'}</div>
            
            <div className="pt-4 space-y-2">
              <Button className="w-full" onClick={() => navigate('/change-password')}>Change Password</Button>
              <Button className="w-full" onClick={handleEditToggle}>Edit Profile</Button>
            </div>
          </div>
          
        )}

        {/* Role Change Section - unchanged */}
        {!isEditing && user.role !== 'admin' && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-neutral-700">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800 dark:text-gray-200">Switch Account Type</h3>
                    {user.role === 'buyer' ? (
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Become a seller to list your own passes.</p>
                            <Button 
                                className="w-full" 
                                onClick={() => handleSwitchRole('seller')}
                                disabled={roleChangeLoading || authLoadingGlobal}
                            >
                                {roleChangeLoading ? 'Switching...' : 'Switch to Seller Account'}
                            </Button>
                        </div>
                    ) : ( // user.role === 'seller'
                        <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Switch back to a buyer account. You won't be able to manage your listings.</p>
                            <Button 
                                className="w-full" 
                                variant="outline"
                                onClick={() => handleSwitchRole('buyer')}
                                disabled={roleChangeLoading || authLoadingGlobal}
                            >
                                {roleChangeLoading ? 'Switching...' : 'Switch to Buyer Account'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
      </div>
    </div>
  );
};

export default ProfilePage;
