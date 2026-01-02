import { db } from '../../config/firebase.js';
import type { Review } from '../../types/firestore.js';

const REVIEWS_COLLECTION = 'reviews';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';

export interface CreateReview {
    missionId: string;
    revieweeId: string;
    rating: number;
    comment?: string;
}

export const createReview = async (
    reviewerId: string,
    data: CreateReview
): Promise<Review> => {
    const existingReview = await getReviewByMissionAndReviewer(data.missionId, reviewerId);
    if (existingReview) {
        throw new Error('You have already reviewed this mission');
    }

    const review: Omit<Review, 'id'> = {
        missionId: data.missionId,
        reviewerId,
        revieweeId: data.revieweeId,
        rating: Math.min(5, Math.max(0, data.rating)),
        comment: data.comment,
        isPublic: true,
        createdAt: new Date(),
    };

    const docRef = await db.collection(REVIEWS_COLLECTION).add(review);

    await updateUserAverageRating(data.revieweeId);

    return { id: docRef.id, ...review };
};

export const getReviewByMissionAndReviewer = async (
    missionId: string,
    reviewerId: string
): Promise<Review | null> => {
    const snapshot = await db
        .collection(REVIEWS_COLLECTION)
        .where('missionId', '==', missionId)
        .where('reviewerId', '==', reviewerId)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Review;
};

export const getUserReviews = async (
    userId: string,
    role: 'reviewer' | 'reviewee' = 'reviewee'
): Promise<Review[]> => {
    const field = role === 'reviewer' ? 'reviewerId' : 'revieweeId';
    const snapshot = await db
        .collection(REVIEWS_COLLECTION)
        .where(field, '==', userId)
        .where('isPublic', '==', true)
        .orderBy('createdAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const getMissionReviews = async (missionId: string): Promise<Review[]> => {
    const snapshot = await db
        .collection(REVIEWS_COLLECTION)
        .where('missionId', '==', missionId)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
};

export const updateUserAverageRating = async (userId: string): Promise<void> => {
    const reviews = await getUserReviews(userId, 'reviewee');

    if (reviews.length === 0) return;

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 100) / 100;

    const contributorDoc = await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).get();
    if (contributorDoc.exists) {
        await db.collection(CONTRIBUTOR_PROFILES_COLLECTION).doc(userId).update({
            trustScore: Math.min(100, Math.round(averageRating * 20)),
        });
    }

    const initiatorDoc = await db.collection(INITIATOR_PROFILES_COLLECTION).doc(userId).get();
    if (initiatorDoc.exists) {
        await db.collection(INITIATOR_PROFILES_COLLECTION).doc(userId).update({
            averageRating,
        });
    }
};

export const getReviewStats = async (userId: string): Promise<{
    averageRating: number;
    totalReviews: number;
    ratingDistribution: Record<number, number>;
}> => {
    const reviews = await getUserReviews(userId, 'reviewee');

    if (reviews.length === 0) {
        return {
            averageRating: 0,
            totalReviews: 0,
            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        };
    }

    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = Math.round((totalRating / reviews.length) * 100) / 100;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach(r => {
        const roundedRating = Math.round(r.rating);
        if (roundedRating >= 1 && roundedRating <= 5) {
            ratingDistribution[roundedRating]++;
        }
    });

    return {
        averageRating,
        totalReviews: reviews.length,
        ratingDistribution,
    };
};
