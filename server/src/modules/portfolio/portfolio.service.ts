// Portfolio Module - Service
// Handles portfolio items for showcasing work

import { db } from '../../config/firebase.js';

const PORTFOLIO_COLLECTION = 'portfolioItems';

export interface PortfolioItem {
    id: string;
    userId: string;
    title: string;
    description: string;
    images: string[];
    projectUrl?: string;
    githubUrl?: string;
    liveUrl?: string;
    technologies: string[];
    category: 'web' | 'mobile' | 'design' | 'backend' | 'ai' | 'other';
    featured: boolean;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

// Create portfolio item
export const createPortfolioItem = async (
    userId: string,
    data: Omit<PortfolioItem, 'id' | 'userId' | 'views' | 'createdAt' | 'updatedAt'>
): Promise<PortfolioItem> => {
    const item: Omit<PortfolioItem, 'id'> = {
        ...data,
        userId,
        views: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(PORTFOLIO_COLLECTION).add(item);
    return { id: docRef.id, ...item };
};

// Get portfolio item by ID
export const getPortfolioItemById = async (itemId: string): Promise<PortfolioItem | null> => {
    const doc = await db.collection(PORTFOLIO_COLLECTION).doc(itemId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as PortfolioItem;
};

// Get portfolio for user
export const getPortfolioForUser = async (userId: string): Promise<PortfolioItem[]> => {
    const snapshot = await db.collection(PORTFOLIO_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('featured', 'desc')
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PortfolioItem));
};

// Update portfolio item
export const updatePortfolioItem = async (
    itemId: string,
    userId: string,
    updates: Partial<Omit<PortfolioItem, 'id' | 'userId' | 'createdAt'>>
): Promise<PortfolioItem> => {
    const item = await getPortfolioItemById(itemId);
    if (!item) throw new Error('Portfolio item not found');
    if (item.userId !== userId) throw new Error('Unauthorized');

    await db.collection(PORTFOLIO_COLLECTION).doc(itemId).update({
        ...updates,
        updatedAt: new Date(),
    });

    return { ...item, ...updates };
};

// Delete portfolio item
export const deletePortfolioItem = async (itemId: string, userId: string): Promise<void> => {
    const item = await getPortfolioItemById(itemId);
    if (!item) throw new Error('Portfolio item not found');
    if (item.userId !== userId) throw new Error('Unauthorized');

    await db.collection(PORTFOLIO_COLLECTION).doc(itemId).delete();
};

// Increment view count
export const incrementViews = async (itemId: string): Promise<void> => {
    await db.collection(PORTFOLIO_COLLECTION).doc(itemId).update({
        views: (await getPortfolioItemById(itemId))?.views! + 1 || 1,
    });
};
