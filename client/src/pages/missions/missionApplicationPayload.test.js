import { describe, it, expect } from 'vitest';
import { buildMissionApplicationPayload } from './missionApplicationPayload';

describe('buildMissionApplicationPayload', () => {
    it('converts proposedTimeline to number when provided', () => {
        const payload = buildMissionApplicationPayload({
            coverLetter: 'I can deliver this quickly.',
            proposedTimeline: '14',
            proposedApproach: 'Ship in milestones',
        });

        expect(payload).toEqual({
            coverLetter: 'I can deliver this quickly.',
            proposedTimeline: 14,
            proposedApproach: 'Ship in milestones',
        });
    });

    it('allows omitted timeline', () => {
        const payload = buildMissionApplicationPayload({
            coverLetter: 'Ready to start.',
            proposedTimeline: '',
            proposedApproach: '',
        });

        expect(payload.proposedTimeline).toBeUndefined();
    });

    it('throws on invalid timeline', () => {
        expect(() => buildMissionApplicationPayload({
            coverLetter: 'Ready to start.',
            proposedTimeline: 'zero',
            proposedApproach: 'Approach',
        })).toThrow('Proposed timeline must be a positive number of days');
    });

    it('throws when cover letter is missing', () => {
        expect(() => buildMissionApplicationPayload({
            coverLetter: '   ',
            proposedTimeline: '5',
            proposedApproach: 'Approach',
        })).toThrow('Cover letter is required');
    });
});
