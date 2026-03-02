import { db } from '../../config/firebase.js';
import type { ContributorProfile, InitiatorProfile, User } from '../../types/firestore.js';

const USERS_COLLECTION = 'users';
const CONTRIBUTOR_PROFILES_COLLECTION = 'contributorProfiles';
const INITIATOR_PROFILES_COLLECTION = 'initiatorProfiles';

export interface SearchUsersOptions {
    q?: string;
    role?: 'contributor' | 'initiator';
    skills?: string[];
    location?: string;
    availability?: boolean;
    verified?: boolean;
    minRate?: number;
    maxRate?: number;
    sort?: 'relevance' | 'trust' | 'match_power' | 'newest';
    limit?: number;
    cursor?: string;
}

export interface PublicSearchUser {
    id: string;
    userId: string;
    role: 'contributor' | 'initiator';
    roleContext: 'contributor' | 'initiator';
    rolesAvailable: Array<'contributor' | 'initiator'>;
    fullName: string;
    avatarUrl?: string;
    headline?: string;
    bio?: string;
    skills: string[];
    location?: string;
    availability?: boolean;
    verified: boolean;
    trustScore: number;
    matchPower: number;
    createdAt?: string | null;
}

interface SearchCandidate extends PublicSearchUser {
    _searchHaystack: string;
    _relevanceScore: number;
}

const normalize = (value: string | undefined): string => (value || '').trim().toLowerCase();

const toIsoString = (value: unknown): string | null => {
    if (!value) return null;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'object' && value !== null && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
        return (value as { toDate: () => Date }).toDate().toISOString();
    }
    if (typeof value === 'string') {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    }
    return null;
};

const tokenScore = (haystack: string, query: string): number => {
    if (!query) return 0;
    const tokens = query.split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0;
    return tokens.reduce((score, token) => (haystack.includes(token) ? score + 1 : score), 0);
};

