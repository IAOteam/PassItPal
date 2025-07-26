import React, { useState, useEffect, useRef, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import useAuthStore from '@/hooks/zustand/useAuthStore';
import type { IChatMessage, IConversation } from '@passitpal/types';
import toast from 'react-hot-toast';
import EmojiPicker, {type  EmojiClickData } from 'emoji-picker-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { Send, Paperclip, X, Loader2, ArrowLeft, Smile, Check, CheckCheck } from 'lucide-react';
import { toBase64 } from '@/lib/utils';
import { useInView } from 'react-intersection-observer';


// --- API Fetching Function for TanStack Query ---
const fetchConversationMessages = async ({ pageParam = 1, queryKey }: any): Promise<{ conversation: IConversation; messages: IChatMessage[], nextPage: number | null }> => {
    const [_key, conversationId] = queryKey;
    const { data } = await api.get(`/messages/conversations/${conversationId}/messages?page=${pageParam}&limit=20`);
    return {
        ...data,
        nextPage: data.messages.length === 20 ? pageParam + 1 : null,
    };
};

// --- Message Bubble Component ---
const MessageBubble: React.FC<{ message: IChatMessage; isOwn: boolean; otherParticipantId?: string }> = ({ message, isOwn, otherParticipantId }) => {
    const isRead = otherParticipantId ? message.readBy.includes(otherParticipantId) : false;

    const renderTicks = () => {
        if (!isOwn) return null;
        if (message.status === 'sending') return <Check size={16} className="text-gray-400" />;
        if (isRead) return <CheckCheck size={16} className="text-blue-400" />;
        return <CheckCheck size={16} className="text-gray-400" />;
    };

    return (
        <div className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
            {!isOwn && <Avatar size="small" src={message.sender.profilePictureUrl} icon={<UserOutlined />} />}
            <div className={`max-w-xs md:max-w-md p-1 rounded-2xl flex flex-col ${isOwn ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-200 dark:bg-neutral-800 text-gray-900 dark:text-white rounded-bl-none'}`}>
                {message.imageUrl && <img src={message.imageUrl} alt="attachment" className="rounded-lg mb-1 max-w-full h-auto" />}
                {message.text && <p className="text-sm px-2 py-1 break-words">{message.text}</p>}
                <div className="flex items-center self-end px-2 pb-1">
                    <p className="text-xs opacity-70 mr-1">{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    {renderTicks()}
                </div>
            </div>
        </div>
    );
};


const ChatPage: React.FC = () => {
    const { conversationId } = useParams<{ conversationId: string }>();
    const { user, socket, sendSocketMessage } = useAuthStore();
    const queryClient = useQueryClient();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { ref: topRef, inView: isTopVisible } = useInView();

    const [newMessage, setNewMessage] = useState('');
    const [imageToSend, setImageToSend] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    // --- TanStack Infinite Query for paginated messages ---
    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error } = useInfiniteQuery({
        queryKey: ['conversation', conversationId],
        queryFn: fetchConversationMessages,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        initialPageParam: 1,
        enabled: !!conversationId,
    });

    const conversation = data?.pages[0]?.conversation;
    const messages = data?.pages.flatMap(page => page.messages) ?? [];
    const otherParticipant = conversation?.participants.find(p => p._id !== user?._id);

    // --- Effect for lazy loading ---
    useEffect(() => {
        if (isTopVisible && hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
        }
    }, [isTopVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

    // --- Effect to listen for incoming socket messages & read receipts ---
    useEffect(() => {
        if (socket) {
            /*const handleReceiveMessage = (incomingMessage: IChatMessage) => {
                if (incomingMessage.conversation === conversationId) {
                    queryClient.setQueryData(['conversation', conversationId], (oldData: any) => {
                        if (!oldData) return oldData;
                        const lastPage = oldData.pages[oldData.pages.length - 1];
                        if (lastPage.messages.some((m: IChatMessage) => m._id === incomingMessage._id)) return oldData;
                        const newLastPage = { ...lastPage, messages: [...lastPage.messages, incomingMessage] };
                        const newPages = [...oldData.pages.slice(0, -1), newLastPage];
                        return { ...oldData, pages: newPages };
                    });
                    // Mark as read immediately if chat is open
                    socket.emit('markAsRead', { conversationId });
                }
            };*/
            
            const handleReceiveMessage = (incomingMessage: IChatMessage) => {
                if (incomingMessage.conversation === conversationId) {
                    // Invalidate the query. This is simpler and more robust.
                    // It tells TanStack Query to refetch the messages, ensuring order and consistency.
                    queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
                    socket.emit('markAsRead', { conversationId });
                }
            };
            
            const handleMessagesRead = ({ conversationId: readConversationId, readerId }: { conversationId: string, readerId: string }) => {
                if (readConversationId === conversationId) {
                    queryClient.setQueryData(['conversation', conversationId], (oldData: any) => {
                        if (!oldData) return oldData;
                        const newPages = oldData.pages.map((page: any) => ({
                            ...page,
                            messages: page.messages.map((msg: IChatMessage) => {
                                if (!msg.readBy.includes(readerId)) {
                                    return { ...msg, readBy: [...msg.readBy, readerId] };
                                }
                                return msg;
                            })
                        }));
                        return { ...oldData, pages: newPages };
                    });
                }
            };

            socket.on('receiveMessage', handleReceiveMessage);
            socket.on('messagesRead', handleMessagesRead);

            return () => {
                socket.off('receiveMessage', handleReceiveMessage);
                socket.off('messagesRead', handleMessagesRead);
            };
        }
    }, [socket, conversationId, queryClient]);

    // --- Effect to mark messages as read when component mounts/becomes visible ---
    useEffect(() => {
        if (socket && conversationId) {
            socket.emit('markAsRead', { conversationId });
        }
    }, [socket, conversationId]);
    
    // --- Effect to scroll to bottom on new message ---
    useEffect(() => {
        if (messages.length > 0) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages.length]);


    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !imageToSend) || !conversationId || !user || !otherParticipant) return;
        
        let imageBase64: string | undefined;
        if (imageToSend) {
            imageBase64 = await toBase64(imageToSend) as string;
        }

        sendSocketMessage({ conversationId, text: newMessage, recipientId: otherParticipant._id, imageBase64 });

        setNewMessage('');
        setImageToSend(null);
        setImagePreview(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
        setShowEmojiPicker(false);
    };

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                toast.error("Image size cannot exceed 5MB.");
                return;
            }
            setImageToSend(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const onEmojiClick = (emojiObject: EmojiClickData) => {
        setNewMessage(prev => prev + emojiObject.emoji);
    };

    if (isLoading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin" /></div>;
    if (isError) return <div className="flex items-center justify-center h-full text-red-500">Error: {error.message}</div>;
    if (!conversation) return <div className="flex items-center justify-center h-full text-gray-500">Select a conversation to start chatting.</div>;

    return (
        <div className="flex flex-col h-full bg-white dark:bg-black">
            <header className="flex items-center p-3 border-b dark:border-neutral-800 flex-shrink-0">
                <Link to="/messages" className="md:hidden mr-2 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800">
                    <ArrowLeft size={20} />
                </Link>
                <Avatar src={otherParticipant?.profilePictureUrl} icon={<UserOutlined />} />
                <div className="ml-3">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{otherParticipant?.username}</h2>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-4">
                <div ref={topRef} className="h-1" />
                {isFetchingNextPage && <div className="text-center text-xs text-gray-500">Loading older messages...</div>}
                {messages.map((msg) => (
                    <MessageBubble key={msg._id} message={msg} isOwn={msg.sender._id === user?._id} otherParticipantId={otherParticipant?._id} />
                ))}
                <div ref={messagesEndRef} />
            </main>

            <footer className="p-3 border-t dark:border-neutral-800 flex-shrink-0">
                {imagePreview && (
                    <div className="relative w-24 h-24 mb-2 p-1 border rounded-md">
                        <img src={imagePreview} alt="preview" className="w-full h-full object-cover rounded"/>
                        <button onClick={() => { setImagePreview(null); setImageToSend(null); if(fileInputRef.current) fileInputRef.current.value = ""; }} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5">
                            <X size={14}/>
                        </button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/png, image/jpeg, image/webp" className="hidden"/>
                    <Button type="button" variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()}><Paperclip /></Button>
                    <Button type="button" variant="ghost" size="icon" onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile /></Button>
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type a message..." autoComplete="off" />
                    <Button type="submit" size="icon"><Send /></Button>
                </form>
                {showEmojiPicker && (
                    <div className="mt-2">
                        <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={350} />
                    </div>
                )}
            </footer>
        </div>
    );
};

export default ChatPage;
