import React, { useState } from 'react';

import { useNavigate } from 'react-router-dom';
import BuyerDashboardContent from '@/components/dashboard/BuyerDashboardContent';
import SellerDashboardContent from '@/components/dashboard/SellerDashboardContent';
import SavedListingsContent from '@/components/dashboard/SavedListingsContent';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Button } from '@/components/ui/button';
import { Settings, LogOut, Plus, ChevronRight, Menu, X } from 'lucide-react';
import useAuthStore from '@/hooks/zustand/useAuthStore';

const DashboardPage: React.FC = () => {
    const { user, loading, logout } = useAuthStore();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'orders' | 'listings' | 'saved'>('orders');
    const [menuOpen, setMenuOpen] = useState(false);


    if (loading) return <div>Loading dashboard...</div>;
    if (!user) return <div>Not authenticated.</div>;

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <div className="flex min-h-screen flex-col md:flex-row">
            {/* Mobile Top Bar */}
            <div className="flex justify-between items-center  bg-neutral-100 dark:bg-neutral-800 md:hidden pt-16">
                
                <Button variant="ghost" className='text-black dark:text-white z-[999]' onClick={() => setMenuOpen((prev) => !prev)}>
                    {menuOpen ? <X className='size-6'/> : <span className='flex gap-1 justify-center items-center w-fit'>Switch listing <ChevronRight /></span> }
                </Button>
            </div>
    
            {/* Sidebar */}
            <aside className={`bg-neutral-100 dark:bg-neutral-800  dark:text-white p-6 pt-20 flex flex-col w-full md:w-[250px]  justify-between 
            ${menuOpen ? 'block' : 'hidden'} md:block absolute md:static top-16 left-0 z-20  `}>
                <div className=' h-[85%]'>
                    {/* User Info */}
                    <div className="hidden md:flex flex-col items-center mb-8 h-fit" >
                        <Avatar src={user.profilePictureUrl} icon={<UserOutlined />} size={64} />
                        <h2 className="text-xl font-semibold mt-2">{user.username}</h2>
                        <p className="text-sm text-neutral-500">{user.email}</p>
                        <Button
                            className="mt-4 bg-blue-300 hover:bg-blue-400 dark:bg-blue-400 dark:hover:bg-blue-500 dark:text-white w-full"
                            onClick={() => navigate('/profile')}
                        >
                            <Settings className="h-4 w-4 mr-2" /> Profile Settings
                        </Button>
                    </div>
    
                    {/* Navigation */}
                    <nav className="space-y-3 md:mt-0 -mt-6" >
                        {user.role === 'seller' && (
                            <>
                                <Button
                                    className={`w-full justify-between ${activeTab === 'orders' ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                                    onClick={() => {
                                        setActiveTab('orders');
                                        setMenuOpen(!menuOpen);
                                    }}
                                >
                                    Incoming Orders <ChevronRight />
                                </Button>
                                <Button
                                    className={`w-full justify-between ${activeTab === 'listings' ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                                    onClick={() => {
                                        setActiveTab('listings');
                                        setMenuOpen(!menuOpen);
                                    }}
                                >
                                    My Listings <ChevronRight />
                                </Button>
                            </>
                        )}
    
                        {user.role === 'buyer' && (
                            <Button
                                className={`w-full justify-between ${activeTab === 'orders' ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                                onClick={() => {
                                    setActiveTab('orders');
                                    setMenuOpen(!menuOpen);
                                }}
                            >
                                My Orders <ChevronRight />
                            </Button>
                        )}
                        <Button
                            className={`w-full justify-between ${activeTab === 'saved' ? 'bg-neutral-200 dark:bg-neutral-700' : 'hover:bg-neutral-200 dark:hover:bg-neutral-700'}`}
                            onClick={() => {
                                setActiveTab('saved');
                                setMenuOpen(!menuOpen);
                            }}
                        >
                            Saved Listings <ChevronRight />
                        </Button>

                        {user.role === 'seller' && (
                        <Button className="w-full bg-gradient-to-br md:hidden from-blue-400 to-purple-400 dark:text-white" onClick={() => navigate('/seller/create-listing')}>
                            <Plus className="mr-2" /> Create New Listing
                        </Button>
                    )}
    
                        
                    </nav>
                </div>
    
                {/* Sidebar Bottom Actions */}
                <div className="space-y-4 hidden md:block">
                {user.role === 'seller' && (
                        <Button className="w-full bg-gradient-to-br  from-blue-400 to-purple-400 dark:text-white" onClick={() => navigate('/seller/create-listing')}>
                            <Plus className="mr-2" /> Create New Listing
                        </Button>
                    )}
                    
                    
                    <Button variant="outline" className="text-red-500 w-full" onClick={handleLogout}>
                        <LogOut className="h-4 w-4 mr-2" /> Logout
                    </Button>
                </div>
            </aside>
    
            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 bg-neutral-300 dark:bg-neutral-800 min-h-screen">
                {user.role === 'buyer' && activeTab === 'orders' && <BuyerDashboardContent />}
                {user.role === 'seller' && activeTab === 'orders' && <SellerDashboardContent section="orders" />}
                {user.role === 'seller' && activeTab === 'listings' && <SellerDashboardContent section="listings" />}
                {activeTab === 'saved' && <SavedListingsContent />}
            </main>
        </div>
    );    
};

export default DashboardPage;