import { db } from '../../config/firebase.js';

const PORTFOLIO_COLLECTION = 'portfolioItems';

export interface PortfolioItem {
    id: string;
    userId: string;
    title: string;
    summary: string;
    role?: string;
    skills: string[];
    outcome?: string;
    projectUrl?: string;
    externalLinks: string[];
    imageUrls: string[];
    featured: boolean;
    sortOrder: number;
    completedAt?: Date | null;
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

type PortfolioInput = Partial<PortfolioItem> & {
    description?: string;
    images?: string[];
    technologies?: string[];
    githubUrl?: string;
    liveUrl?: string;
};

const normalizeText = (value: unknown): string | undefined => {
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
};

const normalizeStringArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => normalizeText(entry))
        .filter((entry): entry is string => Boolean(entry));
};

const normalizeUrl = (value: unknown): string | undefined => {
    const text = normalizeText(value);
    if (!text) return undefined;
    try {
        const parsed = new URL(text);
        if (!['http:', 'https:'].includes(parsed.protocol)) return undefined;
        return parsed.toString();
    } catch {
        return undefined;
    }
};

const normalizeUrlArray = (value: unknown): string[] => {
    if (!Array.isArray(value)) return [];
    return value
        .map((entry) => normalizeUrl(entry))
        .filter((entry): entry is string => Boolean(entry));
};

const toDate = (value: unknown): Date | null => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate();
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    return null;
};

const deserializeItem = (doc: FirebaseFirestore.QueryDocumentSnapshot | FirebaseFirestore.DocumentSnapshot): PortfolioItem | null => {
    if (!doc.exists) return null;
    const data = doc.data() as FirebaseFirestore.DocumentData;
    const createdAt = toDate(data.createdAt) || new Date();
    const updatedAt = toDate(data.updatedAt) || createdAt;

    return {
        id: doc.id,
        userId: data.userId,
        title: data.title || 'Untitled Project',
        summary: data.summary || data.description || '',
        role: data.role,
        skills: Array.isArray(data.skills)
            ? data.skills
            : Array.isArray(data.technologies)
                ? data.technologies
                : [],
        outcome: data.outcome,
        projectUrl: data.projectUrl || data.liveUrl || undefined,
        externalLinks: Array.isArray(data.externalLinks)
            ? data.externalLinks
            : [data.githubUrl, data.liveUrl].filter(Boolean),
        imageUrls: Array.isArray(data.imageUrls)
            ? data.imageUrls
            : Array.isArray(data.images)
                ? data.images
                : [],
        featured: Boolean(data.featured),
        sortOrder: Number.isFinite(data.sortOrder) ? data.sortOrder : 9999,
        completedAt: toDate(data.completedAt),
        views: Number.isFinite(data.views) ? data.views : 0,
        createdAt,
        updatedAt,
    };
};

const buildNormalizedUpdate = (data: PortfolioInput): Record<string, unknown> => {
    const title = normalizeText(data.title);
    const summary = normalizeText(data.summary) || normalizeText(data.description);
    const role = normalizeText(data.role);
    const outcome = normalizeText(data.outcome);
    const projectUrl = normalizeUrl(data.projectUrl) || normalizeUrl(data.liveUrl);
    const imageUrls = normalizeUrlArray(data.imageUrls || data.images || []);
    const externalLinks = [
        ...normalizeUrlArray(data.externalLinks || []),
        ...(normalizeUrl(data.githubUrl) ? [normalizeUrl(data.githubUrl)] : []),
        ...(normalizeUrl(data.liveUrl) ? [normalizeUrl(data.liveUrl)] : []),
    ];
    const skills = normalizeStringArray(data.skills || data.technologies || []);

    const payload: Record<string, unknown> = {
        updatedAt: new Date(),
    };

    if (title !== undefined) payload.title = title;
    if (summary !== undefined) payload.summary = summary;
    if (role !== undefined) payload.role = role;
    if (outcome !== undefined) payload.outcome = outcome;
    if (projectUrl !== undefined) payload.projectUrl = projectUrl;
    if (imageUrls.length > 0 || Array.isArray(data.imageUrls) || Array.isArray(data.images)) payload.imageUrls = imageUrls;
    if (externalLinks.length > 0 || Array.isArray(data.externalLinks)) payload.externalLinks = Array.from(new Set(externalLinks));
    if (skills.length > 0 || Array.isArray(data.skills) || Array.isArray(data.technologies)) payload.skills = skills;
    if (typeof data.featured === 'boolean') payload.featured = data.featured;
    if (typeof data.sortOrder === 'number' && Number.isFinite(data.sortOrder)) payload.sortOrder = Math.max(0, data.sortOrder);
    if (data.completedAt !== undefined) payload.completedAt = toDate(data.completedAt) || null;

    return payload;
};

