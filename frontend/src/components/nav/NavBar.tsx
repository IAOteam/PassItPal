import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';
import { Avatar, Badge, Dropdown, type MenuProps } from 'antd';
import { UserOutlined, BellOutlined } from '@ant-design/icons';
import { MessageSquare, X, Menu, Sun, Moon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

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
  const [showNavbar, setShowNavbar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? 'hidden' : 'unset';
  }, [isMobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      setShowNavbar(currentScroll < lastScrollY.current || currentScroll < 10);
      lastScrollY.current = currentScroll;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const handleLogout = () => {
    logout();
    closeMobileMenu();
    navigate('/');
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Browse Listings", href: "/listings" },
    { name: "Contact Us", href: "/contact" },
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
          <div className="flex items-start gap-3">
            {!notif.read && <div className="mt-1.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></div>}
            <div className="flex-grow">
              <p className="text-sm text-gray-800 dark:text-gray-200">{notif.message}</p>
              <p className="text-xs text-gray-800 dark:text-gray-200">{timeSince(notif.createdAt)}</p>
            </div>
          </div>
        ),
        onClick: () => notif.link && navigate(notif.link),
        style: { height: 'auto', lineHeight: 'normal', padding: '8px 12px' }
      }))
    ) : [
      { key: 'empty', label: "You have no new notifications.", disabled: true }
    ])
  ];

  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  return (
    <header className={cn(
      "fixed top-0 z-[999] w-full bg-white/10 dark:bg-neutral-700 backdrop-blur-xl transition-transform duration-300 ",
      showNavbar ? "translate-y-0" : "-translate-y-full"
    )}>
      <div className="container mx-auto px-4">
        <div className="flex h-14 items-center justify-between">
          <Link to="/" className="font-bold text-2xl dark:text-white">PassItPal</Link>

          <nav className="hidden md:flex gap-6 items-center">
            {navItems.filter(item => !item.roles || (user && item.roles.includes(user.role))).map(item => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => cn("text-md", isActive ? "font-semibold text-black dark:text-white" : "text-neutral-800  hover:translate-y-[2px] dark:text-white/90 hover:text-black dark:hover:text-white transition-all duration-300 ease-in-out")}
              >
                {item.name}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-4">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 dark:text-white" />
              <span className="sr-only">Toggle Theme</span>
            </Button>

            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link to="/messages" className="dark:text-white"><MessageSquare size={16} /></Link>
                <Dropdown menu={{ items: notificationMenuItems }} placement="bottomRight" arrow trigger={['click']} onOpenChange={(open) => open && unreadCount > 0 && markNotificationsAsRead()}>
                  <Badge count={unreadCount} size="small">
                    <BellOutlined size={20} className="cursor-pointer text-lg dark:text-white" />
                  </Badge>
                </Dropdown>
                <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" arrow>
                  <Avatar style={{ backgroundColor: "#2563eb", cursor: "pointer" }} icon={<UserOutlined />}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </Dropdown>
              </div>
            ) : (
              <div className="hidden md:flex gap-2">
                <Button variant="outline" onClick={() => navigate('/login')}>Log In</Button>
                <Button variant="outline" onClick={() => navigate('/register')}>Sign Up</Button>
              </div>
            )}
            <button className="md:hidden text-neutral-700 dark:text-neutral-300" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black backdrop-blur-md flex flex-col md:hidden"
          >
            <div className="flex items-center justify-between px-4 h-16 border-b m-0 border-neutral-800">
              <span className="font-bold  text-xl text-white">Menu</span>
              <button onClick={closeMobileMenu} className="text-white dark:text-white "><X size={26} /></button>
            </div>
            <div className="m-0 flex bg-black flex-col items-center gap-6 mt-10 text-white text-lg">
              {navItems.filter(item => !item.roles || (user && item.roles.includes(user.role))).map(item => (
                <Link key={item.name} to={item.href} onClick={closeMobileMenu}>{item.name}</Link>
              ))}
              {isAuthenticated && (
                <>
                  <Link to="/messages" onClick={closeMobileMenu}>Messages</Link>
                  <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                </>
              )}
              {!isAuthenticated && (
                <div className="mt-8 w-full bg-black max-w-xs flex flex-col gap-4">
                  <Button size="lg" variant="outline" className="text-white" onClick={() => { navigate('/login'); closeMobileMenu(); }}>Log In</Button>
                  <Button size="lg" variant="outline" className="text-white" onClick={() => { navigate('/register'); closeMobileMenu(); }}>Sign Up</Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
