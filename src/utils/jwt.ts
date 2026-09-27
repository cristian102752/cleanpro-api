import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { JwtPayload } from '../types';

/** Genera un token JWT firmado con el secreto del entorno */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  } as jwt.SignOptions);
};

/** Verifica un token JWT y retorna su payload. Lanza error si es inválido */
export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
};
