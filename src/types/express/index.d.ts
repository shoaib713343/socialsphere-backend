import { IUser } from '../../features/auth.model';


declare global {
  namespace Express {
    export interface Request {
      user?: IUser;
    }
  }
}