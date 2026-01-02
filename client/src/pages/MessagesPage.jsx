import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import { MessageCircle, Send, User, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { SkeletonConversationItem, SkeletonMessage } from '../components/ui/Skeleton';

export default function MessagesPage() {
    const { user } = useAuthStore();
    const [conversations, setConversations] = useState([]);
    const [selectedConversation, setSelectedConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (selectedConversation) {
            fetchMessages(selectedConversation.id);
        }
    }, [selectedConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await api.get('/api/v1/conversations');
            setConversations(response.conversations || []);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (conversationId) => {
        setMessagesLoading(true);
        try {
            const response = await api.get(`/api/v1/conversations/${conversationId}/messages`);
            setMessages(response.messages || []);
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setMessagesLoading(false);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedConversation) return;

        setSending(true);
        try {
            const response = await api.post(`/api/v1/conversations/${selectedConversation.id}/messages`, {
                content: newMessage.trim()
            });
            setMessages(prev => [...prev, response.message]);
            setNewMessage('');
        } catch (error) {
            toast.error('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    const getOtherParticipantName = (conversation) => {
        return conversation.participants
            ?.filter(p => p !== user?.id)
            .join(', ') || 'Unknown';
    };

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-4rem)] flex">
                {/* Conversations List */}
                <div className="w-80 border-r border-zinc-800 flex flex-col">
                    <div className="p-4 border-b border-zinc-800">
                        <h2 className="text-lg font-semibold text-white">Messages</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <>
                                {[...Array(5)].map((_, i) => (
                                    <SkeletonConversationItem key={i} />
                                ))}
                            </>
                        ) : conversations.length === 0 ? (
                            <div className="p-4 text-center text-zinc-400">
                                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No conversations yet</p>
                            </div>
                        ) : (
                            conversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`w-full p-4 text-left border-b border-zinc-800 hover:bg-zinc-900 transition-colors ${selectedConversation?.id === conversation.id ? 'bg-zinc-900' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                            <User className="w-5 h-5 text-zinc-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-white truncate">
                                                {getOtherParticipantName(conversation)}
                                            </p>
                                            <p className="text-xs text-zinc-500">
                                                {conversation.lastMessageAt
                                                    ? new Date(conversation.lastMessageAt).toLocaleDateString()
                                                    : 'No messages'}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Messages Panel */}
                <div className="flex-1 flex flex-col">
                    {selectedConversation ? (
                        <>
                            <div className="p-4 border-b border-zinc-800 flex items-center gap-3">
                                <button
                                    onClick={() => setSelectedConversation(null)}
                                    className="md:hidden p-1 text-zinc-400 hover:text-white"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                </button>
                                <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-zinc-400" />
                                </div>
                                <span className="font-medium text-white">
                                    {getOtherParticipantName(selectedConversation)}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {messagesLoading ? (
                                    <>
                                        <SkeletonMessage />
                                        <SkeletonMessage isOwn />
                                        <SkeletonMessage />
                                        <SkeletonMessage isOwn />
                                        <SkeletonMessage />
                                    </>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex ${message.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] ${message.senderId === user?.uid
                                                ? 'bg-white text-black'
                                                : 'bg-zinc-800 text-white'
                                                } rounded-lg p-3`}>
                                                <p>{message.content}</p>
                                                <p className={`text-xs mt-1 ${message.senderId === user?.uid ? 'text-zinc-500' : 'text-zinc-400'}`}>
                                                    {new Date(message.createdAt).toLocaleTimeString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-800">
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="px-4 py-2 bg-white text-black rounded-lg font-medium hover:bg-zinc-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        <div className="flex-1 flex items-center justify-center">
                            <div className="text-center">
                                <MessageCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-white mb-2">Select a Conversation</h3>
                                <p className="text-zinc-400">Choose a conversation to start messaging</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
