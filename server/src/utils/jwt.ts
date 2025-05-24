import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret) {
  console.error("JWT_SECRET is not set in .env. JWT functionality will not work.");
  process.exit(1); // Exit if secret is critical for application to run
}

export const generateToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, jwtSecret!, { expiresIn: '1h' }); // Token expires in 1 hour
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, jwtSecret!);
  } catch (error) {
    return null; // Token is invalid or expired
  }
};