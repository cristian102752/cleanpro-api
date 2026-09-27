/**
 * Tipos globales de CleanPro API.
 * Se extiende la interfaz Request de Express para adjuntar
 * el payload JWT del usuario autenticado (req.user).
 */

export type Role = 'user' | 'admin';

export interface JwtPayload {
  id: string;
  email: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      /** Payload del token JWT verificado (lo agrega authMiddleware) */
      user?: JwtPayload;
    }
  }
}
