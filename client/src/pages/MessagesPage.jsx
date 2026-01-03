import { useState, useEffect, useRef } from 'react';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import { api } from '../lib/api';
import { useAuthStore } from '../store/useAuthStore';
import {
    MessageCircle,
    Send,
    User,
    ArrowLeft,
    Search,
    MoreVertical,
    Phone,
    Video,
    Image as ImageIcon,
    Paperclip,
    Smile
} from 'lucide-react';
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
    const [searchTerm, setSearchTerm] = useState('');
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

    const filteredConversations = conversations.filter(c =>
        getOtherParticipantName(c).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <DashboardLayout>
            <div className="h-[calc(100vh-5rem)] flex gap-6">
                {/* Conversations List Sidebar */}
                <div className="w-96 flex flex-col bg-zinc-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl">
                    {/* Header */}
                    <div className="p-4 border-b border-white/[0.08] bg-black/20">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
                            <button className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-white transition-colors" />
                            <input
                                type="text"
                                placeholder="Search messages..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-white/20 focus:bg-black/60 transition-all"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                        {loading ? (
                            [...Array(5)].map((_, i) => <SkeletonConversationItem key={i} />)
                        ) : filteredConversations.length === 0 ? (
                            <div className="py-12 text-center text-zinc-500 flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4">
                                    <MessageCircle className="w-8 h-8 opacity-40" />
                                </div>
                                <p className="text-sm font-medium">No conversations found</p>
                            </div>
                        ) : (
                            filteredConversations.map((conversation) => (
                                <button
                                    key={conversation.id}
                                    onClick={() => setSelectedConversation(conversation)}
                                    className={`w-full p-3 text-left rounded-xl transition-all duration-200 group relative overflow-hidden ${selectedConversation?.id === conversation.id
                                            ? 'bg-white text-black shadow-lg shadow-white/5'
                                            : 'text-zinc-400 hover:bg-white/[0.03] hover:text-white'
                                        }`}
                                >
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border ${selectedConversation?.id === conversation.id ? 'bg-zinc-200 border-zinc-300' : 'bg-zinc-800 border-white/10'
                                            }`}>
                                            <User className={`w-5 h-5 ${selectedConversation?.id === conversation.id ? 'text-zinc-600' : 'text-zinc-400'
                                                }`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="font-semibold truncate">{getOtherParticipantName(conversation)}</p>
                                                {conversation.lastMessageAt && (
                                                    <span className={`text-[10px] ${selectedConversation?.id === conversation.id ? 'text-zinc-500' : 'text-zinc-600'
                                                        }`}>
                                                        {new Date(conversation.lastMessageAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className={`text-xs truncate ${selectedConversation?.id === conversation.id ? 'text-zinc-600' : 'text-zinc-500 group-hover:text-zinc-400'
                                                }`}>
                                                {conversation.lastMessage || 'Start a conversation'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Active Indicator Strip */}
                                    {selectedConversation?.id === conversation.id && (
                                        <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-black rounded-r-full" />
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Chat Panel */}
                <div className="flex-1 flex flex-col bg-zinc-900/50 backdrop-blur-xl border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl relative">
                    {selectedConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="h-20 px-6 border-b border-white/[0.08] bg-black/20 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedConversation(null)}
                                        className="md:hidden p-2 -ml-2 text-zinc-400 hover:text-white"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>
                                    <div className="w-10 h-10 bg-gradient-to-br from-zinc-700 to-zinc-900 rounded-full flex items-center justify-center border border-white/10 shadow-inner">
                                        <User className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white text-lg leading-tight">
                                            {getOtherParticipantName(selectedConversation)}
                                        </h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                            <span className="text-xs text-zinc-400">Online</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                        <Phone className="w-5 h-5" />
                                    </button>
                                    <button className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                        <Video className="w-5 h-5" />
                                    </button>
                                    <div className="w-px h-6 bg-white/10 mx-1"></div>
                                    <button className="p-2.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors">
                                        <MoreVertical className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[url('/grid-pattern.svg')] bg-[length:40px_40px] bg-fixed">
                                {messagesLoading ? (
                                    <>
                                        <SkeletonMessage />
                                        <SkeletonMessage isOwn />
                                        <SkeletonMessage />
                                    </>
                                ) : (
                                    messages.map((message) => {
                                        const isOwn = message.senderId === user?.uid;
                                        return (
                                            <div
                                                key={message.id}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                                            >
                                                {!isOwn && (
                                                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs border border-white/10 mt-auto mb-1 mr-2 shrink-0">
                                                        {getOtherParticipantName(selectedConversation).charAt(0)}
                                                    </div>
                                                )}
                                                <div className={`max-w-[70%] group relative ${isOwn
                                                        ? 'bg-white text-black rounded-2xl rounded-tr-none'
                                                        : 'bg-zinc-800/80 backdrop-blur-sm border border-white/10 text-white rounded-2xl rounded-tl-none'
                                                    } p-4 shadow-sm`}>
                                                    <p className="text-[15px] leading-relaxed">{message.content}</p>
                                                    <span className={`text-[10px] absolute -bottom-5 ${isOwn ? 'right-1' : 'left-1'} text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity`}>
                                                        {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/[0.08]">
                                <form onSubmit={handleSendMessage} className="relative flex items-end gap-2 bg-zinc-900/50 border border-white/10 rounded-2xl p-2 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-inner">
                                    <div className="flex items-center gap-1 pb-2 pl-2">
                                        <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                            <Paperclip className="w-5 h-5" />
                                        </button>
                                        <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5">
                                            <ImageIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 mb-2"></div>
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-transparent border-none text-white placeholder:text-zinc-500 focus:ring-0 p-3 max-h-32 min-h-[48px]"
                                    />
                                    <div className="flex items-center gap-1 pb-1 pr-1">
                                        <button type="button" className="p-2 text-zinc-400 hover:text-white transition-colors rounded-full hover:bg-white/5 mr-1">
                                            <Smile className="w-5 h-5" />
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={sending || !newMessage.trim()}
                                            className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-white/5"
                                        >
                                            <Send className="w-5 h-5" />
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-zinc-800/10 via-black to-black">
                            <div className="w-24 h-24 bg-gradient-to-tr from-zinc-800 to-zinc-900 rounded-full flex items-center justify-center border border-white/5 shadow-2xl mb-8 animate-pulse-slow">
                                <MessageCircle className="w-10 h-10 text-white/50" />
                            </div>
                            <h3 className="text-3xl font-bold text-white mb-3">Your Messages</h3>
                            <p className="text-zinc-500 max-w-sm text-center leading-relaxed">
                                Select a conversation from the sidebar to start chatting or search for a new connection.
                            </p>
                            <div className="mt-8 flex gap-4">
                                <div className="h-1 w-16 bg-zinc-800 rounded-full"></div>
                                <div className="h-1 w-16 bg-zinc-800 rounded-full"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
}
