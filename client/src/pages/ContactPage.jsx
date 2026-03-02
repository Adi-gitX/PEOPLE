import { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Send, MessageSquare, Loader2 } from 'lucide-react';
import { PublicLayout } from '../components/layout/PublicLayout';
import { api } from '../lib/api';
import { toast } from 'sonner';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_MESSAGE_LENGTH = 5000;
const MIN_MESSAGE_LENGTH = 10;

export default function ContactPage() {
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [ticketRef, setTicketRef] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [form, setForm] = useState({
        name: '',
        email: '',
        subject: 'Matching Issues',
        message: '',
        website: '',
    });

    const getFieldError = (field, draft = form) => {
        if (field === 'name') {
            const name = draft.name.trim();
            if (!name) return 'Name is required';
            if (name.length > 100) return 'Name must be 100 characters or fewer';
            return '';
        }

        if (field === 'email') {
            const email = draft.email.trim();
            if (!email) return 'Email is required';
            if (!EMAIL_REGEX.test(email)) return 'Enter a valid email address';
            return '';
        }

        if (field === 'subject') {
            const subject = draft.subject.trim();
            if (!subject) return 'Topic is required';
            if (subject.length > 200) return 'Topic must be 200 characters or fewer';
            return '';
        }

        if (field === 'message') {
            const message = draft.message.trim();
            if (!message) return 'Message is required';
            if (message.length < MIN_MESSAGE_LENGTH) return `Message must be at least ${MIN_MESSAGE_LENGTH} characters`;
            if (message.length > MAX_MESSAGE_LENGTH) return `Message must be ${MAX_MESSAGE_LENGTH} characters or fewer`;
            return '';
        }

        return '';
    };

    const validateForm = (draft = form) => {
        const fields = ['name', 'email', 'subject', 'message'];
        return fields.reduce((errors, field) => {
            const errorMessage = getFieldError(field, draft);
            if (errorMessage) errors[field] = errorMessage;
            return errors;
        }, {});
    };

    const mapServerValidationErrors = (error) => {
        const mapped = {};
        if (!Array.isArray(error?.details)) return mapped;

        error.details.forEach((detail) => {
            if (!detail?.field) return;
            const field = String(detail.field);
            const message = detail.message || 'Invalid value';
            if (field === 'name') mapped.name = message;
            if (field === 'email') mapped.email = message;
            if (field === 'subject') mapped.subject = message;
            if (field === 'message') mapped.message = message;
        });

        return mapped;
    };

    const subjectToCategory = (subject) => {
        switch (subject) {
            case 'Payment Inquiry':
                return 'billing';
            case 'Technical Support':
                return 'technical';
            case 'Profile Verification':
                return 'account';
            default:
                return 'general';
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        const nextForm = { ...form, [name]: value };
        setForm(nextForm);
        setFieldErrors((prev) => {
            const updated = { ...prev };
            const nextError = getFieldError(name, nextForm);
            if (nextError) updated[name] = nextError;
            else delete updated[name];
            return updated;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const nextErrors = validateForm();
        setFieldErrors(nextErrors);

        if (Object.keys(nextErrors).length > 0) {
            toast.error('Please fix the highlighted fields');
            return;
        }

        setLoading(true);
        try {
            const response = await api.post('/api/v1/contact', {
                name: form.name.trim(),
                email: form.email.trim(),
                subject: form.subject,
                message: form.message.trim(),
                category: subjectToCategory(form.subject),
                source: 'contact_page',
                website: form.website,
            });
            setTicketRef(response.data?.ticketRef || '');
            setSubmitted(true);
            setFieldErrors({});
            toast.success('Support ticket submitted');
        } catch (error) {
            if (error?.name === 'NetworkError') {
                toast.error('Unable to reach backend support API. Please retry in a moment.');
            } else if (error?.status === 400) {
                const serverFieldErrors = mapServerValidationErrors(error);
                if (Object.keys(serverFieldErrors).length > 0) {
                    setFieldErrors(serverFieldErrors);
                    toast.error('Please correct the highlighted fields');
                } else {
                    toast.error(error.message || 'Invalid support request');
                }
            } else {
                toast.error(error.message || 'Failed to send message. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSubmitted(false);
        setTicketRef('');
        setFieldErrors({});
        setForm({ name: '', email: '', subject: 'Matching Issues', message: '', website: '' });
    };

    const currentValidationErrors = validateForm();
    const isFormValid = Object.keys(currentValidationErrors).length === 0;

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
                                    {fieldErrors.name && (
                                        <p className="text-xs text-red-400">{fieldErrors.name}</p>
                                    )}
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
                                    {fieldErrors.email && (
                                        <p className="text-xs text-red-400">{fieldErrors.email}</p>
                                    )}
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
                                {fieldErrors.subject && (
                                    <p className="text-xs text-red-400">{fieldErrors.subject}</p>
                                )}
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
                                <div className="flex items-center justify-between text-xs">
                                    <span className={fieldErrors.message ? 'text-red-400' : 'text-neutral-500'}>
                                        {fieldErrors.message || `Minimum ${MIN_MESSAGE_LENGTH} characters`}
                                    </span>
                                    <span className="text-neutral-500">
                                        {form.message.trim().length}/{MAX_MESSAGE_LENGTH}
                                    </span>
                                </div>
                            </div>

                            <input
                                type="text"
                                name="website"
                                value={form.website}
                                onChange={handleChange}
                                autoComplete="off"
                                tabIndex={-1}
                                className="hidden"
                                aria-hidden="true"
                            />

                            <Button
                                type="submit"
                                disabled={loading || !isFormValid}
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
                                {ticketRef ? `Ticket ${ticketRef} has been created.` : 'Your support ticket has been created.'} Our support team typically replies within 24 hours.
                            </p>
                            {ticketRef && (
                                <p className="text-sm text-zinc-400 mb-6 font-mono">
                                    Reference: {ticketRef}
                                </p>
                            )}
                            <Button variant="outline" onClick={resetForm} className="border-white/10 hover:bg-white/5">Send another message</Button>
                        </div>
                    )}
                </div>
            </div>

        </PublicLayout>
    );
}
