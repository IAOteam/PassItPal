import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api'; // Your configured Axios instance
import { useAuth } from '@/hooks/useAuth'; // Assuming User type is exported as AuthUser
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"; // Assuming you have table components
import { Badge } from "@/components/ui/badge"; // Assuming you have a Badge component
// import { User as AuthUser } from '@/context/AuthContext';

// Define a more specific type for the user objects received from the /api/admin/role-requests endpoint
// This should match the fields selected in your adminController's listRoleChangeRequests function
interface RoleChangeRequestUser {
  _id: string;
  username?: string;
  email: string;
  role: 'buyer' | 'seller' | 'admin'; // Current role
  requestedRole?: 'buyer' | 'seller';
  roleRequestTimestamp?: string; // Date as string
  isMobileVerified: boolean;
  isEmailVerified: boolean;
}

const ManageRoleRequests: React.FC = () => {
  const { token } = useAuth(); // For authenticated API calls
  const [requests, setRequests] = useState<RoleChangeRequestUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For handling rejection notes - will expand later
//   const [rejectingUserId, setRejectingUserId] = useState<string | null>(null);
//   const [rejectionNotes, setRejectionNotes] = useState<string>('');

  const fetchPendingRequests = useCallback(async () => {
    if (!token) return; // Should be caught by protected route, but good check
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/admin/role-requests'); // Fetches users with roleRequestStatus: 'pending'
      setRequests(response.data || []);
    } catch (err: unknown) {
      console.error("Error fetching role change requests:", err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError((err.response as { data: { message?: string } }).data?.message || 'Failed to fetch requests.');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to fetch requests.');
      } else {
        setError('Failed to fetch requests.');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleApprove = async (userIdToApprove: string) => {
    if (!window.confirm("Are you sure you want to approve this role change request?")) return;
    setError(null);
    try {
      const response = await api.put(`/admin/role-requests/${userIdToApprove}/approve`);
      alert(response.data.message || "Request approved successfully!");
      fetchPendingRequests(); // Refresh the list
    } catch (err: unknown) {
      console.error("Error approving request:", err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError((err.response as { data: { message?: string } }).data?.message || 'Failed to approve request.');
        alert((err.response as { data: { message?: string } }).data?.message || 'Failed to approve request.');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to approve request.');
        alert(err.message || 'Failed to approve request.');
      } else {
        setError('Failed to approve request.');
        alert('Failed to approve request.');
      }
    }
  };

  const openRejectModal = (userId: string) => {
    // setRejectingUserId(userId);
    // setRejectionNotes(''); // Clear previous notes
    // In a real app, you'd open a modal here. For now, we'll use a simple alert/prompt system or inline.
    // We will implement a proper modal later.
    const notes = prompt("Please enter the reason for rejection:");
    if (notes !== null) { // If user provided notes (didn't cancel prompt)
        handleReject(userId, notes);
    } else {
        // setRejectingUserId(null); // User cancelled
    }
  };

  const handleReject = async (userIdToReject: string, notes: string) => {
    if (!notes.trim()) {
        alert("Rejection notes cannot be empty.");
        return;
    }
    if (!window.confirm(`Are you sure you want to reject this request with notes: "${notes}"?`)) return;
    setError(null);
    try {
      const response = await api.put(`/admin/role-requests/${userIdToReject}/reject`, { notes });
      alert(response.data.message || "Request rejected successfully!");
      fetchPendingRequests(); // Refresh the list
    } catch (err: unknown) {
      console.error("Error rejecting request:", err);
      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'message' in err.response.data) {
        setError((err.response as { data: { message?: string } }).data?.message || 'Failed to reject request.');
        alert((err.response as { data: { message?: string } }).data?.message || 'Failed to reject request.');
      } else if (err instanceof Error) {
        setError(err.message || 'Failed to reject request.');
        alert(err.message || 'Failed to reject request.');
      } else {
        setError('Failed to reject request.');
        alert('Failed to reject request.');
      }
    } finally {
    //   setRejectingUserId(null);
    //   setRejectionNotes('');
    }
  };


  if (loading) {
    return <p className="text-center text-gray-500 dark:text-gray-400">Loading pending role requests...</p>;
  }

  if (error) {
    return <p className="text-center text-red-500 dark:text-red-400">Error: {error}</p>;
  }

  if (requests.length === 0) {
    return <p className="text-center text-gray-500 dark:text-gray-400">No pending role change requests.</p>;
  }

  return (
    <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">Manage Role Change Requests</h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Current Role</TableHead>
            <TableHead>Requested Role</TableHead>
            <TableHead>Mobile Verified</TableHead>
            <TableHead>Requested At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((reqUser) => (
            <TableRow key={reqUser._id}>
              <TableCell>{reqUser.username || 'N/A'}</TableCell>
              <TableCell>{reqUser.email}</TableCell>
              <TableCell><Badge variant={reqUser.role === 'seller' ? 'default' : 'secondary'} className="capitalize">{reqUser.role}</Badge></TableCell>
              <TableCell><Badge variant="outline" className="capitalize">{reqUser.requestedRole}</Badge></TableCell>
              <TableCell>
                {reqUser.isMobileVerified ? (
                  <Badge variant="success" className="bg-green-500 text-white">Yes</Badge>
                ) : (
                  <Badge variant="destructive">No</Badge>
                )}
              </TableCell>
              <TableCell>{reqUser.roleRequestTimestamp ? new Date(reqUser.roleRequestTimestamp).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell className="text-right space-x-2">
                <Button 
                  size="sm" 
                  variant="default" 
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => handleApprove(reqUser._id)}
                >
                  Approve
                </Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => openRejectModal(reqUser._id)}
                >
                  Reject
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* We will implement a proper modal for rejection notes later */}
      {/* {rejectingUserId && ( ... modal JSX ... )} */}
    </div>
  );
};

export default ManageRoleRequests;
