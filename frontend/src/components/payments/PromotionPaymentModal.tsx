import React, { useEffect, useState } from 'react';

import api from '@/lib/api';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { X, ShieldCheck, Loader2, Zap } from 'lucide-react';
import useAuthStore from '@/hooks/zustand/useAuthStore';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

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

const promotionTiers = [
  { durationDays: 7, price: 39, name: 'Standard', description: 'Feature your listing for a week.' },
  { durationDays: 30, price: 99, name: 'Premium', description: 'Get a full month of visibility.', popular: true },
];
const PromotionPaymentModal: React.FC<PromotionPaymentModalProps> = ({ isOpen, onClose, listing, onSuccess }) => {
  const { user, createPromotionOrder } = useAuthStore();
  const [status, setStatus] = useState<'selecting' | 'processing' | 'error'>('selecting');
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState(promotionTiers[0]);

  // This effect triggers the payment process when the modal opens
  // useEffect(() => {
  //   if (isOpen && listing) {
  //     initiatePayment();
  //   }
  // }, [isOpen, listing]);

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
    setStatus('processing');
    setError(null);

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded) {
      setError('Could not load payment script. Please check your internet connection.');
      setStatus('error');
      return;
    }

    try {
      //  Create an order on our backend
      const order = await api.post('/payments/create-order', {
        listingId: listing._id,
        amount: selectedTier.price,
        durationDays: selectedTier.durationDays,
      });
      //  Configure Razorpay options
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.data.amount,
        currency: order.data.currency,
        name: 'Passitpal Listing Promotion',
        description: `Promoting: ${listing.cultPassType} for ${selectedTier.durationDays} days`,
        
        order_id: order.data.id,
        handler: async function (response: any) {
          // Verify the payment on our backend
          setStatus('processing');
          try {
            await api.post('/payments/verify', {
              ...response,
              listingId: listing._id,
              durationDays: selectedTier.durationDays,
            });
            toast.success('Payment successful! Your listing has been promoted.');
            onSuccess(); // Refresh the dashboard
            onClose(); // Close the modal
          } catch (verificationError: any) {
            setError(verificationError.response?.data?.message || 'Payment verification failed. Please contact support.');
          } finally {
            setStatus('error');
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
        modal: {
            ondismiss: () => {
                setStatus('selecting'); // Reset status if user closes the Razorpay modal
            }
        }
      };

      // Open the Razorpay checkout modal
      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment.');
      setStatus('error');
    }
  };

  const handleClose = () => {
    setStatus('selecting');
    setError(null);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        onClick={handleClose}
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
              <Zap className="text-yellow-400" /> Promote Your Listing
            </h2>
            <Button variant="ghost" size="icon" className="rounded-full text-neutral-400" onClick={handleClose}><X /></Button>
          </div>
          <div className="p-6 text-white">
            {status === 'selecting' && (
              <div className="space-y-4">
                <p className="text-sm text-center text-neutral-400">Choose a promotion tier to boost your listing's visibility.</p>
                {promotionTiers.map(tier => (
                  <div key={tier.name} onClick={() => setSelectedTier(tier)} className={cn(
                      "p-4 border rounded-lg cursor-pointer transition-all relative",
                      selectedTier.name === tier.name ? "border-primary ring-2 ring-primary" : "border-neutral-700 hover:border-neutral-500"
                  )}>
                    {tier.popular && <div className="absolute -top-2.5 right-2 text-xs bg-yellow-400 text-black font-bold px-2 py-0.5 rounded-full">POPULAR</div>}
                    <h3 className="font-semibold">{tier.name} - ₹{tier.price}</h3>
                    <p className="text-sm text-neutral-400">{tier.description}</p>
                  </div>
                ))}
                <Button className="w-full mt-4" onClick={initiatePayment}>
                    <ShieldCheck className="mr-2 h-4 w-4" /> Pay ₹{selectedTier.price} and Promote
                </Button>
              </div>
            )}
            {status === 'processing' && (
              <div className="flex flex-col items-center gap-4 text-center h-40 justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-neutral-300">Processing secure payment...</p>
                <p className="text-xs text-neutral-500">Please do not close this window.</p>
              </div>
            )}
            {status === 'error' && (
              <div className="text-red-400 text-center h-40 flex flex-col justify-center">
                <p className="font-semibold">Payment Error</p>
                <p className="text-sm mt-2">{error}</p>
                <Button variant="secondary" className="mt-4" onClick={() => setStatus('selecting')}>Try Again</Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PromotionPaymentModal;