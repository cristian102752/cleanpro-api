import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';

/** Controlador de usuarios (rutas protegidas por rol) */
export const userController = {
  /** GET /api/v1/users — lista todos los usuarios (solo admin) */
  async listUsers(_req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      res.status(200).json({ success: true, count: users.length, data: users });
    } catch (err) {
      next(err);
    }
  },
};
