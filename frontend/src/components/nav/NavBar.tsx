/*import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown, Avatar ,Badge, type MenuProps} from "antd";
import { UserOutlined , BellOutlined} from "@ant-design/icons";
import { Button } from "../ui/button";
import { MessageSquare } from "lucide-react";
// import useAuthStore from "@/hooks/zustand/useAuthStore"; 

// Helper function to format time since notification was created
const timeSince = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + "y ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + "mo ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + "d ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + "h ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + "m ago";
  return Math.floor(seconds) + "s ago";
};

export function NavBar() {
  const { isAuthenticated, logout, user, notifications, unreadCount, markNotificationsAsRead  } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    { name: "Browse Passes", link: "/listings" },
    { name: "Become a Seller", link: "/login" }, 
    { name: "Create Listing", link: "/seller/create-listing", roles: ['seller'] },
  ];
  

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    navigate('/');
  };
  const handleNotificationDropdownToggle = (open: boolean) => {
    setIsNotificationDropdownOpen(open);
    // If the dropdown is being opened and there are unread notifications, mark them as read
    if (open && unreadCount > 0) {
      markNotificationsAsRead();
    }
  };
  

  const userInitial = user?.username?.charAt(0).toUpperCase() || "";

  const userMenuItems: MenuProps['items'] = [
    { key: "dashboard", label: "Dashboard", onClick: () => { 
      if(user?.role==='admin'){
      navigate("/admin")
    }else 
    navigate("/dashboard")
    }
   },
    { key: "profile", label: "My Profile", onClick: () => navigate("/profile") },
    { key: "admin", label: "Admin Panel", onClick: () => navigate("/admin"), style: { display: user?.role === 'admin' ? 'block' : 'none' } },
    { type: 'divider' },
    { key: "logout", label: "Logout", onClick: handleLogout, danger: true },
  ];
// The notification dropdown menu
  const notificationMenuItems: MenuProps['items'] = [
    {
      key: 'header',
      label: "Notifications",
      type: 'group',
      className: "font-semibold text-base"
    },
    { type: 'divider' },
    ...(notifications.length > 0 ? (
      notifications.slice(0, 7).map(notif => ({
        key: notif._id,
        label: (
          <div className="flex items-start gap-3">
            {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>}
            <div className="flex-grow">
              <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(notif.createdAt)}</p>
            </div>
          </div>
        ),
        onClick: () => notif.link && navigate(notif.link),
        style: { height: 'auto', lineHeight: 'normal', padding: '8px 12px' }
      }))
    ) : (
      [{ key: 'empty', label: "You have no new notifications.", disabled: true }]
    ))
  ];
  
  return (
    // Adopted sticky positioning from your friend's version
    <div className="sticky top-0 left-0 w-full z-[100] pagePadding">
      <Navbar>
        <NavBody>
          {-- Main Logo/Brand Name ---}
          <Link to="/">
            <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-4 py-2">
              PassItPal
            </div>
          </Link>

          {--- Navigation Items ---}
          <NavItems items={navItems} />

          {--- Auth Buttons / User Menu ---}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
            <div className="flex items-center gap-5">
                  <Link to="/messages" title="Messages">
                    <MessageSquare className="text-xl text-gray-600 dark:text-gray-300 hover:text-primary cursor-pointer" />
                  </Link>
                  
              <Dropdown
                  menu={{ items: notificationMenuItems }} 
                  placement="bottomRight"
                  arrow
                  trigger={['click']}
                  onOpenChange={handleNotificationDropdownToggle} // Use onOpenChange
                >
                  <span>
                    
                    <Badge count={unreadCount} size="small">
                      <BellOutlined className="text-xl text-gray-600 dark:text-gray-300 hover:text-primary cursor-pointer" />
                    </Badge>
                  </span>
                </Dropdown>
              {--- // Authenticated View: Use the antd Dropdown ---}
              <Dropdown overlayClassName="mt-2" menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                <span>
                  <Avatar style={{ backgroundColor: "#1d4ed8", cursor: "pointer" }} icon={!userInitial && <UserOutlined />}>
                    {userInitial}
                  </Avatar>
                </span>
              </Dropdown>
            </div>
            ) : (
              // Unauthenticated View
              <div className="hidden md:flex items-center gap-2">
                <Link to="/login">
                  <NavbarButton variant="secondary" as="span">Login</NavbarButton> {---Use as="span" with Link ----}
                </Link>
                <Link to="/register">
                  <NavbarButton variant="primary" as="span">Register</NavbarButton> {--- Use as="span" with Link ----}
                </Link>
              </div>
            )}
          </div>
        </NavBody>

        
        <MobileNav>
          <MobileNavHeader>
            <Link to="/">
                <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-2 py-2">
                    PassItPal
                </div>
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link} // For in-page links like #contact
                onClick={(e) => {
                    if(item.link.startsWith('/')) { e.preventDefault(); navigate(item.link); }
                    setIsMobileMenuOpen(false);
                }}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-neutral-800">
              {isAuthenticated && user ? (
                <>
                  <span className="text-neutral-600 dark:text-neutral-300 text-sm p-2 w-full text-center">
                    Welcome, {user.username}!
                  </span>
                  <Button onClick={() => { navigate('/dashboard'); setIsMobileMenuOpen(false); }} variant="secondary" className="w-full">Dashboard</Button>
                  <Button onClick={() => { navigate('/profile'); setIsMobileMenuOpen(false); }} variant="secondary" className="w-full">My Profile</Button>
                  <Button onClick={handleLogout} variant="destructive" className="w-full">Logout</Button>
                </>
              ) : (
                <>
                  <Button onClick={() => { navigate('/login'); setIsMobileMenuOpen(false); }} variant="secondary" className="w-full">Login</Button>
                  <Button onClick={() => { navigate('/register'); setIsMobileMenuOpen(false); }} variant="default" className="w-full">Register</Button>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div> 
  );
}
*/

