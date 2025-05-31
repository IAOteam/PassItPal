// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import BuyerDashboardContent from '@/components/dashboard/BuyerDashboardContent'; 
import SellerDashboardContent from '@/components/dashboard/SellerDashboardContent'; 
import { useLocation } from 'react-router-dom';


const DashboardPage: React.FC = () => {
    const { user, loading ,isAuthenticated} = useAuth();
    const location = useLocation();
    const [displayMessage, setDisplayMessage] = useState<string | null>(null);

  
useEffect(() => {
    if (location.state && typeof location.state.message === 'string') {
        setDisplayMessage(location.state.message);
        console.log("DashboardPage useEffect: Message set to:", location.state.message); // DEBUG LOG 2

        // Clear the message from history state so it doesn't reappear on refresh
        window.history.replaceState({}, document.title, window.location.pathname);
    }else {
        console.log("DashboardPage useEffect: No message found in location.state or it's not a string."); // DEBUG LOG 3    
    }
}, [location]);
useEffect(() => {
      console.log("DashboardPage: Current displayMessage state:", displayMessage); // DEBUG LOG 4
  }, [displayMessage]);
if (!isAuthenticated || !user) {
    // This case should ideally be handled by ProtectedRoute, but good for safety
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
        <h2 className="text-xl font-bold text-red-500">Access Denied: Not Authenticated</h2>
      </div>
    );
  }
if (loading) {
return <div>Loading dashboard...</div>;
}

if (!user) {
return <div>Not authenticated.</div>;
}

return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-4">
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">Dashboard</h2>
        <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg">
            {displayMessage && (
                <div className="p-3 text-sm rounded border bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300 mb-4">
                    {displayMessage}
                </div>
            )}

            {user.role === 'buyer' ? (
            <BuyerDashboardContent />
            ) : user.role === 'seller' ? (
            <SellerDashboardContent />
            ) : (
        <>
            <p className="text-gray-700 dark:text-gray-300">Welcome to your dashboard. {user.username}!!</p>

            <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg space-y-4">
                <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email:</span> {user.email}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Role:</span> {user.role}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">City:</span> {user.city || 'N/A'} {/* Display city if available */}
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
                </p>
            {/* Add more user details as needed */}
            </div>
            <p className="mt-8 text-gray-600 dark:text-gray-400">
                This is a protected page. You can only see this because you are logged in.
            </p>
        </> )}
        </div>
</div>
);
};
export default DashboardPage;