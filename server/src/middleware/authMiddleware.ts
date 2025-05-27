import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import User,{ IUser }  from '../models/User';



declare module 'express-serve-static-core' {
  interface Request {
    user?: IUser;
  }
}
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
      req.user = user; // This line should now be correctly typed

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
    // req.user should now be correctly typed
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: `User role ${req.user?.role || 'unknown'} is not authorized to access this route` });
    }
    next();
  };
};