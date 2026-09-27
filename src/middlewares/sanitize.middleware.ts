import { NextFunction, Request, Response } from 'express';

/**
 * Sanitización de entradas contra NoSQL Injection (Semana 08).
 *
 * Elimina recursivamente cualquier llave que empiece con "$" (operadores
 * de consulta de Mongo: $gt, $ne, $where...) o que contenga "." (acceso a
 * campos anidados) en el body y el query string. Así un atacante no puede
 * inyectar operadores como { "password": { "$gt": "" } }.
 */
const sanitizeValue = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value !== null && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key.startsWith('$') || key.includes('.')) continue; // llave peligrosa
      clean[key] = sanitizeValue(val);
    }
    return clean;
  }

  return value;
};

export const sanitizeInput = (req: Request, _res: Response, next: NextFunction) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeValue(req.body);
  }

  if (req.query && typeof req.query === 'object') {
    const cleanQuery = sanitizeValue(req.query) as Record<string, unknown>;
    for (const key of Object.keys(req.query)) {
      delete req.query[key];
    }
    Object.assign(req.query, cleanQuery);
  }

  next();
};
