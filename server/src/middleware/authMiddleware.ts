import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User from '../models/User.model';
// No need for `declare global` here anymore, it's in src/types/express.d.ts

// Middleware to protect routes and verify JWT
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = verifyToken(token);

      if (!decoded) {
        return res.status(401).json({ message: 'Not authorized, token failed' });
      }

      // Find user and attach to request
      const user = await User.findById(decoded.id).select('-password');
      if (!user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      req.user = user; // Now correctly typed due to src/types/express.d.ts

      // Check if user is blocked (new feature)
      if (req.user.isBlocked) {
        return res.status(403).json({ message: 'Your account has been blocked.' });
      }

      next();
    } catch (error) {
      console.error(error);
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

// Middleware to check user role
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route` });
    }
    next();
  };
};