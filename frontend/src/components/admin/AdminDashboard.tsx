// frontend/src/components/admin/AdminDashboard.tsx
import React, { useState, useEffect } from 'react';
import api from '@/lib/api';

interface PlatformStats {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  totalSellers: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/stats');
        setStats(res.data);
      } catch (error) {
        console.error("Failed to fetch platform stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Platform Overview</h1>
      {loading ? (
        <p>Loading stats...</p>
      ) : stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-black border border-neutral-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-400">Total Users</h3>
            <p className="text-3xl font-bold mt-1">{stats.totalUsers}</p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-400">Total Sellers</h3>
            <p className="text-3xl font-bold mt-1">{stats.totalSellers}</p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-400">Total Listings</h3>
            <p className="text-3xl font-bold mt-1">{stats.totalListings}</p>
          </div>
          <div className="bg-black border border-neutral-800 p-6 rounded-lg">
            <h3 className="text-sm font-medium text-neutral-400">Active Listings</h3>
            <p className="text-3xl font-bold mt-1">{stats.activeListings}</p>
          </div>
        </div>
      ) : (
        <p className="text-red-500">Failed to load platform statistics.</p>
      )}
    </div>
  );
};

export default AdminDashboard;