const getCursorOffset = (cursor: string | undefined): number => {
    if (!cursor) return 0;
    const parsed = parseInt(cursor, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const searchUsers = async (options: SearchUsersOptions): Promise<{ users: PublicSearchUser[]; nextCursor: string | null }> => {
    const limit = Math.min(Math.max(options.limit || 20, 1), 100);
    const query = normalize(options.q);
    const roleFilter = options.role;
    const locationFilter = normalize(options.location);
    const skillsFilter = Array.from(new Set((options.skills || []).map(normalize).filter(Boolean)));
    const offset = getCursorOffset(options.cursor);

    const [usersSnapshot, contributorSnapshot, initiatorSnapshot] = await Promise.all([
        db.collection(USERS_COLLECTION)
            .where('primaryRole', 'in', ['contributor', 'initiator'])
            .get(),
        db.collection(CONTRIBUTOR_PROFILES_COLLECTION).get(),
        db.collection(INITIATOR_PROFILES_COLLECTION).get(),
    ]);

    const userMap = new Map<string, User>();
    usersSnapshot.docs.forEach((doc) => {
        userMap.set(doc.id, { id: doc.id, ...doc.data() } as User);
    });

    const contributorMap = new Map<string, ContributorProfile>();
    contributorSnapshot.docs.forEach((doc) => {
        contributorMap.set(doc.id, { id: doc.id, ...doc.data() } as ContributorProfile);
    });

    const initiatorMap = new Map<string, InitiatorProfile>();
    initiatorSnapshot.docs.forEach((doc) => {
        initiatorMap.set(doc.id, { id: doc.id, ...doc.data() } as InitiatorProfile);
    });

    const merged: SearchCandidate[] = [];

    for (const [userId, user] of userMap.entries()) {
        if (user.accountStatus && user.accountStatus !== 'active') continue;
        if (user.primaryRole === 'admin') continue;

        const contributorProfile = contributorMap.get(userId) || null;
        const initiatorProfile = initiatorMap.get(userId) || null;
        const rolesAvailable: Array<'contributor' | 'initiator'> = [];
        if (contributorProfile) rolesAvailable.push('contributor');
        if (initiatorProfile) rolesAvailable.push('initiator');
        if (rolesAvailable.length === 0) continue;
        if (roleFilter && !rolesAvailable.includes(roleFilter)) continue;

        const contributorSkillNames = (contributorProfile?.skills || [])
            .map((skill) => normalize(skill.skillName))
            .filter(Boolean);
        const roleContext: 'contributor' | 'initiator' = roleFilter
            || (rolesAvailable.includes(user.primaryRole as 'contributor' | 'initiator')
                ? user.primaryRole as 'contributor' | 'initiator'
                : rolesAvailable[0]);

        const resolvedContributor = contributorProfile || null;
        const resolvedInitiator = initiatorProfile || null;

        const contributorView = {
            headline: resolvedContributor?.headline,
            bio: resolvedContributor?.bio,
            skills: (resolvedContributor?.skills || []).map((skill) => skill.skillName).filter(Boolean),
            location: resolvedContributor?.timezone,
            availability: resolvedContributor?.isLookingForWork,
            verified: resolvedContributor?.verificationStatus === 'verified',
            trustScore: resolvedContributor?.trustScore || 0,
            matchPower: resolvedContributor?.matchPower || 0,
            createdAt: toIsoString(resolvedContributor?.createdAt),
        };

        const initiatorView = {
            headline: resolvedInitiator?.companyName,
            bio: resolvedInitiator?.industry,
            location: resolvedInitiator?.companySize,
            verified: Boolean(resolvedInitiator?.isVerified),
            trustScore: Math.min(Math.round((resolvedInitiator?.averageRating || 0) * 20), 100),
            matchPower: Math.min(resolvedInitiator?.totalMissionsPosted || 0, 100),
            createdAt: toIsoString(resolvedInitiator?.createdAt),
        };

        const selectedView = roleContext === 'contributor'
            ? contributorView
            : initiatorView;

        const candidate: SearchCandidate = {
            id: userId,
            userId,
            role: roleContext,
            roleContext,
            rolesAvailable,
            fullName: user.fullName || 'Unknown',
            avatarUrl: user.avatarUrl,
            headline: selectedView.headline,
            bio: selectedView.bio,
            skills: contributorView.skills,
            location: selectedView.location,
            availability: roleContext === 'contributor'
                ? contributorView.availability
                : true,
            verified: selectedView.verified,
            trustScore: selectedView.trustScore,
            matchPower: selectedView.matchPower,
            createdAt: selectedView.createdAt,
            _searchHaystack: normalize([
                user.fullName,
                contributorView.headline,
                contributorView.bio,
                contributorView.location,
                contributorView.skills.join(' '),
                initiatorView.headline,
                initiatorView.bio,
                initiatorView.location,
            ].join(' ')),
            _relevanceScore: 0,
        };

        if (typeof options.availability === 'boolean' && roleContext === 'contributor' && candidate.availability !== options.availability) {
            continue;
        }
        if (typeof options.verified === 'boolean' && candidate.verified !== options.verified) continue;
        if (locationFilter && !normalize(candidate.location).includes(locationFilter)) continue;
        if (skillsFilter.length > 0) {
            if (!resolvedContributor) continue;
            if (!skillsFilter.every((skill) => contributorSkillNames.includes(skill))) continue;
        }

        candidate._relevanceScore = tokenScore(candidate._searchHaystack, query);
        if (query && candidate._relevanceScore === 0) continue;
        merged.push(candidate);
    }

    const sortBy = options.sort || (query ? 'relevance' : 'trust');
    const ranked = merged.sort((a, b) => {
        if (sortBy === 'trust') {
            return (b.trustScore || 0) - (a.trustScore || 0);
        }
        if (sortBy === 'match_power') {
            return (b.matchPower || 0) - (a.matchPower || 0);
        }
        if (sortBy === 'newest') {
            const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return bTime - aTime;
        }

        if (a._relevanceScore !== b._relevanceScore) return b._relevanceScore - a._relevanceScore;
        return (b.trustScore || 0) - (a.trustScore || 0);
    });

    const paginated = ranked.slice(offset, offset + limit);
    const nextOffset = offset + paginated.length;
    const nextCursor = nextOffset < ranked.length ? String(nextOffset) : null;

    return {
        users: paginated.map((candidate) => ({
            id: candidate.id,
            userId: candidate.userId,
            role: candidate.roleContext,
            roleContext: candidate.roleContext,
            rolesAvailable: candidate.rolesAvailable,
            fullName: candidate.fullName,
            avatarUrl: candidate.avatarUrl,
            headline: candidate.headline,
            bio: candidate.bio,
            skills: candidate.skills,
            location: candidate.location,
            availability: candidate.availability,
            verified: candidate.verified,
            trustScore: candidate.trustScore,
            matchPower: candidate.matchPower,
            createdAt: candidate.createdAt,
        })),
        nextCursor,
    };
};
