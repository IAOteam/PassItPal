// frontend/src/pages/AdvertisePage.tsx

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import api from '@/lib/api';

const AdvertisePage: React.FC = () => {
    const [formData, setFormData] = useState({
        sponsorName: '',
        adTitle: '',
        adDescription: '',
        targetUrl: 'https://',
        durationDays: 7,
    });
    const [message, setMessage] = useState<string | null>(null);
    const [isError, setIsError] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage(null);
        setIsError(false);
        try {
            const response = await api.post('/ads/submit', formData);
            setMessage(response.data.message);
            setFormData({ sponsorName: '', adTitle: '', adDescription: '', targetUrl: 'https://', durationDays: 7 }); // Reset form
        } catch (err: any) {
            setMessage(err.response?.data?.message || 'An error occurred.');
            setIsError(true);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto max-w-2xl py-12">
            <h1 className="text-4xl font-bold mb-4 text-center">Advertise With Us</h1>
            <p className="text-center text-muted-foreground mb-8">Reach a targeted audience of active buyers. Submit your ad for review.</p>
            <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-lg shadow-md">
                {message && (
                    <div className={`p-3 text-sm rounded ${isError ? 'bg-destructive/20 text-destructive' : 'bg-primary/20 text-primary'}`}>
                        {message}
                    </div>
                )}
                <div className="space-y-2">
                    <Label htmlFor="sponsorName">Sponsor/Company Name</Label>
                    <Input id="sponsorName" value={formData.sponsorName} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adTitle">Ad Title</Label>
                    <Input id="adTitle" value={formData.adTitle} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="adDescription">Ad Description</Label>
                    <Textarea id="adDescription" value={formData.adDescription} onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="targetUrl">Target URL (e.g., your website)</Label>
                    <Input id="targetUrl" type="url" value={formData.targetUrl} onChange={handleChange} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="durationDays">Ad Duration (in days)</Label>
                    <Input id="durationDays" type="number" min="1" value={formData.durationDays} onChange={handleChange} required />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit for Review'}
                </Button>
            </form>
        </div>
    );
};

export default AdvertisePage;