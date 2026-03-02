import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { ArrowLeft, Lock, Unlock, EyeOff, Eye, Search, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_OPTIONS = [
    { value: '', label: 'All' },
    { value: 'normal', label: 'Normal' },
    { value: 'locked', label: 'Locked' },
];

export default function AdminMessagesPage() {
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [selectedConversationId, setSelectedConversationId] = useState('');
    const [messages, setMessages] = useState([]);
    const [filters, setFilters] = useState({ q: '', status: '' });
    const [moderatingConversation, setModeratingConversation] = useState(false);
    const [moderatingMessageId, setModeratingMessageId] = useState('');

    const selectedConversation = useMemo(() => (
        conversations.find((conversation) => conversation.id === selectedConversationId) || null
    ), [conversations, selectedConversationId]);

    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const params = new URLSearchParams();
            if (filters.q.trim()) params.append('q', filters.q.trim());
            if (filters.status) params.append('status', filters.status);
            params.append('limit', '50');

            const response = await api.get(`/api/v1/admin/messages/conversations?${params.toString()}`);
            const nextConversations = response.data?.conversations || [];
            setConversations(nextConversations);

            if (!selectedConversationId && nextConversations.length > 0) {
                setSelectedConversationId(nextConversations[0].id);
            } else if (
                selectedConversationId
                && !nextConversations.some((conversation) => conversation.id === selectedConversationId)
            ) {
                setSelectedConversationId(nextConversations[0]?.id || '');
            }
        } catch (error) {
            console.error('Failed to fetch admin conversations:', error);
            toast.error('Failed to load conversations');
        } finally {
            setLoadingConversations(false);
        }
    }, [filters.q, filters.status, selectedConversationId]);

    const fetchMessages = useCallback(async (conversationId) => {
        if (!conversationId) {
            setMessages([]);
            return;
        }
        setLoadingMessages(true);
        try {
            const response = await api.get(`/api/v1/admin/messages/conversations/${conversationId}/messages?limit=200`);
            setMessages(response.data?.messages || []);
        } catch (error) {
            console.error('Failed to fetch admin messages:', error);
            toast.error('Failed to load messages');
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (selectedConversationId) {
            fetchMessages(selectedConversationId);
        } else {
            setMessages([]);
        }
    }, [fetchMessages, selectedConversationId]);

    const moderateConversation = async (action) => {
        if (!selectedConversationId) return;
        const reason = window.prompt(`Enter moderation reason to ${action} this conversation:`);
        if (!reason || !reason.trim()) return;

        setModeratingConversation(true);
        try {
            await api.patch(`/api/v1/admin/messages/conversations/${selectedConversationId}/moderation`, {
                action,
                reason: reason.trim(),
            });
            toast.success(`Conversation ${action}ed`);
            await fetchConversations();
            await fetchMessages(selectedConversationId);
        } catch (error) {
            console.error('Failed to moderate conversation:', error);
            toast.error('Failed to update conversation moderation');
        } finally {
            setModeratingConversation(false);
        }
    };

    const moderateMessage = async (messageId, action) => {
        if (!selectedConversationId || !messageId) return;
        const reason = window.prompt(`Enter moderation reason to ${action} this message:`);
        if (!reason || !reason.trim()) return;

        setModeratingMessageId(messageId);
        try {
            await api.patch(
                `/api/v1/admin/messages/conversations/${selectedConversationId}/messages/${messageId}/moderation`,
                {
                    action,
                    reason: reason.trim(),
                }
            );
            toast.success(`Message ${action}d`);
            await fetchMessages(selectedConversationId);
            await fetchConversations();
        } catch (error) {
            console.error('Failed to moderate message:', error);
            toast.error('Failed to update message moderation');
        } finally {
            setModeratingMessageId('');
        }
    };

    return (
        <DashboardLayout>
            <div className="p-6 md:p-8 max-w-7xl mx-auto">
                <Link
                    to="/admin"
                    className="inline-flex items-center gap-2 text-neutral-400 hover:text-white mb-8 transition-colors text-sm font-medium"
                >
                    <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
                </Link>

                <div className="mb-8">
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Message Oversight</h1>
                    <p className="text-neutral-400 mt-1">Read and moderate conversations across the platform.</p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                    <div className="relative min-w-[260px] flex-1">
                        <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                        <input
                            type="text"
                            value={filters.q}
                            onChange={(event) => setFilters((prev) => ({ ...prev, q: event.target.value }))}
                            placeholder="Search participants or message text..."
                            className="w-full bg-[#0A0A0A] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-white"
                        />
                    </div>
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        {STATUS_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={fetchConversations}
                        className="px-4 py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors"
                    >
                        Refresh
                    </button>
                </div>

                <div className="grid lg:grid-cols-[360px_1fr] gap-6">
                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.08] text-sm text-neutral-400">
                            Conversations
                        </div>
                        <div className="max-h-[680px] overflow-y-auto">
                            {loadingConversations && (
                                <div className="p-6 text-sm text-neutral-500">Loading conversations...</div>
                            )}
                            {!loadingConversations && conversations.length === 0 && (
                                <div className="p-8 text-center text-neutral-500">
                                    <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-50" />
                                    No conversations found.
                                </div>
                            )}
                            {!loadingConversations && conversations.map((conversation) => (
                                <button
                                    type="button"
                                    key={conversation.id}
                                    onClick={() => setSelectedConversationId(conversation.id)}
                                    className={`w-full p-4 text-left border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors ${selectedConversationId === conversation.id ? 'bg-white/[0.05]' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="font-semibold text-sm text-white truncate">
                                            {(conversation.participantProfiles || []).map((profile) => profile.fullName).join(', ') || 'Unknown'}
                                        </p>
                                        <span className={`text-[11px] ${conversation.moderationStatus === 'locked' ? 'text-red-400' : 'text-neutral-500'}`}>
                                            {conversation.moderationStatus === 'locked' ? 'Locked' : 'Normal'}
                                        </span>
                                    </div>
                                    <p className="text-xs text-neutral-400 truncate">{conversation.lastMessage || 'No messages yet'}</p>
                                    <p className="text-[11px] text-neutral-500 mt-2">
                                        {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleString() : 'No activity'}
                                    </p>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        {!selectedConversation && (
                            <div className="text-neutral-500 text-sm">Select a conversation to inspect messages.</div>
                        )}

                        {selectedConversation && (
                            <div className="space-y-5">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-xl font-bold text-white">
                                            {(selectedConversation.participantProfiles || []).map((profile) => profile.fullName).join(', ') || 'Conversation'}
                                        </h2>
                                        <p className="text-sm text-neutral-400">
                                            Status: {selectedConversation.moderationStatus}
                                            {selectedConversation.moderationReason ? ` • ${selectedConversation.moderationReason}` : ''}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedConversation.moderationStatus === 'locked' ? (
                                            <button
                                                type="button"
                                                disabled={moderatingConversation}
                                                onClick={() => moderateConversation('unlock')}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/15 border border-green-500/30 text-green-300 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                                            >
                                                <Unlock className="w-4 h-4" /> Unlock
                                            </button>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={moderatingConversation}
                                                onClick={() => moderateConversation('lock')}
                                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                                            >
                                                <Lock className="w-4 h-4" /> Lock
                                            </button>
                                        )}
                                    </div>
                                </div>

                                <div className="border border-white/[0.08] rounded-xl max-h-[540px] overflow-y-auto">
                                    {loadingMessages && (
                                        <div className="p-6 text-sm text-neutral-500">Loading messages...</div>
                                    )}
                                    {!loadingMessages && messages.length === 0 && (
                                        <div className="p-6 text-sm text-neutral-500">No messages found.</div>
                                    )}
                                    {!loadingMessages && messages.map((message) => {
                                        const hidden = message.isModeratedHidden;
                                        const rowBusy = moderatingMessageId === message.id;
                                        return (
                                            <div key={message.id} className="border-b last:border-b-0 border-white/[0.06] p-4">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm text-white font-medium">
                                                            {message.senderName || message.senderId}
                                                        </p>
                                                        <p className={`text-sm mt-1 whitespace-pre-wrap ${hidden ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>
                                                            {message.content}
                                                        </p>
                                                        <p className="text-[11px] text-neutral-500 mt-1">
                                                            {message.createdAt ? new Date(message.createdAt).toLocaleString() : 'Unknown time'}
                                                        </p>
                                                        {hidden && (
                                                            <p className="text-[11px] text-red-300 mt-1">
                                                                Hidden • {message.moderationReason || 'No reason'}
                                                            </p>
                                                        )}
                                                    </div>
                                                    {hidden ? (
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => moderateMessage(message.id, 'restore')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-green-500/15 border border-green-500/30 text-green-300 hover:bg-green-500/20 disabled:opacity-50"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" /> Restore
                                                        </button>
                                                    ) : (
                                                        <button
                                                            type="button"
                                                            disabled={rowBusy}
                                                            onClick={() => moderateMessage(message.id, 'hide')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs bg-red-500/15 border border-red-500/30 text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                                                        >
                                                            <EyeOff className="w-3.5 h-3.5" /> Hide
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
