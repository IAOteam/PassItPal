// server/src/models/Category.ts
import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ICategory extends Document {
  _id: Types.ObjectId;
  name: string;
  createdBy: Types.ObjectId; // To track who created custom categories
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true, // Each category name must be unique
    trim: true,
    lowercase: true, // Store all categories in lowercase for consistency
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Index to quickly find categories by name
CategorySchema.index({ name: 1 });

const Category = mongoose.model<ICategory>('Category', CategorySchema);

export default Category;
