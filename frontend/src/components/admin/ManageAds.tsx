// frontend/src/components/admin/ManageAds.tsx

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Ad {
  _id: string;
  sponsorName: string;
  adTitle: string;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isActive: boolean;
}

const ManageAds: React.FC = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAds = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/ads');
      setAds(response.data || []);
    } catch (err) {
      console.error("Failed to fetch ads.", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handleUpdateStatus = async (adId: string, action: 'approve' | 'reject') => {
    if (!window.confirm(`Are you sure you want to ${action} this ad?`)) return;
    try {
      await api.put(`/admin/ads/${adId}/${action}`);
      alert(`Ad successfully ${action === 'approve' ? 'approved' : 'rejected'}.`);
      fetchAds(); // Refresh the list
    } catch (err: any) {
      alert(err.response?.data?.message || `Failed to ${action} ad.`);
    }
  };

  const getStatusBadgeVariant = (status: Ad['approvalStatus']) => {
    if (status === 'approved') return 'success';
    if (status === 'pending') return 'outline';
    if (status === 'rejected') return 'destructive';
    return 'secondary';
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Ads Management</h1>
      {loading ? <p>Loading ads...</p> : (
        <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sponsor</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Approval Status</TableHead>
                <TableHead>Live?</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map((ad) => (
                <TableRow key={ad._id}>
                  <TableCell>{ad.sponsorName}</TableCell>
                  <TableCell>{ad.adTitle}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(ad.approvalStatus)} className="capitalize">{ad.approvalStatus.replace('_', ' ')}</Badge>
                  </TableCell>
                   <TableCell>
                    <Badge variant={ad.isActive ? 'success' : 'secondary'}>{ad.isActive ? 'Yes' : 'No'}</Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    {ad.approvalStatus === 'pending' && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(ad._id, 'approve')}>Approve</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(ad._id, 'reject')}>Reject</Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default ManageAds;