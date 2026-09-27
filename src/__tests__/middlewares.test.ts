/**
 * UNIT TESTS — middlewares (Semana 09)
 * Manejador de errores, sanitización NoSQL, RBAC (requireRole) y 404.
 */
import { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/AppError';
import { requireRole } from '../middlewares/auth.middleware';
import { errorHandler, notFoundHandler } from '../middlewares/error.middleware';
import { sanitizeInput } from '../middlewares/sanitize.middleware';

// Helpers para simular req/res/next
const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const buildReq = (overrides: Partial<Request> = {}): Request =>
  ({
    method: 'GET',
    originalUrl: '/api/v1/services',
    headers: {},
    body: {},
    query: {},
    ...overrides,
  }) as unknown as Request;

describe('errorHandler', () => {
  it('responde 403 cuando el origen es rechazado por CORS', () => {
    const res = mockResponse();
    const next = jest.fn() as NextFunction;
    const err = new Error('Origen http://evil.com no permitido por CORS');

    errorHandler(err, buildReq(), res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false }));
  });

  it('responde 400 cuando el body JSON está malformado', () => {
    const res = mockResponse();
    const err = Object.assign(new SyntaxError('Unexpected token'), { type: 'entity.parse.failed' });

    errorHandler(err, buildReq(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'El cuerpo JSON es inválido' })
    );
  });

  it('responde 400 ante un CastError de Mongoose (id inválido)', () => {
    const res = mockResponse();
    const err = Object.assign(new Error('Cast to ObjectId failed'), { name: 'CastError' });

    errorHandler(err, buildReq(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'El identificador proporcionado es inválido' })
    );
  });

  it('responde 409 ante un índice duplicado E11000 de MongoDB', () => {
    const res = mockResponse();
    const err = Object.assign(new Error('E11000 duplicate key'), {
      code: 11000,
      keyValue: { code: 'CLN-001' },
    });

    errorHandler(err, buildReq(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('"code"') })
    );
  });

  it('responde con el statusCode de un AppError', () => {
    const res = mockResponse();

    errorHandler(new AppError('Servicio de limpieza no encontrado', 404), buildReq(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Servicio de limpieza no encontrado' })
    );
  });

  it('AppError usa 500 por defecto si no se indica statusCode', () => {
    const err = new AppError('Algo salió mal');
    expect(err.statusCode).toBe(500);
    expect(err.isOperational).toBe(true);
  });

  it('responde 500 sin filtrar detalles ante un error inesperado', () => {
    const res = mockResponse();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

    errorHandler(new Error('Explosión interna'), buildReq(), res, jest.fn() as NextFunction);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'Error interno del servidor' })
    );
    consoleSpy.mockRestore();
  });
});

describe('notFoundHandler', () => {
  it('responde 404 con la ruta solicitada', () => {
    const res = mockResponse();

    notFoundHandler(buildReq({ method: 'GET', originalUrl: '/api/v1/ruta-fantasma' }), res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('/api/v1/ruta-fantasma') })
    );
  });
});

describe('sanitizeInput', () => {
  const runSanitize = (body: unknown, query: unknown = {}) => {
    const req = buildReq({ body, query } as Partial<Request>);
    const next = jest.fn() as NextFunction;
    sanitizeInput(req, mockResponse(), next);
    return { req, next };
  };

  it('elimina llaves con "$" del body (bloquea operadores Mongo)', () => {
    const { req, next } = runSanitize({ password: { $gt: '' }, email: 'ana@cleanpro.com' });

    expect(req.body).toEqual({ password: {}, email: 'ana@cleanpro.com' });
    expect(next).toHaveBeenCalled();
  });

  it('elimina llaves con "." y sanitiza arrays recursivamente', () => {
    const { req } = runSanitize({
      items: [{ $where: 'ataque', name: 'ok' }, 'texto plano'],
      'campo.anidado': 'malicioso',
    });

    expect(req.body).toEqual({ items: [{ name: 'ok' }, 'texto plano'] });
  });

  it('sanitiza el query string también', () => {
    const { req } = runSanitize({}, { category: 'general', $where: '1==1' });

    expect(req.query).toEqual({ category: 'general' });
  });
});

describe('requireRole', () => {
  const runRole = (user: Request['user']) => {
    const req = buildReq();
    req.user = user;
    const res = mockResponse();
    const next = jest.fn() as NextFunction;
    requireRole('admin')(req, res, next);
    return { res, next };
  };

  it('pasa un AppError 401 a next si no hay usuario autenticado', () => {
    const { next } = runRole(undefined);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('pasa un AppError 403 a next si el rol no coincide', () => {
    const { next } = runRole({ id: '1', email: 'u@x.co', role: 'user' });

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 403 }));
  });

  it('deja pasar sin errores si el usuario tiene el rol requerido', () => {
    const { next } = runRole({ id: '1', email: 'a@x.co', role: 'admin' });

    expect(next).toHaveBeenCalledWith();
  });
});
