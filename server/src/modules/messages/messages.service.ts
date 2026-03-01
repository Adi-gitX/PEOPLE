import { db } from '../../config/firebase.js';
import type { Conversation, Message } from '../../types/firestore.js';

const CONVERSATIONS_COLLECTION = 'conversations';
const USERS_COLLECTION = 'users';

interface ParticipantProfile {
    fullName: string;
    avatarUrl?: string;
}

export interface ConversationWithMeta extends Conversation {
    lastMessage?: string;
    unreadCount?: number;
    participantProfiles?: Record<string, ParticipantProfile>;
}

export const createConversation = async (
    data: Omit<Conversation, 'id' | 'createdAt'>
): Promise<Conversation> => {
    const conversation: Omit<Conversation, 'id'> = {
        ...data,
        createdAt: new Date(),
        lastMessageAt: new Date(),
    };

    const docRef = await db.collection(CONVERSATIONS_COLLECTION).add(conversation);
    return { id: docRef.id, ...conversation };
};

export const getOrCreateDirectConversation = async (
    userId1: string,
    userId2: string
): Promise<Conversation> => {
    // Check if conversation already exists
    const participants = [userId1, userId2].sort();

    const snapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .where('type', '==', 'direct')
        .where('participants', '==', participants)
        .limit(1)
        .get();

    if (!snapshot.empty) {
        const doc = snapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Conversation;
    }

    // Create new conversation
    return createConversation({
        type: 'direct',
        participants,
    });
};

const getParticipantProfiles = async (
    participantIds: string[]
): Promise<Record<string, ParticipantProfile>> => {
    const uniqueParticipantIds = Array.from(new Set(participantIds));
    const profileEntries = await Promise.all(
        uniqueParticipantIds.map(async (id) => {
            const userDoc = await db.collection(USERS_COLLECTION).doc(id).get();
            if (!userDoc.exists) {
                return [id, { fullName: 'Unknown' }] as const;
            }

            return [id, {
                fullName: userDoc.data()?.fullName || 'Unknown',
                avatarUrl: userDoc.data()?.avatarUrl,
            }] as const;
        })
    );

    return Object.fromEntries(profileEntries);
};

const getConversationPreview = async (
    conversationId: string,
    userId: string
): Promise<{ lastMessage?: string; unreadCount: number }> => {
    const messagesRef = db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages');

    const [latestMessageSnapshot, recentMessagesSnapshot] = await Promise.all([
        messagesRef.orderBy('createdAt', 'desc').limit(1).get(),
        messagesRef.orderBy('createdAt', 'desc').limit(100).get(),
    ]);

    const latestMessage = latestMessageSnapshot.empty
        ? undefined
        : (latestMessageSnapshot.docs[0].data() as Message).content;

    const unreadCount = recentMessagesSnapshot.docs.reduce((count, doc) => {
        const message = doc.data() as Message;
        if (message.senderId === userId) return count;
        if (message.isDeleted) return count;
        return (message.readBy || []).includes(userId) ? count : count + 1;
    }, 0);

    return {
        lastMessage: latestMessage,
        unreadCount,
    };
};

export const getUserConversations = async (userId: string): Promise<ConversationWithMeta[]> => {
    const snapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(50)
        .get();

    const conversations = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Conversation)
    );

    const allParticipantIds = conversations.flatMap((conversation) => conversation.participants);
    const participantProfiles = await getParticipantProfiles(allParticipantIds);

    const conversationsWithMeta = await Promise.all(
        conversations.map(async (conversation) => {
            const preview = await getConversationPreview(conversation.id!, userId);

            return {
                ...conversation,
                lastMessage: preview.lastMessage,
                unreadCount: preview.unreadCount,
                participantProfiles,
            };
        })
    );

    return conversationsWithMeta;
};

export const getConversationById = async (conversationId: string): Promise<Conversation | null> => {
    const doc = await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as Conversation;
};

export const getMessages = async (
    conversationId: string,
    options: { limit?: number; beforeId?: string } = {}
): Promise<Message[]> => {
    let query: FirebaseFirestore.Query = db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .orderBy('createdAt', 'desc');

    if (options.limit) {
        query = query.limit(options.limit);
    } else {
        query = query.limit(50);
    }

    const snapshot = await query.get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)).reverse();
};

export const sendMessage = async (
    conversationId: string,
    senderId: string,
    senderName: string,
    content: string,
    messageType: Message['messageType'] = 'text'
): Promise<Message> => {
    const message: Omit<Message, 'id'> = {
        conversationId,
        senderId,
        senderName,
        content,
        messageType,
        readBy: [senderId],
        isEdited: false,
        isDeleted: false,
        createdAt: new Date(),
    };

    const messagesRef = db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages');

    const docRef = await messagesRef.add(message);

    // Update conversation's lastMessageAt
    await db.collection(CONVERSATIONS_COLLECTION).doc(conversationId).update({
        lastMessageAt: new Date(),
        lastMessage: content.slice(0, 200),
    });

    return { id: docRef.id, ...message };
};

export const markConversationAsRead = async (
    conversationId: string,
    userId: string
): Promise<number> => {
    const messagesSnapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .get();

    const batch = db.batch();
    let updatedCount = 0;

    messagesSnapshot.docs.forEach((doc) => {
        const message = doc.data() as Message;
        const alreadyRead = (message.readBy || []).includes(userId);
        const isOwnMessage = message.senderId === userId;

        if (!isOwnMessage && !alreadyRead) {
            const nextReadBy = Array.from(new Set([...(message.readBy || []), userId]));
            batch.update(doc.ref, { readBy: nextReadBy });
            updatedCount += 1;
        }
    });

    if (updatedCount > 0) {
        await batch.commit();
    }

    return updatedCount;
};

export const editMessage = async (
    conversationId: string,
    messageId: string,
    newContent: string
): Promise<void> => {
    await db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .doc(messageId)
        .update({
            content: newContent,
            isEdited: true,
            editedAt: new Date(),
        });
};

export const deleteMessage = async (
    conversationId: string,
    messageId: string
): Promise<void> => {
    await db
        .collection(CONVERSATIONS_COLLECTION)
        .doc(conversationId)
        .collection('messages')
        .doc(messageId)
        .update({
            isDeleted: true,
            content: 'This message was deleted',
        });
};
