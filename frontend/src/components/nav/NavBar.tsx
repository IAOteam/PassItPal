import {
  Navbar,
  NavBody,
  // NavItems,
  MobileNav,
  // NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
  NavItems,
} from "@/components/ui/resizable-navbar";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Dropdown, Avatar, Menu } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Button } from "../ui/button";
// import useAuthStore from "@/hooks/zustand/useAuthStore"; 

export function NavBar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    { name: "Browse Passes", link: "/listings" },
    { name: "Become a Seller", link: "/profile" }, 
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    navigate('/');
  };
  // const navigate = useNavigate();

  // const { user, logout } = useAuthStore();

  // const handleLogin = () => navigate("/login");

  // const handleLogout = () => {
  //   logout();
  //   navigate("/login");
  // };

  // const handleBookCall = () => {
  //   alert("Book a call functionality coming soon!");
  // };

  const userInitial = user?.username?.charAt(0).toUpperCase() || "";

  const userMenu = (
    <Menu
      items={[
        {
          key: "dashboard",
          label: <span onClick={() => navigate("/dashboard")}>Dashboard</span>,
        },
        {
          key: "profile",
          label: <span onClick={() => navigate("/profile")}>My Profile</span>,
        },
        {
          key: "logout",
          label: <span onClick={handleLogout}>Logout</span>,
          danger: true,
        },
      ]}
    />
  );
  
  return (
    // Adopted sticky positioning from your friend's version
    <div className="sticky top-0 left-0 w-full z-[100] pagePadding">
      <Navbar>
        <NavBody>
          {/* Main Logo/Brand Name */}
          <Link to="/">
            <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-4 py-2">
              PassItPal
            </div>
          </Link>

          {/* Navigation Items */}
          <NavItems items={navItems} />

          {/* Auth Buttons / User Menu */}
          <div className="flex items-center gap-4">
            {isAuthenticated && user ? (
              // Authenticated View: Use the antd Dropdown
              <Dropdown overlayClassName="mt-2" menu={{ items: userMenu.props.items }} placement="bottomRight" arrow>
                <Avatar style={{ backgroundColor: "#1d4ed8", cursor: "pointer" }} icon={!userInitial && <UserOutlined />}>
                  {userInitial}
                </Avatar>
              </Dropdown>
            ) : (
              // Unauthenticated View
              <div className="hidden md:flex items-center gap-2">
                <Button variant="secondary" onClick={() => navigate('/login')}>
                  Login
                </Button>
                <Button variant="default" onClick={() => navigate('/register')}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
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
