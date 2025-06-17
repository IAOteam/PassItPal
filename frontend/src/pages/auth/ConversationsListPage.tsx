// frontend/src/pages/auth/ConversationsListPage.tsx (Refactored)
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils'; // We'll use this for conditional styling
import type { User } from '@/context/AuthContext';

// Conversation interface (can be moved to a types file later)
interface Conversation {
  _id: string;
  participants: (User & { _id:string })[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
}

const ConversationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversationId: activeConversationId } = useParams(); // Get active chat ID from URL

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
    // ... (timeSince function remains the same)
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
    <div className="h-full flex flex-col">
      <h2 className="p-4 text-lg font-semibold border-b dark:border-neutral-800 dark:text-white flex-shrink-0">
        Chats
      </h2>
      <div className="flex-grow overflow-y-auto">
        {loading && <p className="p-4 text-center text-sm text-neutral-500">Loading...</p>}
        {error && <p className="p-4 text-center text-sm text-red-500">{error}</p>}
        {!loading && !error && (
          conversations.length > 0 ? (
            <ul>
              {conversations.map((convo) => {
                const otherParticipant = convo.participants.find(p => p._id !== user?._id);
                return (
                  <li
                    key={convo._id}
                    onClick={() => navigate(`/messages/${convo._id}`)}
                    className={cn(
                      "p-3 border-b dark:border-neutral-800/50 cursor-pointer transition-colors flex items-center space-x-3",
                      activeConversationId === convo._id
                        ? 'bg-blue-600/20 dark:bg-blue-500/20' // Active chat style
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                    )}
                  >
                    <Avatar src={otherParticipant?.profilePictureUrl} icon={<UserOutlined />} size={48} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                          {otherParticipant?.username || 'Unknown User'}
                        </p>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-2">
                          {timeSince(convo.updatedAt)}
                        </p>
                      </div>
                      <p className="text-sm text-neutral-600 dark:text-neutral-300 truncate mt-1">
                        {convo.lastMessage?.text || 'No messages yet...'}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="p-4 text-center text-sm text-neutral-500">No conversations found.</p>
          )
        )}
      </div>
    </div>
  );
};

export default ConversationsListPage;