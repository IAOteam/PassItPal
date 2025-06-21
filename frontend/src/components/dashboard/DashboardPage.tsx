// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';

import BuyerDashboardContent from '@/components/dashboard/BuyerDashboardContent'; 
import SellerDashboardContent from '@/components/dashboard/SellerDashboardContent'; 
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
// import ManageRoleRequests from '@/components/admin/ManageRoleRequests';
import ManageReports from '@/components/admin/ManageReports';

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
        console.log("DashboardPage useEffect: No message found in location.state or it's not a string.");   
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

const renderDashboardContent = () => {
        switch (user.role) {
            case 'buyer':
                return <BuyerDashboardContent />;
            case 'seller':
                return <SellerDashboardContent />;
            default:
                // This case handles any other roles, or can redirect if needed
                return <p>Welcome, {user.username}! Your dashboard is under construction.</p>;
        }
    };


/*return (
    <div className="p-4"> 
        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white text-center">Dashboard</h2>
        
        <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full ">
            {displayMessage && (
                <div className="p-3 text-sm rounded border bg-red-100 border-red-400 text-red-700 dark:bg-red-900 dark:text-red-300 mb-4">
                    {displayMessage}
                </div>
            )}

            {user.role === 'buyer' && (<BuyerDashboardContent />
        // <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-2xl mx-auto">
        // <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full  mx-auto">
          
        // </div>
      )} 
       {user.role === 'seller' && (<SellerDashboardContent />
        // <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-2xl mx-auto">
        // <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full  mx-auto">
          
        // </div>
      )} 
      {/* {user.role === 'admin' && (
        <div className="space-y-8">
          <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
            <h3 className="text-xl font-semibold mb-4">Admin Overview</h3>
            <p>Welcome, Admin {user.username}!</p>
            
          </div>
          <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
            <ManageRoleRequests />
          </div>
          <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-4xl mx-auto">
            <ManageReports />
          </div>
        </div>
      )} //}
      {user.role !== 'buyer' && user.role !== 'seller' && user.role !== 'admin' && (
          <div className="bg-white dark:bg-neutral-900 shadow-md rounded-lg p-6 w-full max-w-lg mx-auto">
            <p>Welcome to your dashboard, {user.username}!</p>
          </div>
        )}
      </div>
      {/* : (
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
                <span className="font-semibold">City:</span> {user.city || 'N/A'} 
                </p>
                <p className="text-gray-700 dark:text-gray-300">
                <span className="font-semibold">Email Verified:</span> {user.isEmailVerified ? 'Yes' : 'No'}
                </p>
            
            </div>
            <p className="mt-8 text-gray-600 dark:text-gray-400">
                This is a protected page. You can only see this because you are logged in.
            </p>
        </> ) //}
    </div>

);*/
return (
        <div className="container mx-auto p-4 md:p-8">
            <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                My Dashboard
            </h1>
            <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-6 w-full">
                {renderDashboardContent()}
            </div>
        </div>)
        
};
export default DashboardPage;