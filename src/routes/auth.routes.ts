import { Router } from 'express';
import { authLimiter } from '../config/security';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { loginSchema, registerSchema } from '../validators/auth.schema';

export const authRoutes = Router();

// Rutas públicas con rate limit estricto (anti fuerza bruta → 429)
authRoutes.post('/register', authLimiter, validate(registerSchema), authController.register);
authRoutes.post('/login', authLimiter, validate(loginSchema), authController.login);
