import { Router } from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware';
import { validate } from '../middleware/validationMiddleware';
import { getAllCategories, createCategory } from '../controllers/categoryController';

const router = Router();

// @route   GET /api/categories
// @desc    Get all available categories
// @access  Public
router.get('/', getAllCategories);

// @route   POST /api/categories
// @desc    Create a new category
// @access  Private (any logged-in user can create a category)
router.post(
  '/',
  protect,
  [
    body('name').notEmpty().withMessage('Category name is required.').isString().trim(),
  ],
  validate,
  createCategory
);

export default router;
