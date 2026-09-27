import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { userController } from '../controllers/user.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

export const userRoutes = Router();

// Perfil del usuario autenticado
userRoutes.get('/me', authMiddleware, authController.me);

// Listado de usuarios — SOLO administradores (RBAC)
userRoutes.get('/', authMiddleware, requireRole('admin'), userController.listUsers);
