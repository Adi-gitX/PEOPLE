import { db } from '../../config/firebase.js';

const WAITLIST_COLLECTION = 'waitlistLeads';
const NEWSLETTER_COLLECTION = 'newsletterLeads';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

const docIdFromEmail = (email: string): string => encodeURIComponent(normalizeEmail(email));

interface WaitlistLeadInput {
    email: string;
    role?: 'contributor' | 'initiator';
    source?: string;
    name?: string;
}

interface NewsletterLeadInput {
    email: string;
    source?: string;
}

export const upsertWaitlistLead = async (
    input: WaitlistLeadInput
): Promise<{ id: string; alreadyExists: boolean }> => {
    const id = docIdFromEmail(input.email);
    const docRef = db.collection(WAITLIST_COLLECTION).doc(id);
    const now = new Date();
    const snapshot = await docRef.get();

    const baseData = {
        email: normalizeEmail(input.email),
        role: input.role || 'contributor',
        source: input.source || 'waitlist_page',
        name: input.name?.trim() || null,
        updatedAt: now,
    };

    if (!snapshot.exists) {
        await docRef.set({
            ...baseData,
            createdAt: now,
        });
        return { id, alreadyExists: false };
    }

    await docRef.update(baseData);
    return { id, alreadyExists: true };
};

export const upsertNewsletterLead = async (
    input: NewsletterLeadInput
): Promise<{ id: string; alreadyExists: boolean }> => {
    const id = docIdFromEmail(input.email);
    const docRef = db.collection(NEWSLETTER_COLLECTION).doc(id);
    const now = new Date();
    const snapshot = await docRef.get();

    const baseData = {
        email: normalizeEmail(input.email),
        source: input.source || 'blog_page',
        updatedAt: now,
    };

    if (!snapshot.exists) {
        await docRef.set({
            ...baseData,
            createdAt: now,
        });
        return { id, alreadyExists: false };
    }

    await docRef.update(baseData);
    return { id, alreadyExists: true };
};
