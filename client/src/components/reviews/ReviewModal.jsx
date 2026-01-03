import { useState } from 'react';
import { Star, X, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import { toast } from 'sonner';

export function ReviewModal({ isOpen, onClose, missionId, missionTitle, revieweeId, revieweeName, onSuccess }) {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error('Please select a rating');
            return;
        }

        setLoading(true);
        try {
            await api.post('/api/v1/reviews', {
                missionId,
                revieweeId,
                rating,
                comment: comment.trim() || undefined,
            });
            toast.success('Review submitted!');
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error(error.message || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-zinc-800">
                        <div>
                            <h2 className="text-xl font-bold text-white">Leave a Review</h2>
                            <p className="text-sm text-zinc-500 mt-1">For {revieweeName}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <X className="w-5 h-5 text-zinc-400" />
                        </button>
                    </div>

                    {/* Content */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Mission Info */}
                        <div className="p-4 bg-zinc-800/50 rounded-xl">
                            <p className="text-xs text-zinc-500 mb-1">Mission</p>
                            <p className="text-white font-medium">{missionTitle}</p>
                        </div>

                        {/* Star Rating */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-3">Rating</label>
                            <div className="flex gap-2">
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
                                            className={`w-8 h-8 transition-colors ${star <= (hoverRating || rating)
                                                    ? 'fill-yellow-500 text-yellow-500'
                                                    : 'text-zinc-600'
                                                }`}
                                        />
                                    </button>
                                ))}
                            </div>
                            {rating > 0 && (
                                <p className="text-sm text-zinc-500 mt-2">
                                    {rating === 1 && 'Poor'}
                                    {rating === 2 && 'Fair'}
                                    {rating === 3 && 'Good'}
                                    {rating === 4 && 'Very Good'}
                                    {rating === 5 && 'Excellent'}
                                </p>
                            )}
                        </div>

                        {/* Comment */}
                        <div>
                            <label className="block text-sm text-zinc-400 mb-2">
                                Comment <span className="text-zinc-600">(optional)</span>
                            </label>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Share your experience working with this person..."
                                rows={4}
                                className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600 resize-none"
                            />
                        </div>

                        {/* Submit */}
                        <div className="flex gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 h-12 border-zinc-700"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading || rating === 0}
                                className="flex-1 h-12 bg-white text-black hover:bg-zinc-200"
                            >
                                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Review'}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
