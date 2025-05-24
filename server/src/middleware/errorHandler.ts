import { Request, Response, NextFunction } from 'express';

// Define a custom error interface if you have specific error types
interface CustomError extends Error {
  statusCode?: number;
  data?: any;
}

const errorHandler = (err: CustomError, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Something went wrong.';

  console.error(err); // Log the error for debugging

  res.status(statusCode).json({
    message: message,
    // Include stack trace in development only
    stack: process.env.NODE_ENV === 'development' ? err.stack : {}
  });
};

export default errorHandler;