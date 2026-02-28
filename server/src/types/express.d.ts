import { AuthTokenPayload } from '../utils/auth';

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthTokenPayload;
    }
  }
}

export {};
