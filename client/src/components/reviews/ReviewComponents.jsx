import { Star } from 'lucide-react';

export function ReviewCard({ review }) {
    return (
        <div className="p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-sm font-bold">
                        {(review.reviewerName || 'A').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-white">{review.reviewerName || 'Anonymous'}</p>
                        <p className="text-xs text-zinc-500">
                            {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : ''}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                            key={star}
                            className={`w-4 h-4 ${star <= review.rating
                                    ? 'fill-yellow-500 text-yellow-500'
                                    : 'text-zinc-700'
                                }`}
                        />
                    ))}
                </div>
            </div>
            {review.comment && (
                <p className="text-sm text-zinc-400 leading-relaxed">{review.comment}</p>
            )}
        </div>
    );
}

export function ReviewStats({ stats }) {
    const { averageRating = 0, totalReviews = 0, ratingDistribution = {} } = stats;

    return (
        <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl">
            <div className="flex items-center gap-6 mb-6">
                <div>
                    <div className="text-4xl font-bold text-white">{averageRating.toFixed(1)}</div>
                    <div className="flex items-center gap-1 mt-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                                key={star}
                                className={`w-4 h-4 ${star <= Math.round(averageRating)
                                        ? 'fill-yellow-500 text-yellow-500'
                                        : 'text-zinc-700'
                                    }`}
                            />
                        ))}
                    </div>
                    <p className="text-sm text-zinc-500 mt-1">{totalReviews} reviews</p>
                </div>
                <div className="flex-1 space-y-2">
                    {[5, 4, 3, 2, 1].map((rating) => {
                        const count = ratingDistribution[rating] || 0;
                        const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                        return (
                            <div key={rating} className="flex items-center gap-2">
                                <span className="text-xs text-zinc-500 w-3">{rating}</span>
                                <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-yellow-500 rounded-full"
                                        style={{ width: `${percentage}%` }}
                                    />
                                </div>
                                <span className="text-xs text-zinc-600 w-8">{count}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
