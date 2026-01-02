import { db } from '../../config/firebase.js';
import type { Conversation, Message } from '../../types/firestore.js';

const CONVERSATIONS_COLLECTION = 'conversations';

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

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
    const snapshot = await db
        .collection(CONVERSATIONS_COLLECTION)
        .where('participants', 'array-contains', userId)
        .orderBy('lastMessageAt', 'desc')
        .limit(50)
        .get();

    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
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
    });

    return { id: docRef.id, ...message };
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
