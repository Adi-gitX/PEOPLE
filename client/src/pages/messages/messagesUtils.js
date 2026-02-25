export const getOtherParticipantIds = (conversation, currentUserId) => {
    return (conversation?.participants || []).filter((participantId) => participantId !== currentUserId);
};

export const getOtherParticipantName = (conversation, currentUserId) => {
    const otherParticipantIds = getOtherParticipantIds(conversation, currentUserId);
    if (otherParticipantIds.length === 0) return 'Unknown';

    const names = otherParticipantIds.map((participantId) => (
        conversation?.participantProfiles?.[participantId]?.fullName || participantId
    ));

    return names.join(', ');
};

export const getOtherParticipantInitial = (conversation, currentUserId) => {
    const name = getOtherParticipantName(conversation, currentUserId);
    return name.charAt(0).toUpperCase() || 'U';
};

export const findConversationById = (conversations, conversationId) => {
    if (!conversationId) return null;
    return (conversations || []).find((conversation) => conversation.id === conversationId) || null;
};
