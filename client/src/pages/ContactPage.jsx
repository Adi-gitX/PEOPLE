import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { api } from '../lib/api';
import { toast } from 'sonner';

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: 'Matching Issues',
        message: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
            toast.error('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/v1/contact', {
                name: form.name.trim(),
                email: form.email.trim(),
                subject: form.subject,
                message: form.message.trim(),
            });
            setSubmitted(true);
            toast.success('Message sent successfully!');
        } catch (error) {
            toast.error(error.message || 'Failed to send message. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSubmitted(false);
        setForm({ name: '', email: '', subject: 'Matching Issues', message: '' });
    };

    return (
        <PublicLayout>
            <div className="flex-1 py-16 px-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-[80vh]">
                <div className="text-center mb-12 space-y-4">
                    <h1 className="text-5xl font-bold tracking-tighter mb-4">Contact Support</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                        Have questions about the algorithmic matching process? We are here to help you navigate your missions.
                    </p>
                </div>

                <div className="w-full max-w-xl relative">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl opacity-20 pointer-events-none rounded-full" />

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="relative space-y-6 bg-white/[0.03] backdrop-blur-xl border border-white/10 p-10 rounded-2xl shadow-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-lg h-12 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-muted-foreground/50"
                                        placeholder="Your name"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium ml-1">Email *</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        className="w-full bg-black/50 border border-white/10 rounded-lg h-12 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-muted-foreground/50"
                                        placeholder="you@example.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Topic</label>
                                <div className="relative">
                                    <select
                                        name="subject"
                                        value={form.subject}
                                        onChange={handleChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-lg h-12 px-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 appearance-none text-white"
                                    >
                                        <option>Matching Issues</option>
                                        <option>Profile Verification</option>
                                        <option>Payment Inquiry</option>
                                        <option>Technical Support</option>
                                        <option>Other</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
                                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium ml-1">Message *</label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    rows={5}
                                    className="w-full bg-black/50 border border-white/10 rounded-lg p-4 text-sm focus:outline-none focus:ring-1 focus:ring-white/20 placeholder:text-muted-foreground/50 resize-none"
                                    placeholder="Describe your issue in detail..."
                                />
                            </div>

                            <Button
                                type="submit"
                                disabled={loading}
                                className="w-full h-12 text-base bg-white text-black hover:bg-white/90 disabled:opacity-50"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <Send className="w-4 h-4 mr-2" />
                                        Submit Query
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 p-12 rounded-2xl text-center animate-in fade-in zoom-in-95 shadow-2xl">
                            <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 ring-1 ring-green-500/30">
                                <MessageSquare className="w-10 h-10 text-green-400" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2 tracking-tight">Query Received</h2>
                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                Our support team will review your ticket and respond within 24 hours. Check your email for updates.
                            </p>
                            <Button variant="outline" onClick={resetForm} className="border-white/10 hover:bg-white/5">Send another message</Button>
                        </div>
                    )}
                </div>
            </div>

        </PublicLayout>
    );
}
