// frontend/src/components/admin/ReportDetailModal.tsx
import React, { useState } from 'react';
import api from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from 'lucide-react';

interface Report {
    _id: string;
    reporter: { _id: string; username: string; email: string };
    reportedContentId: string;
    reportedContentType: 'Listing' | 'User';
    reason: string;
    details?: string;
    status: 'open' | 'under_review' | 'resolved_no_action' | 'resolved_action_taken';
    createdAt: string;
    adminNotes?: string;
}

interface ReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: Report | null;
  onUpdate: () => void; // Function to refresh the list after an update
}

const reportStatuses = ['open', 'under_review', 'resolved_no_action', 'resolved_action_taken'];

const ReportDetailModal: React.FC<ReportDetailModalProps> = ({ isOpen, onClose, report, onUpdate }) => {
  const [newStatus, setNewStatus] = useState(report?.status || 'open');
  const [adminNotes, setAdminNotes] = useState(report?.adminNotes || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !report) return null;

  const handleUpdate = async () => {
    setLoading(true);
    setError('');
    try {
        await api.put(`/admin/reports/${report._id}`, {
            status: newStatus,
            adminNotes: adminNotes,
        });
        onUpdate(); // Refresh the list in the parent component
        onClose();
    } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to update report.');
    } finally {
        setLoading(false);
    }
  }

  return (
    <AnimatePresence>
      <motion.div onClick={onClose} className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-2xl"
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h2 className="text-xl font-bold text-white">Report Details</h2>
            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400" onClick={onClose}><X /></Button>
          </div>
          <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4">
            {/* Report Details Section */}
            <div>
                <p><strong className="text-neutral-400">Reporter:</strong> {report.reporter.username} ({report.reporter.email})</p>
                <p><strong className="text-neutral-400">Reported {report.reportedContentType}:</strong> {report.reportedContentId}</p>
                <p><strong className="text-neutral-400">Reason:</strong> {report.reason}</p>
                <p className="mt-2"><strong className="text-neutral-400">Details Provided:</strong></p>
                <p className="text-neutral-300 bg-black p-3 rounded-md mt-1">{report.details || 'No details provided.'}</p>
            </div>
            
            <div className="border-t border-neutral-800 pt-4 space-y-4">
                <h3 className="font-semibold text-lg">Admin Actions</h3>
                <div>
                    <label className="text-sm font-medium text-neutral-300">Update Status</label>
                    <Select onValueChange={(value) => setNewStatus(value as Report['status'])} defaultValue={report.status}>
                        <SelectTrigger className="w-full mt-1 bg-neutral-800 border-neutral-700"><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                            {reportStatuses.map(s => <SelectItem key={s} value={s} className="focus:bg-primary capitalize">{s.replace(/_/g, ' ')}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                <div>
                    <label htmlFor="adminNotes" className="text-sm font-medium text-neutral-300">Admin Notes</label>
                    <Textarea id="adminNotes" value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} className="mt-1 min-h-[100px] bg-neutral-800 border-neutral-700"/>
                </div>
                {error && <p className="text-sm text-red-500">{error}</p>}
                 <div className="flex justify-end gap-2">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleUpdate} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
                </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportDetailModal;