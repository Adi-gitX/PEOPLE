export const buildMissionApplicationPayload = (applicationData) => {
    const coverLetter = applicationData.coverLetter?.trim();
    const proposedApproach = applicationData.proposedApproach?.trim();

    if (!coverLetter) {
        throw new Error('Cover letter is required');
    }

    const hasTimelineValue = applicationData.proposedTimeline !== ''
        && applicationData.proposedTimeline !== null
        && applicationData.proposedTimeline !== undefined;

    const proposedTimeline = hasTimelineValue
        ? Number(applicationData.proposedTimeline)
        : undefined;

    if (hasTimelineValue && (!Number.isFinite(proposedTimeline) || proposedTimeline < 1)) {
        throw new Error('Proposed timeline must be a positive number of days');
    }

    return {
        coverLetter,
        proposedTimeline,
        proposedApproach: proposedApproach || undefined,
    };
};
