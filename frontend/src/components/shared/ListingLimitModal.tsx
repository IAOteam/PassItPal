import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { X, Star, ArrowRight } from 'lucide-react';

interface ListingLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

const ListingLimitModal: React.FC<ListingLimitModalProps> = ({ isOpen, onClose, message }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="limit-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          key="limit-modal-content"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md text-center p-8"
        >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-500 mb-4">
                <Star className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Free Limit Reached</h2>
            <p className="text-neutral-400 mt-2 mb-6">{message}</p>
            
            <div className="space-y-3">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90" size="lg">
                    Upgrade to Premium <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="ghost" className="w-full text-neutral-300" onClick={onClose}>
                    Maybe Later
                </Button>
            </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ListingLimitModal;
