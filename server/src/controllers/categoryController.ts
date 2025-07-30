import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';

/**
 * Fetches all categories from the database via the service.
 */
export const getAllCategories = async (req: Request, res: Response) => {
    try {
        const categories = await CategoryService.getAllCategories();
        res.status(200).json(categories);
    } catch (error: any) {
        res.status(500).json({ message: 'Server error while fetching categories.' });
    }
};

/**
 * Creates a new category via the service.
 */
export const createCategory = async (req: Request, res: Response) => {
    try {
        const { name } = req.body;
        const userId = req.user?._id;

        if (!name) {
            return res.status(400).json({ message: 'Category name is required.' });
        }
        if (!userId) {
            return res.status(401).json({ message: 'User not authenticated.' });
        }

        const newCategory = await CategoryService.createCategory(name, userId.toString());
        
        // If the category already existed, the service returns it. 
        // We can send a 200 OK in that case, otherwise 201 Created.
        const statusCode = newCategory.createdAt?.toString() === newCategory.updatedAt?.toString() ? 201 : 200;
        
        res.status(statusCode).json(newCategory);

    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Server error while creating category.' });
    }
};
