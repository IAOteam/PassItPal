import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, ChevronLeft } from 'lucide-react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ChatMessage, Participant } from '@/types';
// import useMediaQuery from '@/hooks/useMediaQuery';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, socket, sendSocketMessage } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [recipient, setRecipient] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [newMessage, setNewMessage] = useState('');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  // No chat selected
  if (!conversationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 dark:text-neutral-400">
        <MessageSquare size={48} className="mb-4" />
        <h3 className="text-lg font-semibold">Select a conversation</h3>
        <p className="text-sm">Choose a chat from the left panel to start messaging.</p>
      </div>
    );
  }

  // Scroll to bottom
  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Fetch messages
  const fetchMessages = useCallback(async (pageNum = 1) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get(`/messages/conversations/${conversationId}/messages?page=${pageNum}`);
      const newMessages: ChatMessage[] = res.data.messages || [];

      if (pageNum === 1) {
        setMessages(newMessages);
        const otherUser = res.data.conversation?.participants?.find((p: Participant) => p._id !== user._id);
        setRecipient(otherUser || null);
      } else {
        setMessages(prev => [...newMessages, ...prev]);
      }

      setHasMore(newMessages.length > 0);
    } catch (err) {
      console.error("Failed to fetch chat details", err);
      navigate('/messages', { state: { message: "Could not load chat." } });
    } finally {
      setLoading(false);
      if (pageNum === 1) {
        setTimeout(() => scrollToBottom('auto'), 100);
      }
    }
  }, [conversationId, user, navigate]);

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  useEffect(() => {
    if (inputRef.current && !loading) {
      inputRef.current.focus();
    }
  }, [loading]);

  // Handle incoming messages
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message: ChatMessage) => {
      if (message.conversation === conversationId) {
        setMessages(prev => [...prev, message]);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, conversationId]);

  // Lazy-load older messages
  useEffect(() => {
    if (!topRef.current || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          fetchMessages(nextPage);
          return nextPage;
        });
      }
    }, { threshold: 1 });

    observer.observe(topRef.current);
    return () => observer.disconnect();
  }, [topRef, hasMore, fetchMessages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipient?._id) return;

    sendSocketMessage({ conversationId, text: newMessage, recipientId: recipient._id });

    const optimisticMsg: ChatMessage = {
      _id: new Date().toISOString(),
      conversation: conversationId,
      sender: {
        _id: user._id,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
      },
      text: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
  };
  const isMobile = window.innerWidth < 768;

  if (loading && messages.length === 0) {
    return <div className="h-full flex items-center justify-center text-neutral-500">Loading chat...</div>;
  }

  return (
    <div className="mt-10 flex flex-col h-full bg-white dark:bg-black overflow-hidden">
      {/* Header */}
      <header className="p-3 border-b flex items-center gap-3 flex-shrink-0 dark:border-neutral-800">
        <Avatar src={recipient?.profilePictureUrl} icon={<UserOutlined />} size={40} />
        <div className="flex-grow">
          <h2 className="text-base font-semibold dark:text-white">{recipient?.username || 'User'}</h2>
        </div>
      </header>
      {isMobile && (
          <button
            className="md:hidden absolute left-2 top-2 p-2 rounded-full hover:bg-neutral-100 dark:hover:bg-neutral-800"
            onClick={() => navigate('/messages')}
            aria-label="Back to conversations"
          >
            <ChevronLeft size={24} className="text-neutral-700 dark:text-white" />
          </button>
        )}

      {/* Messages */}
      <div className="flex-grow p-4 overflow-y-auto space-y-4">
        <div ref={topRef} className="h-1" />
        {messages.map(msg => {
          const isOwn = msg.sender._id === user?._id;
          return (
            <div key={msg._id} className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                  isOwn
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-gray-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-75 mt-1 text-right">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          );
        })}
        {hasMore && <div className="text-center text-sm text-neutral-400">Loading older messages...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 border-t flex items-center gap-3 bg-gray-50 dark:bg-neutral-900/50 dark:border-neutral-800 flex-shrink-0"
      >
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-grow bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
        />
        <Button type="submit" disabled={!newMessage.trim()} size="icon">
          <Send className="h-5 w-5 text-white dark:text-green-500 " />
        </Button>
      </form>
    </div>
  );
};

export default ChatPage;
