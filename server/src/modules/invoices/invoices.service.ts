// Invoices Module - Service
// Handles invoice generation and management

import { db } from '../../config/firebase.js';

const INVOICES_COLLECTION = 'invoices';
const MISSIONS_COLLECTION = 'missions';

export interface InvoiceItem {
    description: string;
    quantity: number;
    unitPrice: number;
    amount: number;
}

export interface Invoice {
    id: string;
    number: string;
    missionId: string;
    missionTitle: string;
    fromUserId: string;
    fromName: string;
    fromEmail: string;
    toUserId: string;
    toName: string;
    toEmail: string;
    items: InvoiceItem[];
    subtotal: number;
    platformFee: number;
    platformFeePercent: number;
    total: number;
    currency: string;
    status: 'draft' | 'sent' | 'paid' | 'void' | 'refunded';
    notes?: string;
    dueDate?: Date;
    paidAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get count of invoices this month
    const snapshot = await db.collection(INVOICES_COLLECTION)
        .where('number', '>=', `INV-${year}${month}`)
        .where('number', '<', `INV-${year}${month}~`)
        .count()
        .get();

    const count = snapshot.data().count + 1;
    return `INV-${year}${month}-${String(count).padStart(4, '0')}`;
};

// Create invoice for a mission
export const createInvoice = async (
    missionId: string,
    contributorId: string,
    items: InvoiceItem[]
): Promise<Invoice> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) {
        throw new Error('Mission not found');
    }

    const mission = missionDoc.data()!;
    const PLATFORM_FEE_PERCENT = 10;

    // Get user details
    const contributorDoc = await db.collection('contributorProfiles').doc(contributorId).get();
    const initiatorDoc = await db.collection('users').doc(mission.initiatorId).get();

    const contributor = contributorDoc.data() || {};
    const initiator = initiatorDoc.data() || {};

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const platformFee = Math.round(subtotal * (PLATFORM_FEE_PERCENT / 100) * 100) / 100;
    const total = subtotal;

    const invoiceNumber = await generateInvoiceNumber();

    const invoice: Omit<Invoice, 'id'> = {
        number: invoiceNumber,
        missionId,
        missionTitle: mission.title,
        fromUserId: contributorId,
        fromName: contributor.headline || 'Contributor',
        fromEmail: contributor.email || '',
        toUserId: mission.initiatorId,
        toName: initiator.fullName || mission.initiatorName || 'Client',
        toEmail: initiator.email || '',
        items,
        subtotal,
        platformFee,
        platformFeePercent: PLATFORM_FEE_PERCENT,
        total,
        currency: 'USD',
        status: 'draft',
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(INVOICES_COLLECTION).add(invoice);
    return { id: docRef.id, ...invoice };
};

// Get invoice by ID
export const getInvoiceById = async (invoiceId: string): Promise<Invoice | null> => {
    const doc = await db.collection(INVOICES_COLLECTION).doc(invoiceId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Invoice;
};

// Get invoices for user
export const getInvoicesForUser = async (userId: string): Promise<Invoice[]> => {
    const fromSnapshot = await db.collection(INVOICES_COLLECTION)
        .where('fromUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const toSnapshot = await db.collection(INVOICES_COLLECTION)
        .where('toUserId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const invoices = new Map<string, Invoice>();

    fromSnapshot.docs.forEach(doc => {
        invoices.set(doc.id, { id: doc.id, ...doc.data() } as Invoice);
    });

    toSnapshot.docs.forEach(doc => {
        if (!invoices.has(doc.id)) {
            invoices.set(doc.id, { id: doc.id, ...doc.data() } as Invoice);
        }
    });

    return Array.from(invoices.values())
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

// Update invoice status
export const updateInvoiceStatus = async (
    invoiceId: string,
    status: Invoice['status']
): Promise<Invoice> => {
    const invoice = await getInvoiceById(invoiceId);
    if (!invoice) {
        throw new Error('Invoice not found');
    }

    const updates: Partial<Invoice> = {
        status,
        updatedAt: new Date(),
    };

    if (status === 'paid') {
        updates.paidAt = new Date();
    }

    await db.collection(INVOICES_COLLECTION).doc(invoiceId).update(updates);
    return { ...invoice, ...updates };
};

// Generate invoice from mission completion
export const generateMissionInvoice = async (
    missionId: string
): Promise<Invoice> => {
    const missionDoc = await db.collection(MISSIONS_COLLECTION).doc(missionId).get();
    if (!missionDoc.exists) {
        throw new Error('Mission not found');
    }

    const mission = missionDoc.data()!;

    if (!mission.contributorId) {
        throw new Error('Mission has no assigned contributor');
    }

    const items: InvoiceItem[] = [{
        description: `${mission.title} - Project Completion`,
        quantity: 1,
        unitPrice: mission.budgetMax,
        amount: mission.budgetMax,
    }];

    return createInvoice(missionId, mission.contributorId, items);
};
