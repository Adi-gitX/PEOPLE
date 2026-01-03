// Contracts Service
// Handles formal agreements between initiators and contributors

import { db } from '../../config/firebase.js';

const CONTRACTS_COLLECTION = 'contracts';

export interface Contract {
    id: string;
    missionId: string;
    proposalId?: string;
    initiatorId: string;
    contributorId: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: ContractMilestone[];
    startDate: Date;
    endDate: Date;
    status: 'draft' | 'pending_contributor' | 'pending_initiator' | 'active' | 'completed' | 'cancelled' | 'disputed';
    initiatorSignedAt?: Date;
    contributorSignedAt?: Date;
    terms: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ContractMilestone {
    id: string;
    title: string;
    description: string;
    amount: number;
    dueDate: Date;
    status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'revision_requested';
    submittedAt?: Date;
    approvedAt?: Date;
}

export interface CreateContract {
    missionId: string;
    proposalId?: string;
    contributorId: string;
    title: string;
    description: string;
    totalAmount: number;
    milestones: Omit<ContractMilestone, 'id' | 'status'>[];
    startDate: string;
    endDate: string;
    terms?: string;
}

// Create contract (usually after accepting a proposal)
export const createContract = async (
    initiatorId: string,
    data: CreateContract
): Promise<Contract> => {
    const milestones: ContractMilestone[] = data.milestones.map((m, i) => ({
        ...m,
        id: `milestone_${i + 1}`,
        status: 'pending',
        dueDate: new Date(m.dueDate),
    }));

    const contract: Omit<Contract, 'id'> = {
        missionId: data.missionId,
        proposalId: data.proposalId,
        initiatorId,
        contributorId: data.contributorId,
        title: data.title,
        description: data.description,
        totalAmount: data.totalAmount,
        milestones,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        status: 'pending_contributor',
        initiatorSignedAt: new Date(),
        terms: data.terms || getDefaultTerms(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(CONTRACTS_COLLECTION).add(contract);
    return { id: docRef.id, ...contract };
};

// Get contract by ID
export const getContractById = async (contractId: string): Promise<Contract | null> => {
    const doc = await db.collection(CONTRACTS_COLLECTION).doc(contractId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Contract;
};

// Get contracts for mission
export const getMissionContracts = async (missionId: string): Promise<Contract[]> => {
    const snapshot = await db
        .collection(CONTRACTS_COLLECTION)
        .where('missionId', '==', missionId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
};

// Get user contracts
export const getUserContracts = async (
    userId: string,
    role: 'initiator' | 'contributor'
): Promise<Contract[]> => {
    const field = role === 'initiator' ? 'initiatorId' : 'contributorId';
    const snapshot = await db
        .collection(CONTRACTS_COLLECTION)
        .where(field, '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contract));
};

// Sign contract (contributor)
export const signContract = async (
    contractId: string,
    contributorId: string
): Promise<Contract> => {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');
    if (contract.contributorId !== contributorId) throw new Error('Not authorized');
    if (contract.status !== 'pending_contributor') throw new Error('Contract not pending signature');

    await db.collection(CONTRACTS_COLLECTION).doc(contractId).update({
        status: 'active',
        contributorSignedAt: new Date(),
        updatedAt: new Date(),
    });

    return { ...contract, status: 'active', contributorSignedAt: new Date() };
};

// Update milestone status
export const updateMilestoneStatus = async (
    contractId: string,
    milestoneId: string,
    status: ContractMilestone['status']
): Promise<void> => {
    const contract = await getContractById(contractId);
    if (!contract) throw new Error('Contract not found');

    const milestones = contract.milestones.map(m => {
        if (m.id === milestoneId) {
            return {
                ...m,
                status,
                ...(status === 'submitted' ? { submittedAt: new Date() } : {}),
                ...(status === 'approved' ? { approvedAt: new Date() } : {}),
            };
        }
        return m;
    });

    // Check if all milestones are approved
    const allApproved = milestones.every(m => m.status === 'approved');

    await db.collection(CONTRACTS_COLLECTION).doc(contractId).update({
        milestones,
        status: allApproved ? 'completed' : contract.status,
        updatedAt: new Date(),
    });
};

// Get default terms template
const getDefaultTerms = (): string => {
    return `TERMS AND CONDITIONS

1. SCOPE OF WORK
The Contributor agrees to complete the work as described in this contract and its milestones.

2. PAYMENT
Payment will be made through the PEOPLE escrow system upon milestone approval.

3. INTELLECTUAL PROPERTY
Upon full payment, all intellectual property rights transfer to the Initiator.

4. CONFIDENTIALITY
Both parties agree to keep project details confidential.

5. REVISIONS
Minor revisions are included. Major scope changes require contract amendment.

6. DISPUTE RESOLUTION
Disputes will be handled through PEOPLE's dispute resolution process.

7. TERMINATION
Either party may request termination. Payment for completed work is guaranteed.
`;
};
