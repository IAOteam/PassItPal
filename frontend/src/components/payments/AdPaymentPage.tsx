// frontend/src/pages/payments/AdPaymentPage.tsx

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldCheck, AlertTriangle, CheckCircle } from 'lucide-react';

interface AdDetails {
    _id: string;
    adTitle: string;
    price: number;
}

const AdPaymentPage: React.FC = () => {
    const { adId } = useParams<{ adId: string }>();
    const navigate = useNavigate();
    const [ad, setAd] = useState<AdDetails | null>(null);
    const [status, setStatus] = useState<'loading' | 'ready' | 'processing' | 'success' | 'error'>('loading');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!adId) return;

        // Fetch ad details to show what's being paid for
        api.get(`/admin/ads/${adId}`) // Assuming an admin route to get ad details by ID
            .then(res => {
                setAd(res.data);
                setStatus('ready');
            })
            .catch(() => {
                setError('Could not find the ad to be paid for.');
                setStatus('error');
            });
    }, [adId]);

    const loadRazorpayScript = () => new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
    });

    const handlePayment = async () => {
        if (!ad) return;
        setStatus('processing');

        const scriptLoaded = await loadRazorpayScript();
        if (!scriptLoaded) {
            setError('Payment gateway failed to load. Please check your connection.');
            setStatus('error');
            return;
        }

        try {
            const order = await api.post(`/payments/ads/${adId}/create-order`);

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: order.data.amount,
                currency: order.data.currency,
                name: 'Passitpal Ad Publication',
                description: `Payment for: ${ad.adTitle}`,
                order_id: order.data.id,
                handler: async (response: any) => {
                    await api.post('/payments/ads/verify', {
                        ...response,
                        adId: ad._id,
                    });
                    setStatus('success');
                },
                theme: { color: '#2563EB' },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.open();
            // If user closes Razorpay modal, reset state
            rzp.on('payment.failed', () => {
                setError('Payment was not completed.');
                setStatus('ready');
            });

        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to initiate payment.');
            setStatus('error');
        }
    };

    const renderContent = () => {
        switch (status) {
            case 'loading': return <Loader2 className="h-12 w-12 animate-spin text-primary" />;
            case 'error': return <div className="text-center"><AlertTriangle className="mx-auto h-12 w-12 text-destructive" /><p className="mt-4">{error}</p></div>;
            case 'success': return <div className="text-center"><CheckCircle className="mx-auto h-12 w-12 text-green-500" /><p className="mt-4">Payment Successful! Your ad is now live.</p><Button onClick={() => navigate('/')} className="mt-4">Go to Homepage</Button></div>;
            case 'ready':
            case 'processing':
                return (
                    <>
                        <h2 className="text-2xl font-bold">Complete Your Payment</h2>
                        <p className="text-muted-foreground">Final step to get your ad published.</p>
                        <div className="my-6 border-t border-b py-4 space-y-2">
                            <div className="flex justify-between"><span>Ad Title:</span><span className="font-semibold">{ad?.adTitle}</span></div>
                            <div className="flex justify-between"><span>Amount:</span><span className="font-semibold">₹{ad?.price}</span></div>
                        </div>
                        <Button className="w-full" onClick={handlePayment} disabled={status === 'processing'}>
                            {status === 'processing' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                            Pay Securely with Razorpay
                        </Button>
                    </>
                );
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-neutral-950">
            <div className="w-full max-w-md p-8 space-y-4 bg-white rounded-lg shadow-2xl dark:bg-neutral-900">
                {renderContent()}
            </div>
        </div>
    );
};

export default AdPaymentPage;