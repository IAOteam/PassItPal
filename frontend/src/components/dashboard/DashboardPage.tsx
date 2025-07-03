// frontend/src/components/dashboard/DashboardPage.tsx

import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import BuyerDashboardContent from '@/components/dashboard/BuyerDashboardContent';
import SellerDashboardContent from '@/components/dashboard/SellerDashboardContent';
import SavedListingsContent from '@/components/dashboard/SavedListingsContent'; 
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Button } from '@/components/ui/button';
import { Settings, LogOut } from 'lucide-react';

const DashboardPage: React.FC = () => {
    const { user, loading, logout } = useAuth();
    const navigate = useNavigate();

    if (loading) return <div>Loading dashboard...</div>;
    if (!user) return <div>Not authenticated.</div>;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="bg-gray-100 dark:bg-black min-h-screen">
            <div className="container mx-auto p-4 md:p-8">
                {/* --- Profile Header Card --- */}
                <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-6 mb-8 flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Avatar src={user.profilePictureUrl} icon={<UserOutlined />} size={64} />
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome, {user.username}!</h1>
                            <p className="text-muted-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <Button variant="outline" onClick={() => navigate('/profile')}>
                            <Settings className="mr-2 h-4 w-4" /> Edit Profile
                         </Button>
                         <Button variant="destructive" onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" /> Logout
                         </Button>
                    </div>
                </div>

                {/* --- Main Content Area --- */}
                
                <div className="space-y-8">
                    {user.role === 'seller' && (
                        <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-6 w-full">
                            <SellerDashboardContent />
                        </div>
                    )}
                    {user.role === 'buyer' && (
                        <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-6 w-full">
                            <BuyerDashboardContent />
                        </div>
                    )}
                    <div className="bg-white dark:bg-neutral-900 shadow-lg rounded-lg p-6 w-full">
                        <SavedListingsContent />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;