export const createPortfolioItem = async (
    userId: string,
    data: PortfolioInput
): Promise<PortfolioItem> => {
    const title = normalizeText(data.title);
    if (!title) {
        throw new Error('Portfolio item title is required');
    }

    const existing = await db
        .collection(PORTFOLIO_COLLECTION)
        .where('userId', '==', userId)
        .orderBy('sortOrder', 'desc')
        .limit(1)
        .get();

    const nextSortOrder = existing.empty
        ? 0
        : Math.max(Number(existing.docs[0].data().sortOrder || 0), 0) + 1;

    const now = new Date();
    const normalized = buildNormalizedUpdate(data);
    const payload: Record<string, unknown> = {
        userId,
        title,
        summary: normalizeText(data.summary) || normalizeText(data.description) || '',
        role: normalizeText(data.role),
        skills: normalizeStringArray(data.skills || data.technologies || []),
        outcome: normalizeText(data.outcome),
        projectUrl: normalizeUrl(data.projectUrl) || normalizeUrl(data.liveUrl),
        externalLinks: normalizeUrlArray(data.externalLinks || []),
        imageUrls: normalizeUrlArray(data.imageUrls || data.images || []),
        featured: Boolean(data.featured),
        sortOrder: typeof data.sortOrder === 'number' ? Math.max(0, data.sortOrder) : nextSortOrder,
        completedAt: toDate(data.completedAt),
        views: 0,
        createdAt: now,
        updatedAt: now,
        ...normalized,
    };

    const docRef = await db.collection(PORTFOLIO_COLLECTION).add(payload);
    const created = await docRef.get();
    const item = deserializeItem(created);
    if (!item) throw new Error('Failed to create portfolio item');
    return item;
};

export const getPortfolioItemById = async (itemId: string): Promise<PortfolioItem | null> => {
    const doc = await db.collection(PORTFOLIO_COLLECTION).doc(itemId).get();
    return deserializeItem(doc);
};

export const getPortfolioForUser = async (userId: string): Promise<PortfolioItem[]> => {
    const snapshot = await db.collection(PORTFOLIO_COLLECTION)
        .where('userId', '==', userId)
        .get();

    const items = snapshot.docs
        .map((doc) => deserializeItem(doc))
        .filter((item): item is PortfolioItem => Boolean(item));

    return items.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
};

export const updatePortfolioItem = async (
    itemId: string,
    userId: string,
    updates: PortfolioInput
): Promise<PortfolioItem> => {
    const item = await getPortfolioItemById(itemId);
    if (!item) throw new Error('Portfolio item not found');
    if (item.userId !== userId) throw new Error('Unauthorized');

    const normalized = buildNormalizedUpdate(updates);
    if (Object.keys(normalized).length === 1 && normalized.updatedAt) {
        throw new Error('No valid update fields provided');
    }

    await db.collection(PORTFOLIO_COLLECTION).doc(itemId).set(normalized, { merge: true });
    const updated = await getPortfolioItemById(itemId);
    if (!updated) throw new Error('Portfolio item not found');
    return updated;
};

export const deletePortfolioItem = async (itemId: string, userId: string): Promise<void> => {
    const item = await getPortfolioItemById(itemId);
    if (!item) throw new Error('Portfolio item not found');
    if (item.userId !== userId) throw new Error('Unauthorized');

    await db.collection(PORTFOLIO_COLLECTION).doc(itemId).delete();
};

export const reorderPortfolioItems = async (userId: string, itemIds: string[]): Promise<void> => {
    const uniqueIds = Array.from(new Set(itemIds.filter(Boolean)));
    if (uniqueIds.length === 0) return;

    const docs = await Promise.all(uniqueIds.map((itemId) => db.collection(PORTFOLIO_COLLECTION).doc(itemId).get()));
    docs.forEach((doc) => {
        const item = deserializeItem(doc);
        if (!item) {
            throw new Error('Portfolio item not found');
        }
        if (item.userId !== userId) {
            throw new Error('Unauthorized');
        }
    });

    const batch = db.batch();
    const now = new Date();
    uniqueIds.forEach((itemId, index) => {
        const ref = db.collection(PORTFOLIO_COLLECTION).doc(itemId);
        batch.set(ref, { sortOrder: index, updatedAt: now }, { merge: true });
    });
    await batch.commit();
};

export const incrementViews = async (itemId: string): Promise<void> => {
    const ref = db.collection(PORTFOLIO_COLLECTION).doc(itemId);
    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(ref);
        if (!doc.exists) return;
        const current = Number(doc.data()?.views || 0);
        transaction.update(ref, {
            views: current + 1,
            updatedAt: new Date(),
        });
    });
};
