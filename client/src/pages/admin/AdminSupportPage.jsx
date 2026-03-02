import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Clock3, LifeBuoy, Loader2, Mail, SendHorizontal } from 'lucide-react';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { api } from '../../lib/api';
import { toast } from 'sonner';

const STATUS_OPTIONS = ['open', 'in_progress', 'resolved', 'closed'];
const PRIORITY_OPTIONS = ['low', 'normal', 'high', 'urgent'];
const CATEGORY_OPTIONS = ['general', 'technical', 'billing', 'account', 'safety', 'other'];

const statusLabel = (value) => value.replace('_', ' ');

const formatDateTime = (value) => {
    if (!value) return 'N/A';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return 'N/A';
    return parsed.toLocaleString();
};

export default function AdminSupportPage() {
    const [tickets, setTickets] = useState([]);
    const [ticketsLoading, setTicketsLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [ticketDetail, setTicketDetail] = useState(null);
    const [replyMessage, setReplyMessage] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [updatingTicket, setUpdatingTicket] = useState(false);
    const [filters, setFilters] = useState({
        status: '',
        priority: '',
        category: '',
    });

    const fetchTickets = useCallback(async () => {
        setTicketsLoading(true);
        try {
            const params = new URLSearchParams();
            if (filters.status) params.append('status', filters.status);
            if (filters.priority) params.append('priority', filters.priority);
            if (filters.category) params.append('category', filters.category);
            params.append('limit', '50');

            const response = await api.get(`/api/v1/admin/support/tickets?${params.toString()}`);
            const nextTickets = response.data?.tickets || [];
            setTickets(nextTickets);

            if (nextTickets.length === 0) {
                setSelectedTicketId(null);
                setTicketDetail(null);
            } else if (!nextTickets.some((ticket) => ticket.id === selectedTicketId)) {
                setSelectedTicketId(nextTickets[0].id);
            }
        } catch (error) {
            console.error('Failed to fetch support tickets:', error);
            toast.error('Failed to load support tickets');
        } finally {
            setTicketsLoading(false);
        }
    }, [filters.category, filters.priority, filters.status, selectedTicketId]);

    const fetchTicketDetail = useCallback(async (ticketId) => {
        if (!ticketId) return;
        setDetailLoading(true);
        try {
            const response = await api.get(`/api/v1/admin/support/tickets/${ticketId}`);
            setTicketDetail(response.data || null);
        } catch (error) {
            console.error('Failed to fetch ticket detail:', error);
            toast.error('Failed to load ticket detail');
        } finally {
            setDetailLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    useEffect(() => {
        if (selectedTicketId) {
            fetchTicketDetail(selectedTicketId);
        }
    }, [fetchTicketDetail, selectedTicketId]);

    const patchTicket = async (patch) => {
        if (!selectedTicketId) return;
        if (patch.status === 'closed') {
            if (!window.confirm('Mark this support ticket as closed?')) return;
        }
        setUpdatingTicket(true);
        try {
            await api.patch(`/api/v1/admin/support/tickets/${selectedTicketId}`, patch);
            await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicketId)]);
            toast.success('Ticket updated');
        } catch (error) {
            console.error('Failed to update ticket:', error);
            toast.error('Failed to update ticket');
        } finally {
            setUpdatingTicket(false);
        }
    };

    const submitReply = async () => {
        if (!selectedTicketId || !replyMessage.trim()) {
            toast.error('Reply message is required');
            return;
        }
        setReplyLoading(true);
        try {
            await api.post(`/api/v1/admin/support/tickets/${selectedTicketId}/reply`, {
                message: replyMessage.trim(),
            });
            setReplyMessage('');
            await Promise.all([fetchTickets(), fetchTicketDetail(selectedTicketId)]);
            toast.success('Reply queued for delivery');
        } catch (error) {
            console.error('Failed to send reply:', error);
            toast.error('Failed to send reply');
        } finally {
            setReplyLoading(false);
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
                    <h1 className="text-3xl font-bold tracking-tighter text-white">Support Queue</h1>
                    <p className="text-neutral-400 mt-1">Track tickets, update status, and send email replies.</p>
                </div>

                <div className="flex flex-wrap gap-3 mb-6">
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        <option value="">All statuses</option>
                        {STATUS_OPTIONS.map((status) => (
                            <option key={status} value={status}>{statusLabel(status)}</option>
                        ))}
                    </select>
                    <select
                        value={filters.priority}
                        onChange={(event) => setFilters((prev) => ({ ...prev, priority: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        <option value="">All priorities</option>
                        {PRIORITY_OPTIONS.map((priority) => (
                            <option key={priority} value={priority}>{priority}</option>
                        ))}
                    </select>
                    <select
                        value={filters.category}
                        onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                        className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white"
                    >
                        <option value="">All categories</option>
                        {CATEGORY_OPTIONS.map((category) => (
                            <option key={category} value={category}>{category}</option>
                        ))}
                    </select>
                </div>

                <div className="grid lg:grid-cols-[360px_1fr] gap-6">
                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl overflow-hidden">
                        <div className="px-4 py-3 border-b border-white/[0.08] text-sm text-neutral-400">
                            Tickets
                        </div>
                        <div className="max-h-[680px] overflow-y-auto">
                            {ticketsLoading && (
                                <div className="p-6 text-sm text-neutral-500">Loading tickets...</div>
                            )}
                            {!ticketsLoading && tickets.length === 0 && (
                                <div className="p-8 text-center text-neutral-500">
                                    <LifeBuoy className="w-7 h-7 mx-auto mb-2 opacity-60" />
                                    No support tickets found.
                                </div>
                            )}
                            {!ticketsLoading && tickets.map((ticket) => (
                                <button
                                    type="button"
                                    key={ticket.id}
                                    onClick={() => setSelectedTicketId(ticket.id)}
                                    className={`w-full p-4 text-left border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors ${ticket.id === selectedTicketId ? 'bg-white/[0.04]' : ''}`}
                                >
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                        <p className="font-semibold text-sm text-white truncate">{ticket.ticketRef}</p>
                                        <span className="text-[11px] text-neutral-500">{ticket.priority}</span>
                                    </div>
                                    <p className="text-sm text-neutral-300 truncate">{ticket.subject}</p>
                                    <p className="text-xs text-neutral-500 mt-1 truncate">{ticket.requesterEmail}</p>
                                    <div className="flex items-center gap-3 text-[11px] text-neutral-500 mt-2">
                                        <span>{statusLabel(ticket.status)}</span>
                                        <span>{ticket.category}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </section>

                    <section className="bg-[#0A0A0A] border border-white/[0.08] rounded-xl p-6">
                        {!selectedTicketId && (
                            <div className="text-neutral-500 text-sm">Select a ticket to view details.</div>
                        )}

                        {selectedTicketId && detailLoading && (
                            <div className="text-neutral-500 text-sm">Loading ticket details...</div>
                        )}

                        {selectedTicketId && !detailLoading && ticketDetail?.ticket && (
                            <div className="space-y-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white tracking-tight">{ticketDetail.ticket.ticketRef}</h2>
                                        <p className="text-neutral-400 mt-1">{ticketDetail.ticket.subject}</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <select
                                            value={ticketDetail.ticket.status}
                                            onChange={(event) => patchTicket({ status: event.target.value })}
                                            disabled={updatingTicket}
                                            className="bg-black border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white"
                                        >
                                            {STATUS_OPTIONS.map((status) => (
                                                <option key={status} value={status}>{statusLabel(status)}</option>
                                            ))}
                                        </select>
                                        <select
                                            value={ticketDetail.ticket.priority}
                                            onChange={(event) => patchTicket({ priority: event.target.value })}
                                            disabled={updatingTicket}
                                            className="bg-black border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white"
                                        >
                                            {PRIORITY_OPTIONS.map((priority) => (
                                                <option key={priority} value={priority}>{priority}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                        <p className="text-neutral-500 mb-1">Requester</p>
                                        <p className="text-white font-medium">{ticketDetail.ticket.requesterName}</p>
                                        <p className="text-neutral-300">{ticketDetail.ticket.requesterEmail}</p>
                                    </div>
                                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                        <p className="text-neutral-500 mb-1">Metadata</p>
                                        <p className="text-white">Category: {ticketDetail.ticket.category}</p>
                                        <p className="text-neutral-300">Source: {ticketDetail.ticket.source}</p>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                    <p className="text-neutral-500 text-sm mb-2">Message</p>
                                    <p className="text-neutral-100 whitespace-pre-wrap leading-relaxed">{ticketDetail.ticket.message}</p>
                                </div>

                                <div className="grid md:grid-cols-3 gap-4">
                                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                        <p className="text-xs text-neutral-500 mb-1">Created</p>
                                        <p className="text-sm text-white flex items-center gap-1">
                                            <Clock3 className="w-3.5 h-3.5 text-neutral-500" />
                                            {formatDateTime(ticketDetail.ticket.createdAt)}
                                        </p>
                                    </div>
                                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                        <p className="text-xs text-neutral-500 mb-1">Updated</p>
                                        <p className="text-sm text-white">{formatDateTime(ticketDetail.ticket.updatedAt)}</p>
                                    </div>
                                    <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                        <p className="text-xs text-neutral-500 mb-1">Email Delivery</p>
                                        <p className="text-sm text-white">
                                            sent {ticketDetail.delivery?.sent || 0} / {ticketDetail.delivery?.total || 0}
                                        </p>
                                        <p className="text-xs text-neutral-400 mt-1">
                                            pending {ticketDetail.delivery?.pending || 0}, retrying {ticketDetail.delivery?.retrying || 0}, failed {ticketDetail.delivery?.failed || 0}
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4 space-y-3">
                                    <label className="text-sm text-neutral-300 flex items-center gap-2">
                                        <Mail className="w-4 h-4" />
                                        Reply to requester
                                    </label>
                                    <textarea
                                        value={replyMessage}
                                        onChange={(event) => setReplyMessage(event.target.value)}
                                        rows={4}
                                        placeholder="Type a support response..."
                                        className="w-full bg-black border border-white/[0.12] rounded-lg px-3 py-2 text-sm text-white placeholder:text-neutral-500"
                                    />
                                    <button
                                        type="button"
                                        onClick={submitReply}
                                        disabled={replyLoading || !replyMessage.trim()}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-black text-sm font-semibold hover:bg-neutral-200 disabled:opacity-60"
                                    >
                                        {replyLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendHorizontal className="w-4 h-4" />}
                                        Queue Reply
                                    </button>
                                </div>

                                <div className="bg-black/40 border border-white/[0.06] rounded-lg p-4">
                                    <p className="text-sm text-neutral-300 mb-3">Recent events</p>
                                    <div className="space-y-2">
                                        {(ticketDetail.events || []).slice(0, 8).map((event) => (
                                            <div key={event.id} className="text-sm">
                                                <p className="text-white">{event.eventType}</p>
                                                {event.notes && <p className="text-neutral-400 text-xs">{event.notes}</p>}
                                                <p className="text-neutral-500 text-xs">{formatDateTime(event.createdAt)}</p>
                                            </div>
                                        ))}
                                        {(!ticketDetail.events || ticketDetail.events.length === 0) && (
                                            <p className="text-xs text-neutral-500">No events yet.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedTicketId && !detailLoading && !ticketDetail?.ticket && (
                            <div className="text-sm text-neutral-500">Ticket details are unavailable.</div>
                        )}
                    </section>
                </div>
            </div>
        </DashboardLayout>
    );
}
