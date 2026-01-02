export function Skeleton({ className = '' }) {
    return (
        <div className={`animate-pulse bg-zinc-800 rounded ${className}`} />
    );
}

export function SkeletonCard({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 ${className}`}>
            <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-3 w-full" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonMissionCard({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 ${className}`}>
            <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-2/3" />
                    <div className="flex gap-2">
                        <Skeleton className="h-5 w-16 rounded-full" />
                        <Skeleton className="h-5 w-20 rounded-full" />
                    </div>
                </div>
                <Skeleton className="h-8 w-24 rounded" />
            </div>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-4/5 mb-4" />
            <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
            </div>
        </div>
    );
}

export function SkeletonApplicationCard({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 ${className}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-24 rounded" />
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-28" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4 mt-1" />
                </div>
                <div className="flex gap-2">
                    <Skeleton className="h-8 w-24 rounded" />
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonNotificationItem({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border-l-4 border-zinc-700 rounded-lg p-4 ${className}`}>
            <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-2 w-2 rounded-full" />
                    </div>
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-8 w-20 rounded" />
            </div>
        </div>
    );
}

export function SkeletonConversationItem({ className = '' }) {
    return (
        <div className={`p-4 border-b border-zinc-800 ${className}`}>
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                </div>
            </div>
        </div>
    );
}

export function SkeletonMessage({ isOwn = false, className = '' }) {
    return (
        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} ${className}`}>
            <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? 'bg-zinc-700' : 'bg-zinc-800'}`}>
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function SkeletonStatsCard({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-4 ${className}`}>
            <Skeleton className="h-3 w-24 mb-2" />
            <Skeleton className="h-8 w-12" />
        </div>
    );
}

export function SkeletonProfileCard({ className = '' }) {
    return (
        <div className={`bg-zinc-900 border border-zinc-800 rounded-lg p-6 text-center ${className}`}>
            <Skeleton className="w-16 h-16 rounded-full mx-auto mb-4" />
            <Skeleton className="h-5 w-32 mx-auto mb-2" />
            <Skeleton className="h-4 w-24 mx-auto mb-4" />
            <div className="flex justify-center gap-2 mb-4">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-9 w-full rounded" />
        </div>
    );
}
