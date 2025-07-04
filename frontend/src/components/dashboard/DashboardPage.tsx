// frontend/src/pages/DashboardPage.tsx

import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BuyerDashboardContent from '@/components/dashboard/BuyerDashboardContent';
import SellerDashboardContent from '@/components/dashboard/SellerDashboardContent';
import SavedListingsContent from '@/components/dashboard/SavedListingsContent';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Plus } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'orders' | 'listings' | 'saved'>('orders');

  if (loading) return <div className="p-10 text-center text-gray-500">Loading dashboard...</div>;
  if (!user) return <div className="p-10 text-center text-red-500">Not authenticated.</div>;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <aside className="md:w-1/5 w-full bg-neutral-100 dark:bg-neutral-900 p-6 pt-20 flex flex-col justify-between">
        <div>
          <div className="flex flex-col items-center mb-10">
            <Avatar src={user.profilePictureUrl} icon={<UserOutlined />} size={64} />
            <h2 className="text-lg font-semibold mt-2 text-center">{user.username}</h2>
            <p className="text-sm text-neutral-500 text-center">{user.email}</p>
            <Button
              className="mt-4 w-full bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white"
              onClick={() => navigate('/profile')}
            >
              <Settings className="h-4 w-4 mr-2" /> Profile Settings
            </Button>
          </div>

          <nav className="space-y-4">
            {user.role === 'seller' && (
              <>
                <Button
                  variant={activeTab === 'orders' ? 'outline' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('orders')}
                >
                  Incoming Orders
                </Button>
                <Button
                  variant={activeTab === 'listings' ? 'outline' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('listings')}
                >
                  My Listings
                </Button>
              </>
            )}

            {user.role === 'buyer' && (
              <Button
                variant={activeTab === 'orders' ? 'outline' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveTab('orders')}
              >
                My Orders
              </Button>
            )}

            <Button
              variant={activeTab === 'saved' ? 'outline' : 'ghost'}
              className="w-full justify-start"
              onClick={() => setActiveTab('saved')}
            >
              Saved Listings
            </Button>
          </nav>
        </div>

        <div className="space-y-4 mt-10">
          {user.role === 'seller' && (
            <Button
              className="w-full bg-gradient-to-br from-blue-400 to-purple-400 dark:text-white"
              onClick={() => navigate('/seller/create-listing')}
            >
              <Plus className="h-4 w-4 mr-2" /> Create New Listing
            </Button>
          )}
          <Button variant="outline" className="w-full text-red-500" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" /> Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="md:w-4/5 w-full p-6 bg-neutral-300 dark:bg-neutral-800 overflow-y-auto">
        {user.role === 'buyer' && activeTab === 'orders' && <BuyerDashboardContent />}
        {user.role === 'seller' && activeTab === 'orders' && (
          <SellerDashboardContent section="orders" />
        )}
        {user.role === 'seller' && activeTab === 'listings' && (
          <SellerDashboardContent section="listings" />
        )}
        {activeTab === 'saved' && <SavedListingsContent />}
      </main>
    </div>
  );
};

export default DashboardPage;
