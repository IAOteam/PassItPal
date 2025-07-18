import React, { useEffect, useState } from 'react';

import api from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import useAuthStore from '@/hooks/zustand/useAuthStore';

interface ListingForPromotion {
  _id: string;
  cultPassType: string;
}

interface PromotionPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  listing: ListingForPromotion | null;
  onSuccess: () => void; // To refresh the dashboard list
}

const PROMOTION_PRICE = 99; // Price in INR

const PromotionPaymentModal: React.FC<PromotionPaymentModalProps> = ({ isOpen, onClose, listing, onSuccess }) => {
  const { user, createPromotionOrder } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // This effect triggers the payment process when the modal opens
  useEffect(() => {
    if (isOpen && listing) {
      initiatePayment();
    }
  }, [isOpen, listing]);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const initiatePayment = async () => {
    if (!listing) return;
    setLoading(true);
    setError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Could not load payment script. Please check your internet connection.');
      setLoading(false);
      return;
    }

    try {
      // 1. Create an order on our backend
      const order = await createPromotionOrder(listing._id, PROMOTION_PRICE);

      // 2. Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Passitpal Listing Promotion',
        description: `Promoting: ${listing.cultPassType}`,
        order_id: order.id,
        handler: async function (response: any) {
          // 3. Verify the payment on our backend
          setLoading(true);
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              listingId: listing._id,
            });
            alert('Payment successful! Your listing has been promoted.');
            onSuccess(); // Refresh the dashboard
            onClose(); // Close the modal
          } catch (verificationError: any) {
            setError(verificationError.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: user?.username || '',
          email: user?.email || '',
          contact: user?.mobileNumber || '',
        },
        theme: {
          color: '#2563EB',
        },
      };

      // 4. Open the Razorpay checkout modal
      const rzp = new (window as any).Razorpay(options);
      rzp.open();
      setLoading(false);

    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        onClick={onClose}
        className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl w-full max-w-md"
        >
          <div className="flex items-center justify-between p-4 border-b border-neutral-800">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="text-primary" /> Promote Your Listing
            </h2>
            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400" onClick={onClose}><X /></Button>
          </div>
          <div className="p-8 text-center text-white">
            {loading && (
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-neutral-300">Initializing secure payment...</p>
                <p className="text-xs text-neutral-500">Please do not close this window.</p>
              </div>
            )}
            {error && (
              <div className="text-red-400">
                <p className="font-semibold">Payment Error</p>
                <p className="text-sm mt-2">{error}</p>
                <Button variant="secondary" className="mt-4" onClick={onClose}>Close</Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionPaymentModal;

