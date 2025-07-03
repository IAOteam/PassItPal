// src/pages/dashboard/DashboardPage.tsx
import React, { useEffect, useState } from 'react';
import SavedListingsContent from './SavedListingsContent';
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
    type Tab = 'buyer' | 'seller' | 'saved';
    const [activeTab, setActiveTab] = useState<Tab>(user?.role === 'seller' ? 'seller' : 'buyer');

  
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

return (
        <div className="container mx-auto mt-12 p-4 md:p-8 bg-neutral-200 dark:bg-neutral-900">
    <div className="flex border-b dark:border-white dark:text-white mb-6">
        {user?.role === 'buyer' && (
            <button onClick={() => setActiveTab('buyer')} className={`py-2 px-4 ${activeTab === 'buyer' ? 'border-b-2 dark:border-white dark:text-white' : 'text-muted-foreground text-neutral-700 dark:text-neutral-400'}`}>
                My Orders
            </button>
        )}
        {user?.role === 'seller' && (
            <button onClick={() => setActiveTab('seller')} className={`py-2 px-4 ${activeTab === 'seller' ? 'border-b-2 dark:border-white dark:text-white' : 'text-muted-foreground text-neutral-700 dark:text-neutral-400'}`}>
                My Listings & Offers
            </button>
        )}
        <button onClick={() => setActiveTab('saved')} className={`py-2 px-4 ${activeTab === 'saved' ? 'border-b-2 dark:border-white dark:text-white' : 'text-muted-foreground text-neutral-700 dark:text-neutral-400'}`}>
            Saved Items
        </button>
    </div>

    <div className="w-full mb-10">
        {activeTab === 'buyer' && <BuyerDashboardContent />}
        {activeTab === 'seller' && <SellerDashboardContent />}
        {activeTab === 'saved' && <SavedListingsContent />}
    </div>
</div>
)};
export default DashboardPage;