// frontend/src/pages/ConversationsListPage.tsx (New File)
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth'; 
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { User } from '@/context/AuthContext';

// Define the shape of a conversation object from the API
interface Conversation {
  _id: string;
  participants: (User & { _id: string })[]; // Participants are populated user objects
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
}

const ConversationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/messages/conversations/me');
      setConversations(response.data || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch conversations.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const timeSince = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "Just now";
    let interval = seconds / 31536000;
    if (interval > 1) return `${Math.floor(interval)}y ago`;
    interval = seconds / 2592000;
    if (interval > 1) return `${Math.floor(interval)}mo ago`;
    interval = seconds / 86400;
    if (interval > 1) return `${Math.floor(interval)}d ago`;
    interval = seconds / 3600;
    if (interval > 1) return `${Math.floor(interval)}h ago`;
    interval = seconds / 60;
    return `${Math.floor(interval)}m ago`;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">My Messages</h1>

      {loading && <p className="text-center text-gray-500">Loading conversations...</p>}
      {error && <p className="text-center text-red-500">{error}</p>}
      
      {!loading && !error && (
        <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-md border">
          {conversations.length > 0 ? (
            <ul className="divide-y divide-gray-200 dark:divide-neutral-800">
              {conversations.map((convo) => {
                // Find the other participant in the conversation
                const otherParticipant = convo.participants.find(p => p._id !== user?._id);
                return (
                  <li 
                    key={convo._id} 
                    className="p-4 hover:bg-gray-50 dark:hover:bg-neutral-800/50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/chat/${convo._id}`)}
                  >
                    <div className="flex items-center space-x-4">
                      <Avatar
                        src={otherParticipant?.profilePictureUrl}
                        icon={<UserOutlined />}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-primary truncate">
                            {otherParticipant?.username || 'Unknown User'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {timeSince(convo.updatedAt)}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                          {convo.lastMessage?.text || 'No messages yet...'}
                        </p>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-16">
              <h4 className="text-lg font-medium">You have no active conversations.</h4>
              <p className="text-gray-500 mt-1">Start a conversation by contacting a seller from a listing.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConversationsListPage;
