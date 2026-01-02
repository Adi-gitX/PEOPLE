import { Router } from 'express';
import * as reviewsController from './reviews.controller.js';
import { requireAuth } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { z } from 'zod';

const router = Router();

const createReviewSchema = z.object({
    missionId: z.string().min(1),
    revieweeId: z.string().min(1),
    rating: z.number().min(0).max(5),
    comment: z.string().max(2000).optional(),
});

router.post(
    '/',
    requireAuth,
    validate(createReviewSchema),
    reviewsController.createReview
);

router.get('/me/stats', requireAuth, reviewsController.getMyReviewStats);

router.get('/user/:userId', reviewsController.getUserReviews);

router.get('/mission/:missionId', reviewsController.getMissionReviews);

export default router;
