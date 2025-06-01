// server/src/utils/jwt.ts
import jwt, { SignOptions } from 'jsonwebtoken';

import dotenv from 'dotenv';
import { Types } from 'mongoose';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET! as string
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "1h"; // e.g., 15m for 15 minutes

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET! as string
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN ?? '7d';

if (!JWT_SECRET) {
  console.error("JWT_SECRET is not set in .env. JWT functionality will not work.");
  process.exit(1); // Exit if secret is critical for application to run
}
if (!JWT_SECRET || typeof JWT_SECRET !== 'string') {
  throw new Error('JWT_SECRET must be a non-empty string');
}
interface TokenPayload {
  id: string; // Should be string representation of ObjectId
  role: string;
  // You can add other non-sensitive info to the payload if needed
}
export const generateToken = (userId: Types.ObjectId | string, role: string): string => {
  const payload: TokenPayload = {
    id: userId.toString(), // Ensure ID is a string
    role: role,
  };
 const signOptions: SignOptions = { expiresIn: JWT_EXPIRES_IN as SignOptions['expiresIn'] };

  return jwt.sign(payload, JWT_SECRET, signOptions);
};

export const generateRefreshToken = (userId: Types.ObjectId | string): string => {
  // Refresh token payload might be simpler, often just the user ID
  // Or can include a version number if you want to invalidate all old refresh tokens
  const payload = {
    id: userId.toString(), // Ensure ID is a string
    // Adding a 'type' can be useful for distinguishing token types if ever needed,
    // or if the same secret were used (which is not the case here)
    type: 'refresh'
  };
  const signOptions: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'] };

  return jwt.sign(payload, JWT_REFRESH_SECRET,signOptions);
};

export const verifyToken = (token: string): TokenPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch (error) {
    console.error('Error verifying access token:', error);
    return null;
  }
};

export const verifyRefreshToken = (token: string): { id: string; type?: string } | null => {
  try {
    // Make sure to type the decoded payload appropriately if it differs from access token
    return jwt.verify(token, JWT_REFRESH_SECRET) as { id: string; type?: string };
  } catch (error) {
    console.error('Error verifying refresh token:', error);
    return null;
  }
};