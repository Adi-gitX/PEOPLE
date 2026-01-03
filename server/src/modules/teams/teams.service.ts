// Teams Module - Service
// Handles team/agency creation and management

import { db } from '../../config/firebase.js';

const TEAMS_COLLECTION = 'teams';

export interface TeamMember {
    userId: string;
    name: string;
    email?: string;
    role: 'owner' | 'admin' | 'member';
    joinedAt: Date;
}

export interface Team {
    id: string;
    name: string;
    slug: string;
    description?: string;
    ownerId: string;
    members: TeamMember[];
    type: 'agency' | 'company' | 'collective';
    verificationStatus: 'pending' | 'verified' | 'rejected';
    branding: {
        logo?: string;
        color?: string;
        website?: string;
    };
    stats: {
        totalMembers: number;
        completedMissions: number;
        totalEarnings: number;
        averageRating: number;
    };
    isPublic: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Create slug from name
const createSlug = (name: string): string => {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 50);
};

// Create team
export const createTeam = async (
    ownerId: string,
    ownerName: string,
    data: {
        name: string;
        description?: string;
        type: Team['type'];
        branding?: Team['branding'];
    }
): Promise<Team> => {
    // Check if user already owns a team
    const existingTeam = await db.collection(TEAMS_COLLECTION)
        .where('ownerId', '==', ownerId)
        .get();

    if (!existingTeam.empty) {
        throw new Error('You already own a team');
    }

    const slug = createSlug(data.name);

    // Check slug uniqueness
    const slugCheck = await db.collection(TEAMS_COLLECTION)
        .where('slug', '==', slug)
        .get();

    if (!slugCheck.empty) {
        throw new Error('Team name already taken');
    }

    const team: Omit<Team, 'id'> = {
        name: data.name,
        slug,
        description: data.description,
        ownerId,
        members: [{
            userId: ownerId,
            name: ownerName,
            role: 'owner',
            joinedAt: new Date(),
        }],
        type: data.type,
        verificationStatus: 'pending',
        branding: data.branding || {},
        stats: {
            totalMembers: 1,
            completedMissions: 0,
            totalEarnings: 0,
            averageRating: 0,
        },
        isPublic: true,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const docRef = await db.collection(TEAMS_COLLECTION).add(team);
    return { id: docRef.id, ...team };
};

// Get team by ID
export const getTeamById = async (teamId: string): Promise<Team | null> => {
    const doc = await db.collection(TEAMS_COLLECTION).doc(teamId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Team;
};

// Get team by slug
export const getTeamBySlug = async (slug: string): Promise<Team | null> => {
    const snapshot = await db.collection(TEAMS_COLLECTION)
        .where('slug', '==', slug)
        .limit(1)
        .get();

    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return { id: doc.id, ...doc.data() } as Team;
};

// Get teams for user
export const getTeamsForUser = async (userId: string): Promise<Team[]> => {
    // User might be owner or member
    const ownedSnapshot = await db.collection(TEAMS_COLLECTION)
        .where('ownerId', '==', userId)
        .get();

    const teams: Team[] = ownedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    } as Team));

    // Also get teams where user is a member (requires array-contains)
    const memberSnapshot = await db.collection(TEAMS_COLLECTION)
        .where('members', 'array-contains', { userId })
        .get();

    memberSnapshot.docs.forEach(doc => {
        if (!teams.find(t => t.id === doc.id)) {
            teams.push({ id: doc.id, ...doc.data() } as Team);
        }
    });

    return teams;
};

// Add member to team
export const addTeamMember = async (
    teamId: string,
    requesterId: string,
    newMember: { userId: string; name: string; email?: string; role?: 'admin' | 'member' }
): Promise<Team> => {
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error('Team not found');
    }

    // Check if requester is owner or admin
    const requesterMember = team.members.find(m => m.userId === requesterId);
    if (!requesterMember || !['owner', 'admin'].includes(requesterMember.role)) {
        throw new Error('Only owners and admins can add members');
    }

    // Check if user is already a member
    if (team.members.some(m => m.userId === newMember.userId)) {
        throw new Error('User is already a team member');
    }

    const member: TeamMember = {
        userId: newMember.userId,
        name: newMember.name,
        email: newMember.email,
        role: newMember.role || 'member',
        joinedAt: new Date(),
    };

    const updatedMembers = [...team.members, member];

    await db.collection(TEAMS_COLLECTION).doc(teamId).update({
        members: updatedMembers,
        'stats.totalMembers': updatedMembers.length,
        updatedAt: new Date(),
    });

    return { ...team, members: updatedMembers };
};

// Remove member from team
export const removeTeamMember = async (
    teamId: string,
    requesterId: string,
    memberIdToRemove: string
): Promise<Team> => {
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error('Team not found');
    }

    // Can't remove owner
    if (memberIdToRemove === team.ownerId) {
        throw new Error('Cannot remove team owner');
    }

    // Check if requester is owner or admin, or removing themselves
    const requesterMember = team.members.find(m => m.userId === requesterId);
    const isSelfRemoval = requesterId === memberIdToRemove;

    if (!isSelfRemoval && (!requesterMember || !['owner', 'admin'].includes(requesterMember.role))) {
        throw new Error('Only owners and admins can remove members');
    }

    const updatedMembers = team.members.filter(m => m.userId !== memberIdToRemove);

    await db.collection(TEAMS_COLLECTION).doc(teamId).update({
        members: updatedMembers,
        'stats.totalMembers': updatedMembers.length,
        updatedAt: new Date(),
    });

    return { ...team, members: updatedMembers };
};

// Update team
export const updateTeam = async (
    teamId: string,
    requesterId: string,
    updates: Partial<Pick<Team, 'name' | 'description' | 'branding' | 'isPublic'>>
): Promise<Team> => {
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error('Team not found');
    }

    // Check if requester is owner
    if (team.ownerId !== requesterId) {
        throw new Error('Only team owner can update team');
    }

    await db.collection(TEAMS_COLLECTION).doc(teamId).update({
        ...updates,
        updatedAt: new Date(),
    });

    return { ...team, ...updates };
};

// Delete team
export const deleteTeam = async (teamId: string, requesterId: string): Promise<void> => {
    const team = await getTeamById(teamId);
    if (!team) {
        throw new Error('Team not found');
    }

    if (team.ownerId !== requesterId) {
        throw new Error('Only team owner can delete team');
    }

    await db.collection(TEAMS_COLLECTION).doc(teamId).delete();
};
