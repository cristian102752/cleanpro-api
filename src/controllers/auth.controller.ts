import { NextFunction, Request, Response } from 'express';
import { authService } from '../services/auth.service';

/** Controlador de autenticación: registro, login y perfil */
export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.register(req.body);
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await authService.login(req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  },

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await authService.getProfile(req.user!.id);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  },
};
