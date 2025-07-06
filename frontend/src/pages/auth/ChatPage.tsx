import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, MessageSquare, ChevronLeft, Paperclip, X, Clock, AlertCircle } from 'lucide-react';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { ChatMessage, Participant } from '@/types';
// import useMediaQuery from '@/hooks/useMediaQuery';

const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const { user, socket, sendSocketMessage } = useAuth();
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

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


  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        setImageFile(file);
        setImagePreview(URL.createObjectURL(file));
    }
  };

// Helper to convert file to base64
  const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });


  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !imageFile) || !user || !recipient?._id) return;

    const tempId = new Date().toISOString(); // Temporary ID for optimistic UI
    let imagePreviewUrl: string | null = null;
    let imageBase64: string | undefined;
    if (imageFile) {
        imagePreviewUrl = URL.createObjectURL(imageFile);
        imageBase64 = await toBase64(imageFile);
    }

    const optimisticMsg: ChatMessage = {
      _id: tempId,
      conversation: conversationId,
      sender: {
        _id: user._id,
        username: user.username,
        profilePictureUrl: user.profilePictureUrl,
      },
      text: newMessage,
      imageUrl: imagePreviewUrl ?? undefined,
      createdAt: new Date().toISOString(),
      status: 'sending',
    };

    setMessages(prev => [...prev, optimisticMsg]);
    setNewMessage('');
    setImageFile(null);
    setImagePreview(null);

    try {
      // This assumes sendSocketMessage is now handled properly with acks or separate events
      // to update message status from 'sending' to 'sent' or 'failed'
      if (recipient) {
        let imageBase64ToSend: string | undefined = imageBase64;
        sendSocketMessage({ conversationId: conversationId!, text: newMessage, recipientId: recipient._id, imageBase64: imageBase64ToSend });
      }
    } catch (error) {
      // Update the message status to 'failed' on error
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, status: 'failed' } : m));
    }
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
                className={`max-w-xs md:max-w-md rounded-2xl ${
                  isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 text-gray-800 dark:bg-neutral-800 dark:text-gray-200 rounded-bl-none'
                } ${msg.imageUrl ? 'p-1' : 'p-3'}`} // Reduce padding if there's an image
              >
                {/* --- Image Rendering Logic --- */}
                {msg.imageUrl && (
                  <img src={msg.imageUrl} alt="Chat attachment" className="rounded-lg max-w-full cursor-pointer" onClick={() => window.open(msg.imageUrl, '_blank')} />
                )}

                {/* Render text only if it exists */}
                {msg.text && (
                  <p className={`text-sm ${msg.imageUrl ? 'pt-2 px-2' : ''}`}>{msg.text}</p>
                )}

                
                <div className="flex items-center justify-end ...">
                  <p className="text-xs opacity-75 mt-1 text-right px-2">
                  {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </p>
                  {/* {msg.status === 'sending' && <Clock size={12} className="ml-1 animate-spin" />} */}
                  {msg.status === 'failed' && <AlertCircle size={12} className="ml-1 text-red-500" />}
              </div>
              </div>
            </div>
          );
        })}
        {hasMore && <div className="text-center text-sm text-neutral-400">Loading older messages...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-gray-50 dark:bg-neutral-900/50 dark:border-neutral-800 flex-shrink-0">
          {/* --- Image Preview --- */}
          {imagePreview && (
              <div className="relative w-24 h-24 mb-2 p-2 bg-gray-200 dark:bg-neutral-800 rounded-lg">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover rounded-md" />
                  <button
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700"
                      aria-label="Remove image"
                  >
                      <X size={14} />
                  </button>
              </div>
          )}
          <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              {/* --- Attach Button --- */}
              <label htmlFor="image-upload" className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-neutral-700 cursor-pointer">
                  <Paperclip className="h-5 w-5 text-green-600 dark:text-neutral-300" />
              </label>
              <input id="image-upload" type="file" className="hidden" accept="image/*" onChange={handleImageSelect} />

              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                autoComplete="off"
                className="flex-grow bg-white text-white dark:bg-neutral-800 border-neutral-300 dark:border-neutral-700"
              />
              <Button type="submit" disabled={!newMessage.trim() && !imageFile} size="icon">
                <Send className="h-5 w-5 text-green-600" />
              </Button>
          </form>
        </div>
    </div>
  );
};

export default ChatPage;
