// frontend/src/components/admin/layout/AdminLayout.tsx
import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, ShieldAlert, BadgeHelp, Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Reports', href: '/admin/reports', icon: ShieldAlert },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Listings', href: '/admin/listings', icon: FileText },
  { name: 'Ads', href: '/admin/ads', icon: Megaphone }, 
];
const AdminLayout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-neutral-900 text-white">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-black p-4 border-r border-neutral-800">
        <h2 className="text-xl font-bold mb-8">Admin Panel</h2>
        <nav className="flex flex-col space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.name}
              to={link.href}
              end // 'end' prop ensures only exact route match is active
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'
                )
              }
            >
              <link.icon className="h-5 w-5" />
              <span>{link.name}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;