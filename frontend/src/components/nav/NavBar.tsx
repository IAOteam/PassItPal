import {
  Navbar,
  NavBody,
  // NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { Link, useNavigate } from 'react-router-dom'; 
import { useAuth } from '@/context/AuthContext'; 
// import { Button } from './ui/button';

export function NavBar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const navItems = [
    {
      name: "Features",
      link: "#features",
    },
    {
      name: "Pricing",
      link: "#pricing",
    },
    {
      name: "Contact",
      link: "#contact",
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false); // Close mobile menu on logout
    navigate('/login');
  };

  return (
    <div className="relative w-full">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
        <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-4 py-2">
            PassItPal
        </div>

          {/* <NavItems items={navItems} /> */}

          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                {/* {user && user.username && (
                    <span className="text-gray-700 dark:text-gray-300 text-sm">
                        Welcome, {user.username}!
                    </span>
                )} */}
                {/* Placeholder for a Dashboard/Profile button */}
                <Link to="/dashboard">
                    <NavbarButton variant="secondary" as="span">Dashboard</NavbarButton>
                </Link>
                <Link to="/profile">
                    <NavbarButton variant="secondary" as="span">Profile</NavbarButton>
                </Link>
                <Link to="/seller/create-listing" className="hover:underline">
                Create Listing
                </Link>
                
                <NavbarButton variant="primary" onClick={handleLogout}>Logout</NavbarButton>
              </>
            ) : (
              <div className="space-x-2">
                <Link to="/login">
                  <NavbarButton variant="secondary" as="span">Login</NavbarButton> {/* Use as="span" with Link */}
                </Link>
                <Link to="/register">
                  <NavbarButton variant="primary" as="span">Register</NavbarButton> {/* Use as="span" with Link */}
                </Link>
                
                {/* <NavbarButton variant="primary">Book a call</NavbarButton> */}
              </div>
            )}
          </div>
        </NavBody>


        {/*--------- Mobile Navigation ----------*/}
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            {/* <div className="relative inline-block font-bold text-xl tracking-wider z-10 py-2">
                PassItPal
            </div> */}
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4 mt-4">
              {isAuthenticated ? (
                <>
                    {/* to: Display username for mobile too */}
                    {user && user.username && (
                        <span className="text-neutral-600 dark:text-neutral-300 text-sm p-2 w-full text-center">
                            Welcome, {user.username}!
                        </span>
                    )}
                    <Link to="/dashboard" className="w-full">
                        <NavbarButton
                        onClick={() => setIsMobileMenuOpen(false)}
                        variant="secondary"
                        className="w-full"
                        as="span"
                        >
                        Dashboard
                        </NavbarButton>
                    </Link>
                      <Link to="/profile" className="w-full"> {/* <--- ADD THIS LINE */}
                        <NavbarButton
                        onClick={() => setIsMobileMenuOpen(false)}
                        variant="secondary"
                        className="w-full"
                        as="span"
                        >
                        Profile
                        </NavbarButton>
                    </Link>
                    <Link to="/change-password" className="w-full">
                        <NavbarButton
                        onClick={() => setIsMobileMenuOpen(false)}
                        variant="secondary"
                        className="w-full"
                        as="span"
                        >
                        Change Password
                        </NavbarButton>
                    </Link>
                    <NavbarButton
                        onClick={handleLogout}
                        variant="primary"
                        className="w-full"
                    >
                        Logout
                    </NavbarButton>
                </>
              ) : (
                <>
                  <Link to="/login" className="w-full">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                      as="span"
                    >
                      Login
                    </NavbarButton>
                  </Link>
                  <Link to="/register" className="w-full">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                      as="span"
                    >
                      Register
                    </NavbarButton>
                  </Link>
                  {/* <NavbarButton
                    onClick={() => setIsMobileMenuOpen(false)}
                    variant="primary"
                    className="w-full"
                  >
                    Book a call
                  </NavbarButton> */}
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}