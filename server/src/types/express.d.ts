import { IUser } from '../models/User.model'; // Adjust path if necessary

declare global {
  namespace Express {
    interface Request {
      user?: IUser; // Declares that 'user' property might exist on Request, and it's of type IUser
    }
  }
}