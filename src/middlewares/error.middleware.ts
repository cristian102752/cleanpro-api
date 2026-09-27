import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { AppError } from '../errors/AppError';

/** Manejador de rutas inexistentes (404) */
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `La ruta ${req.method} ${req.originalUrl} no existe en esta API`,
  });
};

/**
 * Manejador central de errores.
 * - AppError        → responde con su statusCode y mensaje controlado
 * - CastError       → ObjectId inválido en rutas :id (400)
 * - E11000          → índice duplicado en MongoDB (409)
 * - JSON malformado → 400
 * - En producción NUNCA se expone el stack trace
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
) => {
  // Error generado por el whitelist de CORS
  if (err.message.includes('no permitido por CORS')) {
    return res.status(403).json({ success: false, message: err.message });
  }

  // Body JSON malformado (express.json)
  const parseErr = err as Error & { type?: string };
  if (parseErr.type === 'entity.parse.failed') {
    return res.status(400).json({ success: false, message: 'El cuerpo JSON es inválido' });
  }

  // ObjectId inválido en la URL (Mongoose CastError)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: 'El identificador proporcionado es inválido' });
  }

  // Índice duplicado de MongoDB (unique)
  const mongoErr = err as Error & { code?: number; keyValue?: Record<string, unknown> };
  if (mongoErr.code === 11000) {
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'campo';
    return res.status(409).json({
      success: false,
      message: `El valor del campo "${field}" ya está registrado`,
    });
  }

  // Errores operacionales controlados (AppError)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ success: false, message: err.message });
  }

  // Error inesperado: se registra en consola pero no se filtra al cliente
  console.error('💥 Error no controlado:', err);
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    // Stack trace visible SOLO fuera de producción (desarrollo/test)
    ...(!env.isProduction ? { stack: err.stack } : {}),
  });
};
