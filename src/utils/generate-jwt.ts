import jwt from 'jsonwebtoken';
import { JWTPayload } from '../interfaces/jwt';

export function generateJWT(data: JWTPayload, token: string) {
  return jwt.sign(data, token, { expiresIn: '1d', algorithm: 'HS256' });
}
