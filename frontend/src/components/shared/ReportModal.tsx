// frontend/src/components/shared/ReportModal.tsx
import React, { useState } from 'react';

import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, ShieldAlert } from 'lucide-react';
import useAuthStore from '@/hooks/zustand/useAuthStore';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  contentId: string;
  contentType: 'Listing' | 'User';
  contentTitle: string; // The name of the listing or user
}

const reportReasons = [
  'Misleading or Inaccurate Information',
  'Potential Scam or Fraud',
  'Inappropriate Content or Harassment',
  'Spam',
  'Item Not As Described',
  'Other'
];

const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, contentId, contentType, contentTitle }) => {
  const { submitReport, loading } = useAuthStore();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      setError('Please select a reason for the report.');
      return;
    }
    setError(null);
    setSuccess(null);

    try {
      const message = await submitReport(contentId, contentType, reason, details);
      setSuccess(message);
      setTimeout(() => {
        handleClose();
      }, 3000); // Close modal automatically after 3 seconds on success
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setReason('');
    setDetails('');
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="report-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="report-modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-lg"
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-yellow-400" /> Report Content
            </h2>
            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400" onClick={handleClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>

          {success ? (
            <div className="p-8 text-center">
              <p className="text-green-400">{success}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <p className="text-sm text-neutral-400">
                You are reporting the {contentType.toLowerCase()}: <span className="font-semibold text-white">"{contentTitle}"</span>.
              </p>
              
              <div>
                <label className="text-sm font-medium text-neutral-300">Reason</label>
                <Select onValueChange={setReason} value={reason}>
                    <SelectTrigger className="w-full mt-1 bg-neutral-800 border-neutral-700 text-white">
                        <SelectValue placeholder="Select a reason..." />
                    </SelectTrigger>
                    <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                        {reportReasons.map(r => (
                            <SelectItem key={r} value={r} className="focus:bg-primary">{r}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
              </div>

              <div>
                 <label htmlFor="details" className="text-sm font-medium text-neutral-300">Additional Details (Optional)</label>
                 <Textarea 
                    id="details"
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please provide any additional information that could help our moderators."
                    className="mt-1 min-h-[100px] bg-neutral-800 border-neutral-700 text-white"
                 />
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="destructive" disabled={loading}>
                  {loading ? 'Submitting...' : 'Submit Report'}
                </Button>
              </div>
            </form>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ReportModal;