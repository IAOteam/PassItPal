import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { cn } from '@/lib/utils';
import type { User } from '@/context/AuthContext';
import type { Participant } from '@/types';

interface Conversation {
  _id: string;
  participants: (User & { _id: string })[];
  lastMessage?: {
    text: string;
    createdAt: string;
  };
  updatedAt: string;
}

const ConversationsListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversationId: activeConvId } = useParams<{ conversationId: string }>();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/messages/conversations/me');
      setConversations(res.data || []);
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
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const intervals = [
      { label: 'y', seconds: 31536000 },
      { label: 'mo', seconds: 2592000 },
      { label: 'd', seconds: 86400 },
      { label: 'h', seconds: 3600 },
      { label: 'm', seconds: 60 },
    ];
    for (const i of intervals) {
      const v = Math.floor(seconds / i.seconds);
      if (v >= 1) return `${v}${i.label} ago`;
    }
    return `${seconds}s ago`;
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-black">
      <h2 className="p-4 text-lg font-semibold border-b dark:border-neutral-800 dark:text-white flex-shrink-0">
        Chats
      </h2>
      <div className="flex-grow overflow-y-auto">
        {loading && (
          <p className="p-4 text-center text-sm text-neutral-500">Loading...</p>
        )}
        {error && (
          <p className="p-4 text-center text-sm text-red-500">{error}</p>
        )}
        {!loading && !error && (
          <>
            {conversations.length > 0 ? (
              <ul>
                {conversations.map((convo) => {
                  const other = convo.participants.find(p => p._id !== user?._id) as Participant;
                  const active = activeConvId === convo._id;
                  return (
                    <li
                      key={convo._id}
                      onClick={() => navigate(`/messages/${convo._id}`)}
                      className={cn(
                        'p-3 border-b dark:border-neutral-800/50 cursor-pointer flex items-center gap-3 transition-colors',
                        active
                          ? 'bg-blue-600/20 dark:bg-blue-500/20'
                          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                      )}
                    >
                      <Avatar
                        src={other?.profilePictureUrl}
                        icon={<UserOutlined />}
                        size={48}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                            {other?.username || 'Unknown User'}
                          </p>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400 flex-shrink-0 ml-2">
                            {timeSince(convo.updatedAt)}
                          </span>
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
              <p className="p-4 text-center text-sm text-neutral-500">
                No conversations found.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ConversationsListPage;
