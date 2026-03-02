import { Request, Response } from 'express';
import * as messagesService from './messages.service.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';
import { db } from '../../config/firebase.js';

const USERS_COLLECTION = 'users';

export const getMyConversations = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const conversations = await messagesService.getUserConversations(uid);
        sendSuccess(res, { conversations });
    } catch {
        sendError(res, 'Failed to get conversations', 500);
    }
};

export const getConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;
        const conversation = await messagesService.getConversationById(id);
        if (!conversation) {
            sendError(res, 'Conversation not found', 404);
            return;
        }
        if (!conversation.participants.includes(uid!)) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        sendSuccess(res, { conversation });
    } catch {
        sendError(res, 'Failed to get conversation', 500);
    }
};

export const getMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;
        const { limit } = req.query;
        const conversation = await messagesService.getConversationById(id);
        if (!conversation || !conversation.participants.includes(uid!)) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        const messages = await messagesService.getMessages(id, {
            limit: limit ? parseInt(limit as string, 10) : 50,
            viewerRole: req.userRole,
        });
        sendSuccess(res, { messages });
    } catch {
        sendError(res, 'Failed to get messages', 500);
    }
};

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;
        const { content } = req.body;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        const conversation = await messagesService.getConversationById(id);
        if (!conversation || !conversation.participants.includes(uid)) {
            sendError(res, 'Not authorized', 403);
            return;
        }
        const userDoc = await db.collection(USERS_COLLECTION).doc(uid).get();
        const senderName = userDoc.exists ? userDoc.data()?.fullName || 'Unknown' : 'Unknown';
        const message = await messagesService.sendMessage(id, uid, senderName, content);
        sendCreated(res, { message });
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Conversation is locked by admin moderation') {
            sendError(res, error.message, 423);
            return;
        }
        sendError(res, 'Failed to send message', 500);
    }
};

export const startConversation = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { recipientId } = req.body;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }
        if (uid === recipientId) {
            sendError(res, 'Cannot start conversation with yourself', 400);
            return;
        }
        const recipientDoc = await db.collection(USERS_COLLECTION).doc(recipientId).get();
        if (!recipientDoc.exists) {
            sendError(res, 'Recipient not found', 404);
            return;
        }
        const conversation = await messagesService.getOrCreateDirectConversation(uid, recipientId);
        sendSuccess(res, { conversation });
    } catch {
        sendError(res, 'Failed to start conversation', 500);
    }
};

export const markConversationRead = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const { id } = req.params;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }

        const conversation = await messagesService.getConversationById(id);
        if (!conversation || !conversation.participants.includes(uid)) {
            sendError(res, 'Not authorized', 403);
            return;
        }

        const updatedCount = await messagesService.markConversationAsRead(id, uid);
        sendSuccess(res, { updatedCount });
    } catch {
        sendError(res, 'Failed to mark conversation as read', 500);
    }
};
