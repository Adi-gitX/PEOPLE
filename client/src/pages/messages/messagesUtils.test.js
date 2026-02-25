import { describe, it, expect } from 'vitest';
import {
    findConversationById,
    getOtherParticipantInitial,
    getOtherParticipantName,
} from './messagesUtils';

describe('messagesUtils', () => {
    const conversation = {
        id: 'c1',
        participants: ['u1', 'u2', 'u3'],
        participantProfiles: {
            u1: { fullName: 'Current User' },
            u2: { fullName: 'Alice Johnson' },
            u3: { fullName: 'Bob Lee' },
        },
    };

    it('resolves participant display names excluding current user', () => {
        expect(getOtherParticipantName(conversation, 'u1')).toBe('Alice Johnson, Bob Lee');
    });

    it('falls back to participant id when profile name is missing', () => {
        const withoutProfile = {
            ...conversation,
            participantProfiles: {},
        };
        expect(getOtherParticipantName(withoutProfile, 'u1')).toBe('u2, u3');
    });

    it('returns participant initial from resolved name', () => {
        expect(getOtherParticipantInitial(conversation, 'u1')).toBe('A');
    });

    it('selects a conversation by id', () => {
        const selected = findConversationById([conversation], 'c1');
        expect(selected?.id).toBe('c1');
        expect(findConversationById([conversation], 'missing')).toBeNull();
    });
});
