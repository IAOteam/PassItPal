import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Dropdown, Avatar, Menu } from "antd";
import { UserOutlined } from "@ant-design/icons";
import useAuthStore from "@/hooks/zustand/useAuthStore"; 

export function NavBar() {
  const navItems = [
    { name: "Passes", link: "/pass-listing" },
    { name: "Pricing", link: "#pricing" },
    { name: "Contact", link: "#contact" },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const { user, logout } = useAuthStore();

  const handleLogin = () => navigate("/login");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleBookCall = () => {
    alert("Book a call functionality coming soon!");
  };

  const userInitial = user?.username?.charAt(0).toUpperCase() || "";

  const userMenu = (
    <Menu
      items={[
        {
          key: "dashboard",
          label: <span onClick={() => navigate("/dashboard")}>Dashboard</span>,
        },
        {
          key: "logout",
          label: <span onClick={handleLogout}>Logout</span>,
        },
      ]}
    />
  );
  
  return (
    <div className="sticky top-0 left-0 w-full z-[100]">
      <Navbar>
        <NavBody>
          <Link to="/">
          <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-4 py-2">
            PassItPal
          </div>
          </Link>
          <NavItems items={navItems} />

          <div className="flex items-center gap-4">
            {!user ? (
              <NavbarButton variant="secondary" onClick={handleLogin}>
                Login
              </NavbarButton>
            ) : (
              <Dropdown overlay={userMenu} placement="bottomRight" arrow>
                <Avatar
                  style={{ backgroundColor: "#1677ff", cursor: "pointer" }}
                  icon={!userInitial && <UserOutlined />}
                >
                  {userInitial}
                </Avatar>
              </Dropdown>
            )}
            <NavbarButton variant="primary" onClick={handleBookCall}>
              Book a call
            </NavbarButton>
          </div>
        </NavBody>

        <MobileNav>
          <MobileNavHeader>
            <div className="relative inline-block font-bold text-xl tracking-wider z-10 px-4 py-2">
              PassItPal
            </div>
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
            <div className="flex w-full flex-col gap-4">
              {!user ? (
                <NavbarButton
                  onClick={handleLogin}
                  variant="primary"
                  className="w-full"
                >
                  Login
                </NavbarButton>
              ) : (
                
                <NavbarButton
                  onClick={handleLogout}
                  variant="secondary"
                  className="w-full"
                >
                  Logout
                </NavbarButton>
              )}
              <NavbarButton
                onClick={handleBookCall}
                variant="primary"
                className="w-full"
              >
                Book a call
              </NavbarButton>
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
