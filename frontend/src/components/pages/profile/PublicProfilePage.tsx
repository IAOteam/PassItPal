import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom'; 
import api from '@/lib/api';
import StarRating from '@/components/ui/StarRating';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { IUser } from '@passitpal/types';


// Define the structure of a review object
interface IReview {
  _id: string;
  rating: number;
  comment?: string;
  reviewer: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
  createdAt: string;
}

const PublicProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<IUser | null>(null);
  const [reviews, setReviews] = useState<IReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setError("No user ID provided.");
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [profileRes, reviewsRes] = await Promise.all([
          api.get(`/users/profile/${userId}`),
          api.get(`/reviews/user/${userId}`)
        ]);
        setProfile(profileRes.data);
        setReviews(reviewsRes.data || []);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load profile data.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [userId]);

  if (loading) {
    return <div className="text-center p-10 text-white">Loading profile...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }
  
  if (!profile) {
    return <div className="text-center p-10 text-white">User not found.</div>;
  }

  const defaultProfilePicture = '/sharing.svg';

  return (
    <div className="bg-neutral-900 min-h-screen text-white">
      <div className="container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-black border border-neutral-800 rounded-lg p-6 text-center">
              <img
                src={profile.profilePictureUrl || defaultProfilePicture}
                alt={profile.username}
                className="w-32 h-32 rounded-full object-cover border-4 border-primary mx-auto mb-4"
              />
              <h2 className="text-3xl font-bold">{profile.username}</h2>
              <p className="text-neutral-400">{profile.city}</p>

              <div className="mt-6 pt-6 border-t border-neutral-800">
                <h3 className="text-lg font-semibold mb-3">Reputation</h3>
                <div className="flex items-center justify-center space-x-2">
                  <StarRating rating={profile.averageRating || 0} size={24} />
                  <span className="font-bold text-white text-lg">
                    {(profile.averageRating || 0).toFixed(1)}
                  </span>
                  <span className="text-neutral-400 text-sm">
                    ({profile.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Reviews List */}
          <div className="lg:col-span-2">
            <div className="bg-black border border-neutral-800 rounded-lg p-6">
              <h3 className="text-2xl font-bold mb-6">Reviews for {profile.username}</h3>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map(review => (
                    <div key={review._id} className="border-b border-neutral-800 pb-6 last:border-b-0 last:pb-0">
                      {/*  Reviewer Info is now a clickable link */}
                      <Link to={`/profile/${review.reviewer._id}`} className="flex items-center mb-2 group/reviewer">
                        <Avatar src={review.reviewer.profilePictureUrl} icon={<UserOutlined />} size={40} />
                        <div className="ml-4">
                          <p className="font-semibold text-white group-hover/reviewer:text-primary transition-colors">{review.reviewer.username}</p>
                          <p className="text-xs text-neutral-500">{new Date(review.createdAt).toLocaleDateString()}</p>
                        </div>
                      </Link>
                      <StarRating rating={review.rating} size={16} className="my-2" />
                      <p className="text-neutral-300">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-neutral-400">This user has not received any reviews yet.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default PublicProfilePage;

