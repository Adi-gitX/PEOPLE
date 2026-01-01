import { Router } from 'express';
import { contributorsController } from '../contributors/index.js';

const router = Router();

/**
 * @route   GET /api/v1/skills
 * @desc    Get all available skills
 * @access  Public
 */
router.get('/', contributorsController.getAllSkills);

export default router;
