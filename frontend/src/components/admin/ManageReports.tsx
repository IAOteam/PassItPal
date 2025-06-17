// frontend/src/components/admin/ManageReports.tsx
import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Link } from 'react-router-dom';
import ReportDetailModal from './ReportDetailModal'; 

interface Report {
  _id: string;
  reporter: { _id: string; username: string; email: string };
  reportedContentId: string;
  reportedContentType: 'Listing' | 'User';
  reason: string;
  details?: string;
  status: 'open' | 'under_review' | 'resolved_no_action' | 'resolved_action_taken';
  createdAt: string;
}

const ManageReports: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = '/admin/reports';
      if (filter !== 'all') {
        // A more complex query might be needed if you have multiple resolved statuses
        const statusQuery = filter === 'open' ? '?status=open' : ''; // Simple filter for now
        url += statusQuery;
      }
      const response = await api.get(url);
      setReports(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const getStatusBadgeVariant = (status: Report['status']) => {
    switch (status) {
      case 'open': return 'destructive';
      case 'under_review': return 'outline';
      default: return 'secondary';
    }
  };

  return (
    <div className="bg-white dark:bg-neutral-800 shadow-md rounded-lg p-6">
      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-4">Manage Reports</h3>
      {/* Add filter buttons later */}
      
      {loading && <p className="text-center text-gray-500">Loading reports...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && reports.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Reporter</TableHead>
              <TableHead>Content Reported</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reports.map((report) => (
              <TableRow key={report._id}>
                <TableCell>{report.reporter.username}</TableCell>
                <TableCell>
                  <Link 
                    to={`/${report.reportedContentType.toLowerCase()}/${report.reportedContentId}`} 
                    target="_blank"
                    className="text-primary hover:underline"
                  >
                    {report.reportedContentType} ID: {report.reportedContentId.slice(-6)}
                  </Link>
                </TableCell>
                <TableCell>{report.reason}</TableCell>
                <TableCell>
                  <Badge variant={getStatusBadgeVariant(report.status)} className="capitalize">{report.status.replace('_', ' ')}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => setSelectedReport(report)}>
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : !loading && (
        <p className="text-center text-gray-500 py-8">No reports found matching the criteria.</p>
      )}
      <ReportDetailModal
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        report={selectedReport}
        onUpdate={fetchReports} // Pass the fetchReports function to refresh the list on update
      />
    </div>
  );
};

export default ManageReports;