import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Avatar, Badge, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';
import { ShieldAlert, MessageSquare, X, Menu, Sun, Moon } from 'lucide-react';
import { AnimatePresence , motion} from 'motion/react';

const timeSince = (date: string) => {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return "Just now";
  let interval = Math.floor(seconds / 31536000);
  if (interval >= 1) return interval + "y ago";
  interval = Math.floor(seconds / 2592000);
  if (interval >= 1) return interval + "mo ago";
  interval = Math.floor(seconds / 86400);
  if (interval >= 1) return interval + "d ago";
  interval = Math.floor(seconds / 3600);
  if (interval >= 1) return interval + "h ago";
  interval = Math.floor(seconds / 60);
  return interval + "m ago";
};

export function NavBar() {
  const { isAuthenticated, logout, user, notifications, unreadCount, markNotificationsAsRead } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useTheme();

  useEffect(() => {
    // Prevent background scrolling when the mobile menu is open
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);
  
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    closeMobileMenu();
    logout();
    navigate('/');
  };

  const navItems = [
    { name: "Browse", href: "/listings" },
    { name: "List a Pass", href: "/seller/create-listing", roles: ['seller'] },
  ];

  const userMenuItems: MenuProps['items'] = [
    { key: "dashboard", label: "Dashboard", onClick: () => navigate("/dashboard") },
    { key: "profile", label: "My Profile", onClick: () => navigate("/profile") },
    ...(user?.role === 'admin' ? [{ key: "admin", label: "Admin Panel", onClick: () => navigate("/admin") }] : []),
    { type: 'divider' },
    { key: "logout", label: "Logout", onClick: handleLogout, danger: true },
  ];

  const notificationMenuItems: MenuProps['items'] = [
    { key: 'header', label: "Notifications", type: 'group', className: "font-semibold text-base" },
    { type: 'divider' },
    ...(notifications.length > 0 ? (
      notifications.slice(0, 7).map(notif => ({
        key: notif._id,
        label: (
          <div className="flex items-start gap-3">{!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>}<div className="flex-grow"><p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p><p className="text-xs text-gray-500 dark:text-gray-400">{timeSince(notif.createdAt)}</p></div></div>
        ),
        onClick: () => { if(notif.link) navigate(notif.link); },
        style: { height: 'auto', lineHeight: 'normal', padding: '8px 12px' }
      }))
    ) : (
      [{ key: 'empty', label: "You have no new notifications.", disabled: true }]
    ))
  ];

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-neutral-800 bg-black/80 backdrop-blur-lg">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
              {/* <ShieldAlert className="h-6 w-6 text-primary" /> */}
              <span className="font-bold text-lg text-white">Passitpal</span>
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              {navItems.filter(item => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
                <NavLink key={item.name} to={item.href} className={({isActive}) => cn("text-sm transition-colors", isActive ? 'text-white font-semibold' : 'text-neutral-400 hover:text-white')}>
                  {item.name}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-neutral-400 hover:text-white">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
            
            {isAuthenticated ? (
              <div className="flex items-center gap-3 md:gap-4">
                <Link to="/messages" title="Messages" className="text-neutral-400 hover:text-white transition-colors"><MessageSquare className="h-5 w-5" /></Link>
                <Dropdown menu={{ items: notificationMenuItems }} placement="bottomRight" arrow trigger={['click']} onOpenChange={(open) => open && unreadCount > 0 && markNotificationsAsRead()}>
                  <Badge count={unreadCount} size="small"><BellOutlined className="cursor-pointer text-xl text-neutral-400 hover:text-white transition-colors" /></Badge>
                </Dropdown>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                  <Avatar style={{ backgroundColor: "#2563eb", cursor: "pointer" }} icon={<UserOutlined />}>{user?.username?.charAt(0).toUpperCase()}</Avatar>
                </Dropdown>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="outline" onClick={() => navigate('/login')}>Log In</Button>
                <Button onClick={() => navigate('/register')}>Sign Up</Button>
              </div>
            )}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(true)} className="text-neutral-400 hover:text-white"><Menu size={24} /></button>
            </div>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md md:hidden"
          >
            <div className="container mx-auto px-4 h-full">
              <div className="flex items-center justify-between h-16 border-b border-neutral-800">
                <Link to="/" className="flex items-center gap-2" onClick={closeMobileMenu}>
                  {/* <ShieldAlert className="h-6 w-6 text-primary" /><span className="font-bold text-lg text-white">Passitpal</span> */}
                </Link>
                <button onClick={closeMobileMenu} className="text-neutral-400 hover:text-white"><X size={26} /></button>
              </div>
              <div className="mt-8 flex flex-col items-center gap-y-6 text-center">
                {navItems.filter(item => !item.roles || (user && item.roles.includes(user.role))).map((item) => (
                  <Link key={`mobile-${item.name}`} to={item.href} onClick={closeMobileMenu} className="text-xl font-medium text-neutral-300 hover:text-white">{item.name}</Link>
                ))}
                {!isAuthenticated && (
                  <div className="mt-8 flex flex-col gap-4 w-full max-w-xs">
                    <Button size="lg" variant="outline" onClick={() => {closeMobileMenu(); navigate('/login');}}>Log In</Button>
                    <Button size="lg" onClick={() => {closeMobileMenu(); navigate('/register');}}>Sign Up</Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

