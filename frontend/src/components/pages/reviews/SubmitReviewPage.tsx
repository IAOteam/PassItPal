// frontend/src/pages/reviews/SubmitReviewPage.tsx
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

const SubmitReviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { submitReview, loading } = useAuth();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!orderId) {
    return <div className="text-center p-10 text-red-500">Error: Order ID is missing.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }
    setError(null);

    try {
      const message = await submitReview(orderId, rating, comment);
      setSuccessMessage(message);
      setTimeout(() => navigate('/dashboard'), 2000); // Redirect after 2 seconds
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] bg-neutral-900 p-4">
      <div className="w-full max-w-lg p-8 space-y-6 bg-black rounded-lg shadow-2xl border border-neutral-800">
        <h2 className="text-3xl font-bold text-center text-white">Leave a Review</h2>
        
        {successMessage ? (
          <div className="text-center p-4 bg-green-900/50 border border-green-700 rounded-md">
            <p className="text-green-300">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label className="text-lg text-white text-center block mb-4">Your Rating</Label>
              <div className="flex justify-center items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    type="button"
                    key={star}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="focus:outline-none"
                  >
                    <Star
                      size={40}
                      className={cn(
                        'transition-colors cursor-pointer',
                        (hoverRating || rating) >= star
                          ? 'text-yellow-400'
                          : 'text-neutral-600'
                      )}
                      fill={ (hoverRating || rating) >= star ? 'currentColor' : 'none' }
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="comment" className="text-lg text-white">Your Comments (Optional)</Label>
              <Textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience with the transaction..."
                className="mt-2 min-h-[120px] bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            
            {error && (
                <div className="text-sm text-red-400 text-center">{error}</div>
            )}

            <Button type="submit" className="w-full  text-white  bg-neutral-600" size="lg" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Review'}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SubmitReviewPage;