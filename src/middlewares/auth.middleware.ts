import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import type { Role } from '../types';
import { verifyToken } from '../utils/jwt';

/**
 * Middleware de autenticación (RBAC — Semana 08).
 * Verifica el token JWT del header "Authorization: Bearer <token>"
 * y adjunta el payload en req.user. Responde 401 si falta o es inválido.
 */
export const authMiddleware = (req: Request, _res: Response, next: NextFunction) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next(new AppError('Token de autenticación requerido', 401));
  }

  const token = header.split(' ')[1];

  try {
    req.user = verifyToken(token);
  } catch {
    return next(new AppError('Token inválido o expirado', 401));
  }

  next();
};

/**
 * Middleware de autorización por roles (RBAC).
 * Uso: router.delete('/:id', authMiddleware, requireRole('admin'), handler)
 * Responde 403 si el usuario autenticado no tiene el rol requerido.
 */
export const requireRole = (...roles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Token de autenticación requerido', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('No tienes permisos para realizar esta acción', 403));
    }
    next();
  };
};
