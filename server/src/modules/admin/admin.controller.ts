import { Request, Response } from 'express';
import * as adminService from './admin.service.js';
import { sendSuccess, sendError } from '../../utils/response.js';

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
    try {
        const stats = await adminService.getPlatformStats();
        sendSuccess(res, stats);
    } catch (error) {
        console.error('Get platform stats error:', error);
        sendError(res, 'Failed to get platform stats', 500);
    }
};

export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit, offset, role, status } = req.query;

        const result = await adminService.getAllUsers({
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
            role: role as 'contributor' | 'initiator' | 'admin' | undefined,
            status: status as any,
        });

        sendSuccess(res, result);
    } catch (error) {
        console.error('Get all users error:', error);
        sendError(res, 'Failed to get users', 500);
    }
};

export const updateUserStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const { status } = req.body;

        await adminService.updateUserStatus(userId, status);
        sendSuccess(res, { message: 'User status updated' });
    } catch (error) {
        console.error('Update user status error:', error);
        sendError(res, 'Failed to update user status', 500);
    }
};

export const verifyUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        await adminService.verifyUser(userId);
        sendSuccess(res, { message: 'User verified successfully' });
    } catch (error: any) {
        console.error('Verify user error:', error);
        sendError(res, error.message || 'Failed to verify user', 500);
    }
};

export const getAllMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { limit, offset, status } = req.query;

        const result = await adminService.getAllMissions({
            limit: limit ? parseInt(limit as string) : undefined,
            offset: offset ? parseInt(offset as string) : undefined,
            status: status as any,
        });

        sendSuccess(res, result);
    } catch (error) {
        console.error('Get all missions error:', error);
        sendError(res, 'Failed to get missions', 500);
    }
};

export const cancelMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        await adminService.cancelMission(missionId);
        sendSuccess(res, { message: 'Mission cancelled' });
    } catch (error) {
        console.error('Cancel mission error:', error);
        sendError(res, 'Failed to cancel mission', 500);
    }
};

export const getDisputes = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, limit } = req.query;

        const disputes = await adminService.getDisputes({
            status: status as any,
            limit: limit ? parseInt(limit as string) : undefined,
        });

        sendSuccess(res, { disputes });
    } catch (error) {
        console.error('Get disputes error:', error);
        sendError(res, 'Failed to get disputes', 500);
    }
};

export const resolveDispute = async (req: Request, res: Response): Promise<void> => {
    try {
        const { disputeId } = req.params;
        const { resolution, favoredParty } = req.body;

        await adminService.resolveDispute(disputeId, resolution, favoredParty);
        sendSuccess(res, { message: 'Dispute resolved' });
    } catch (error) {
        console.error('Resolve dispute error:', error);
        sendError(res, 'Failed to resolve dispute', 500);
    }
};
