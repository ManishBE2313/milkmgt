import jwt from 'jsonwebtoken';

export interface AuthTokenPayload {
  userId: number;
  username: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('Missing JWT_SECRET environment variable');
  }
  return secret;
};

export const signAuthToken = (payload: AuthTokenPayload): string => {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '7d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn,
  });
};

export const verifyAuthToken = (token: string): AuthTokenPayload => {
  return jwt.verify(token, getJwtSecret()) as AuthTokenPayload;
};
