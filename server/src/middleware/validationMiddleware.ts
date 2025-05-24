import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator'; // Correct import

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  const extractedErrors: Record<string, string>[] = [];
  // Explicitly type `err` as `any` or `ValidationError` if you import it
  errors.array().map((err: any) => extractedErrors.push({ [err.param]: err.msg }));

  return res.status(400).json({
    errors: extractedErrors,
    message: 'Validation failed. Please check your input.'
  });
};