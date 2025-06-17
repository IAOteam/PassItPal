// frontend/src/pages/auth/ChatPage.tsx (Refactored)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare } from 'lucide-react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';

// Interfaces (can be moved to a types file later)
interface Message {
  _id: string;
  conversation: string;
  sender: { _id: string; username?: string; profilePictureUrl?: string; };
  text: string;
  createdAt: string;
}
interface Participant {
  _id: string;
  username?: string;
  profilePictureUrl?: string;
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, socket, sendSocketMessage } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [recipient, setRecipient] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const [newMessage, setNewMessage] = useState('');

  // --- NEW: Handle the case where no chat is selected ---
  if (!conversationId) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center text-neutral-500 dark:text-neutral-400">
        <MessageSquare size={48} className="mb-4" />
        <h3 className="text-lg font-semibold">Select a conversation</h3>
        <p className="text-sm">Choose a chat from the left panel to start messaging.</p>
      </div>
    );
  }

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      setMessages(response.data.messages || []);
      const otherUser = response.data.conversation?.participants?.find((p: Participant) => p._id !== user._id);
      setRecipient(otherUser || null);
    } catch (error) {
      console.error("Failed to fetch chat details", error);
      navigate('/messages', { state: { message: "Could not load chat." } });
    } finally {
      setLoading(false);
      setTimeout(() => scrollToBottom('auto'), 100);
    }
  }, [conversationId, user, navigate]);

  useEffect(() => {
    fetchConversationDetails();
  }, [fetchConversationDetails]);

  useEffect(() => {
    if (!socket) return;
    const handleReceiveMessage = (message: Message) => {
      if (message.conversation === conversationId) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    };
    socket.on('receiveMessage', handleReceiveMessage);
    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
    };
  }, [socket, conversationId]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !recipient?._id) return;
    sendSocketMessage({ conversationId, text: newMessage, recipientId: recipient._id });
    const optimisticMessage: Message = {
      _id: new Date().toISOString(),
      conversation: conversationId,
      sender: { _id: user._id, username: user.username, profilePictureUrl: user.profilePictureUrl },
      text: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
  };

  if (loading) {
    return <div className="h-full flex items-center justify-center text-neutral-500">Loading Chat...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
        {/* NEW Panel Header */}
        <header className="p-3 border-b flex items-center gap-3 flex-shrink-0 dark:border-neutral-800">
            <Avatar src={recipient?.profilePictureUrl} icon={<UserOutlined />} size={40} />
            <div className="flex-grow">
                <h2 className="text-base font-semibold dark:text-white">{recipient?.username || 'User'}</h2>
            </div>
        </header>

        {/* Message Area */}
        <div className="flex-grow p-4 overflow-y-auto space-y-4">
            {messages.map((msg) => (
            <div
                key={msg._id}
                className={`flex items-end gap-2 ${msg.sender._id === user?._id ? 'justify-end' : 'justify-start'}`}
            >
                <div
                className={`max-w-xs md:max-w-md p-3 rounded-2xl ${
                    msg.sender._id === user?._id
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-gray-200 rounded-bl-none'
                }`}
                >
                <p className="text-sm">{msg.text}</p>
                <p className="text-xs opacity-75 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
            </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Message Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 border-t flex items-center gap-3 bg-gray-50 dark:bg-neutral-900/50 dark:border-neutral-800 flex-shrink-0">
            <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            autoComplete="off"
            className="flex-grow bg-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
            />
            <Button type="submit" disabled={!newMessage.trim()} size="icon">
            <Send className="h-5 w-5" />
            </Button>
        </form>
    </div>
  );
};

export default ChatPage;