// src/pages/profile/ProfilePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext'; // To display current user info
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input'; 
import { Label } from '@/components/ui/label'; 

import { useNavigate } from 'react-router-dom';

// import { Textarea } from '@/components/ui/textarea'; // for a bio field later
// import { Checkbox } from '@/components/ui/checkbox';
const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, updateProfile, error, clearError } = useAuth(); 
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  // const [email, setEmail] = useState(user?.email || ''); // careful with email changes, they invalidate verification & Changing email typically requires re-verification (sending a new OTP, setting isEmailVerified to false). For a general profile edit, it's often better to handle email changes via a separate, dedicated "Change Email" flow. will make it .
  const [mobileNumber, setMobileNumber] = useState(user?.mobileNumber || '');
  const [city, setCity] = useState(user?.city || '');
  const [profilePictureUrl, setProfilePictureUrl] = useState(user?.profilePictureUrl || '');
  // If we implement base64 upload:
  // const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);
  // const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(user?.profilePictureUrl || null);
  

  const [localMessage, setLocalMessage] = useState<string | null>(null);
  const [isLocalError, setIsLocalError] = useState<boolean>(false);

  useEffect(() => {
    if (user) {
      setUsername(user.username || '');
      // setEmail(user.email || '');
      setMobileNumber(user.mobileNumber || '');
      setCity(user.city || '');
      setProfilePictureUrl(user.profilePictureUrl || '');
      // setProfilePicturePreview(user.profilePictureUrl || null);
    }
  }, [user]); // Update form fields when user object from context changes

  useEffect(() => {
      if (error) {
          setLocalMessage(error);
          setIsLocalError(true);
      }
  }, [error]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalMessage(null);
    setIsLocalError(false);
    clearError(); // Clear auth context error

    // Prepare data to send to backend
    const profileData: {
      username?: string;
      mobileNumber?: string;
      city?: string;
      // You might need to handle email separately if it requires re-verification
      // profilePictureBase64?: string; // If you implement base64 upload
    } = {};
    
    // Only include fields that have potentially changed, or all if  prefer
    if (username !== user?.username) profileData.username = username;
    if (mobileNumber !== user?.mobileNumber) profileData.mobileNumber = mobileNumber;
    if (city !== user?.city) profileData.city = city;
    // if (profilePictureFile) { /* convert to base64 and add to profileData */ }

    // For email, we might want to handle it separately due to re-verification
    // let's include it for now but note the potential complexities
    // if (email !== user?.email) {
    //   profileData.email = email; // Be aware this will likely unset isEmailVerified
    // }

    // If no data has changed, prevent API call and show message
    if (Object.keys(profileData).length === 0) {
      setLocalMessage('No changes to save.');
      setIsLocalError(false); // Not an error, it's an info message
      setIsEditing(false); // Exit edit mode
      return; // Crucially, stop here
    }
    try {
      const successMessage = await updateProfile(profileData);
      setLocalMessage(successMessage || 'Profile updated successfully!');
      setIsLocalError(false);
      setIsEditing(false); // Exit edit mode on success
    } catch (err: unknown) {
      if (
        err &&
        typeof err === 'object' &&
        err !== null &&
        'message' in err &&
        typeof (err as { message?: unknown }).message === 'string'
      ) {
        setLocalMessage((err as { message: string }).message);
      } else {
        setLocalMessage('Failed to update profile.');
      }
      setIsLocalError(true);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <p className="text-lg text-gray-700 dark:text-gray-300">Loading profile data...</p>
      </div>
    );
  }

  if (!user) {
    //  should  be caught by ProtectedRoute, but good for safety
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h2 className="text-xl font-bold text-red-500">User not found or not logged in.</h2>
      </div>
    );
  }
  
  const defaultProfilePicture = '/sharing.svg';
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
      <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">{isEditing ? "Edit Your Profile" : "Your Profile"}</h2>
      <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg space-y-4">
        {localMessage && (
          <div className={`p-3 text-sm rounded border ${isLocalError ? 'bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300' : 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900 dark:text-green-300'}`}>
            {localMessage}
          </div>
        )}
        {/* Display profile picture conditionally based on editing mode and URL existence */}
      <div className="flex justify-center mb-4">
        {(isEditing ? profilePictureUrl : user.profilePictureUrl) && (
          <img
          src={isEditing
                  ? (profilePictureUrl || defaultProfilePicture) // If editing, use state, or default
                  : (user.profilePictureUrl || defaultProfilePicture) // If not editing, use user's URL, or default
               }
          alt="Profile"
          className="w-24 h-24 rounded-full object-cover border-2 border-primary"
        />
        )}

        

      </div>
        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              {/* <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /> */}
            </div>
            <div>
              <Label htmlFor="mobileNumber">Mobile Number</Label>
              <Input id="mobileNumber" type="text" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>
             {/* Placeholder for Profile Picture File Input (for future upload) */}
            {/* If you implement file upload later, you'd add: */}
            {/* <div>
                <Label htmlFor="profilePicture">Change Picture</Label>
                <Input
                    id="profilePicture"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                            setProfilePictureFile(file); // Store the File object
                            setProfilePicturePreview(URL.createObjectURL(file)); // Create a URL for preview
                        } else {
                            setProfilePictureFile(null);
                            setProfilePicturePreview(user?.profilePictureUrl || null); // Revert to current if cancelled
                        }
                    }}
                />
            </div> */
            }
            <div className="flex justify-end gap-2 mt-4">
              <Button type="button" variant="outline" onClick={() => { setIsEditing(false); clearError(); setLocalMessage(null); }}>Cancel</Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        ) : (
          // Display mode
          <>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Username:</span> {user.username}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Email:</span> {user.email}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Mobile Number:</span> {user.mobileNumber || 'N/A'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Role:</span> {user.role}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">City:</span> {user.city || 'N/A'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              <span className="font-semibold">Mobile Verified:</span> {user.isMobileVerified ? 'Yes' : 'No'}
            </p>
            
            <Button className="w-full mt-4" onClick={() => navigate('/change-password')}>
              Change Password
            </Button>
            <Button className="w-full mt-4" onClick={() => setIsEditing(true)}>Edit Profile</Button>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;