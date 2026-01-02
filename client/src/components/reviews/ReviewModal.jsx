import { useState } from 'react';
import { Star, X, Send } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function ReviewModal({ isOpen, onClose, missionId, revieweeId, revieweeName, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [submitting, setSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setSubmitting(true);
        try {
            await api.post('/api/v1/reviews', {
                missionId,
                revieweeId,
                rating,
                comment: comment.trim() || undefined,
            });
            toast.success('Review submitted successfully!');
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setSubmitting(false);
        }
    };

    const displayRating = hoverRating || rating;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={onClose}
            />

            <div className="relative bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1 text-zinc-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <h2 className="text-xl font-bold text-white mb-2">Leave a Review</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    How was your experience working with {revieweeName}?
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm text-zinc-400 mb-3">Rating</label>
                        <div className="flex items-center gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    className="p-1 transition-transform hover:scale-110"
                                >
                                    <Star
                                        className={`w-8 h-8 transition-colors ${star <= displayRating
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'text-zinc-600'
                                            }`}
                                    />
                                </button>
                            ))}
                            <span className="ml-3 text-white font-medium">
                                {displayRating > 0 ? `${displayRating}/5` : ''}
                            </span>
                        </div>
                        <div className="mt-2 text-xs text-zinc-500">
                            {displayRating === 1 && 'Poor'}
                            {displayRating === 2 && 'Fair'}
                            {displayRating === 3 && 'Good'}
                            {displayRating === 4 && 'Very Good'}
                            {displayRating === 5 && 'Excellent'}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm text-zinc-400 mb-2">
                            Comment <span className="text-zinc-600">(optional)</span>
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600 resize-none"
                            rows={4}
                            maxLength={2000}
                        />
                        <div className="text-xs text-zinc-600 mt-1 text-right">
                            {comment.length}/2000
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1"
                            disabled={submitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1 bg-white text-black hover:bg-zinc-200"
                            disabled={submitting || rating === 0}
                        >
                            {submitting ? 'Submitting...' : (
                                <>
                                    <Send className="w-4 h-4 mr-2" />
                                    Submit Review
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
