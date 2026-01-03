// Favorites Module - Service
// Handles saved/favorite items

import { db } from '../../config/firebase.js';

const FAVORITES_COLLECTION = 'favorites';

export interface Favorite {
    id: string;
    userId: string;
    itemType: 'mission' | 'contributor' | 'team' | 'search';
    itemId: string;
    itemTitle?: string;
    itemData?: Record<string, any>; // For saved searches
    createdAt: Date;
}

// Add favorite
export const addFavorite = async (
    userId: string,
    itemType: Favorite['itemType'],
    itemId: string,
    itemTitle?: string,
    itemData?: Record<string, any>
): Promise<Favorite> => {
    // Check if already exists
    const existing = await db.collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('itemType', '==', itemType)
        .where('itemId', '==', itemId)
        .get();

    if (!existing.empty) {
        throw new Error('Item already in favorites');
    }

    const favorite: Omit<Favorite, 'id'> = {
        userId,
        itemType,
        itemId,
        itemTitle,
        itemData,
        createdAt: new Date(),
    };

    const docRef = await db.collection(FAVORITES_COLLECTION).add(favorite);
    return { id: docRef.id, ...favorite };
};

// Remove favorite
export const removeFavorite = async (
    userId: string,
    itemType: Favorite['itemType'],
    itemId: string
): Promise<void> => {
    const snapshot = await db.collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('itemType', '==', itemType)
        .where('itemId', '==', itemId)
        .get();

    if (snapshot.empty) {
        throw new Error('Favorite not found');
    }

    await snapshot.docs[0].ref.delete();
};

// Get favorites for user
export const getFavoritesForUser = async (
    userId: string,
    itemType?: Favorite['itemType']
): Promise<Favorite[]> => {
    let query = db.collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc');

    if (itemType) {
        query = db.collection(FAVORITES_COLLECTION)
            .where('userId', '==', userId)
            .where('itemType', '==', itemType)
            .orderBy('createdAt', 'desc');
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Favorite));
};

// Check if item is favorited
export const isFavorite = async (
    userId: string,
    itemType: Favorite['itemType'],
    itemId: string
): Promise<boolean> => {
    const snapshot = await db.collection(FAVORITES_COLLECTION)
        .where('userId', '==', userId)
        .where('itemType', '==', itemType)
        .where('itemId', '==', itemId)
        .limit(1)
        .get();

    return !snapshot.empty;
};

// Toggle favorite
export const toggleFavorite = async (
    userId: string,
    itemType: Favorite['itemType'],
    itemId: string,
    itemTitle?: string
): Promise<{ favorited: boolean }> => {
    const exists = await isFavorite(userId, itemType, itemId);

    if (exists) {
        await removeFavorite(userId, itemType, itemId);
        return { favorited: false };
    } else {
        await addFavorite(userId, itemType, itemId, itemTitle);
        return { favorited: true };
    }
};
