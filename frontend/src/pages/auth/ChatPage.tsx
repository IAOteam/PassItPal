// frontend/src/pages/ChatPage.tsx (New File)
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { Avatar } from 'antd'; 
import { UserOutlined } from '@ant-design/icons';

interface Message {
  _id: string;
  conversation: string;
  sender: {
    _id: string;
    username?: string;
    profilePictureUrl?: string;
  };
  text: string;
  createdAt: string;
}
interface Participant {
  _id: string;
  username?: string;
  profilePictureUrl?: string;
}

interface ConversationDetails {
    participants: {
        _id: string;
        username?: string;
        profilePictureUrl?: string;
    }[];
}

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, socket, sendSocketMessage } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState<Participant | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = (behavior: 'smooth' | 'auto' = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversationDetails = useCallback(async () => {
    if (!conversationId || !user) return;
    setLoading(true);
    try {
      const response = await api.get(`/messages/conversations/${conversationId}/messages`);
      
      const fetchedMessages: Message[] = response.data.messages || [];
      const conversationDetails = response.data.conversation;

      setMessages(fetchedMessages);


      // Determine the recipient from the conversation participants
      // This part requires an endpoint to get conversation details, for now we will infer
      if (conversationDetails && conversationDetails.participants) {
        const otherUser = conversationDetails.participants.find((p: Participant) => p._id !== user._id);
        if (otherUser) {
          setRecipient(otherUser);
        } else {
          console.warn("Could not determine recipient from participants list.");
        }
      }

    } catch (error) {
      console.error("Failed to fetch chat details", error);
      navigate('/dashboard', { state: { message: "Could not load chat." } });
    } finally {
      setLoading(false);
      // Use timeout to ensure DOM has updated before scrolling
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
    if (!newMessage.trim() || !conversationId || !user || !recipient?._id) return;
    
    sendSocketMessage({
      conversationId,
      text: newMessage,
      recipientId: recipient._id,
    });
    
    const optimisticMessage: Message = {
      _id: new Date().toISOString(), // Temporary unique key
      conversation: conversationId,
      sender: { _id: user._id, username: user.username, profilePictureUrl: user.profilePictureUrl },
      text: newMessage,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, optimisticMessage]);
    setNewMessage('');
  };

  if (loading) {
    return <div className="text-center p-10">Loading Chat...</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-3xl mx-auto border rounded-lg shadow-md bg-white dark:bg-neutral-900">
        <header className="p-4 border-b flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}><ArrowLeft className="h-5 w-5" /></Button>
            {/* <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button> */}
            <h2 className="text-lg font-semibold">Chat with {recipient?.username || 'User'}</h2>
        </header>
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
                  : 'bg-gray-200 text-gray-800 dark:bg-neutral-700 dark:text-gray-200 rounded-bl-none'
              }`}
            >
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs opacity-75 mt-1 text-right">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t flex items-center gap-3 bg-gray-50 dark:bg-neutral-800">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          autoComplete="off"
          className="flex-grow"
        />
        <Button type="submit" disabled={!newMessage.trim()} size="icon">
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

export default ChatPage;
