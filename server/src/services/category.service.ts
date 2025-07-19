import Category, { ICategory } from '../models/Category';
import { toPlainObject } from '../utils/mongooseUtils';

class HttpError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number) {
        super(message);
        this.statusCode = statusCode;
    }
}

export class CategoryService {
    /**
     * Fetches all categories, sorted by name.
     */
    public static async getAllCategories(): Promise<Partial<ICategory>[]> {
        const categories = await Category.find().sort({ name: 'asc' });
        return categories.map(cat => toPlainObject<ICategory>(cat));
    }

    /**
     * Creates a new category if it doesn't already exist.
     * @param name The name of the category to create.
     * @param userId The ID of the user creating the category.
     */
    public static async createCategory(name: string, userId: string): Promise<Partial<ICategory>> {
        const categoryName = name.trim().toLowerCase();

        const existingCategory = await Category.findOne({ name: categoryName });
        if (existingCategory) {
            // It's better to return the existing category than to throw an error,
            // as the user's intent (to have this category available) is met.
            return toPlainObject<ICategory>(existingCategory);
        }

        const newCategory = new Category({
            name: categoryName,
            createdBy: userId,
        });

        await newCategory.save();
        return toPlainObject<ICategory>(newCategory);
    }
}
