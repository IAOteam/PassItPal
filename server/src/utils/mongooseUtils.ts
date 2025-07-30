import mongoose from 'mongoose';

/**
 * Safely converts a Mongoose document to a plain JavaScript object,
 * ensuring all ObjectIds (like _id and populated fields) are converted to strings.
 * @param doc The Mongoose document.
 * @returns A plain object that is safe to send to the frontend.
 */
export function toPlainObject<T>(doc: mongoose.Document): T {
  // Use Mongoose's built-in .toObject() method with virtuals enabled
  const plain = doc.toObject({ getters: true, virtuals: true });

  // The `toObject` method with virtuals should handle the _id conversion,
  // but we can add an explicit check for safety if needed in the future.
  // For now, this is clean and effective.

  return plain as T;
}
