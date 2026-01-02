import { Request, Response } from 'express';
import * as reviewsService from './reviews.service.js';
import { sendSuccess, sendError, sendCreated } from '../../utils/response.js';

export const createReview = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }

        const { missionId, revieweeId, rating, comment } = req.body;

        const review = await reviewsService.createReview(uid, {
            missionId,
            revieweeId,
            rating,
            comment,
        });

        sendCreated(res, { review });
    } catch (error: any) {
        console.error('Create review error:', error);
        if (error.message?.includes('already reviewed')) {
            sendError(res, error.message, 400);
        } else {
            sendError(res, 'Failed to create review', 500);
        }
    }
};

export const getUserReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;

        const reviews = await reviewsService.getUserReviews(userId, 'reviewee');
        const stats = await reviewsService.getReviewStats(userId);

        sendSuccess(res, { reviews, stats });
    } catch (error) {
        console.error('Get user reviews error:', error);
        sendError(res, 'Failed to get reviews', 500);
    }
};

export const getMyReviewStats = async (req: Request, res: Response): Promise<void> => {
    try {
        const uid = req.user?.uid;
        if (!uid) {
            sendError(res, 'User ID not found', 401);
            return;
        }

        const stats = await reviewsService.getReviewStats(uid);
        sendSuccess(res, stats);
    } catch (error) {
        console.error('Get review stats error:', error);
        sendError(res, 'Failed to get review stats', 500);
    }
};

export const getMissionReviews = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        const reviews = await reviewsService.getMissionReviews(missionId);
        sendSuccess(res, { reviews });
    } catch (error) {
        console.error('Get mission reviews error:', error);
        sendError(res, 'Failed to get mission reviews', 500);
    }
};
