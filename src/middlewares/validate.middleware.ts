import { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';
import { AppError } from '../errors/AppError';

/**
 * Middleware de validación con Zod.
 * Si el body no cumple el esquema responde 422 con el detalle de errores;
 * si es válido, reemplaza req.body por los datos parseados y saneados.
 */
export const validate =
  (schema: ZodSchema) => (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const details = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join(' | ');
      return next(new AppError(`Datos inválidos — ${details}`, 422));
    }

    req.body = result.data;
    next();
  };
