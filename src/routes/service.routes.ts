import { Router } from 'express';
import { serviceController } from '../controllers/service.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validate.middleware';
import { createServiceSchema, updateServiceSchema } from '../validators/service.schema';

export const serviceRoutes = Router();

// ── Rutas públicas ────────────────────────────────────────────────
serviceRoutes.get('/', serviceController.getServices);        // catálogo
serviceRoutes.get('/:id', serviceController.getServiceById);  // detalle

// ── Rutas de usuario autenticado ──────────────────────────────────
serviceRoutes.post(
  '/',
  authMiddleware,
  validate(createServiceSchema),
  serviceController.createService
);

// Actualiza el dueño del servicio o un admin (RBAC de recurso)
serviceRoutes.put(
  '/:id',
  authMiddleware,
  validate(updateServiceSchema),
  serviceController.updateService
);
serviceRoutes.patch(
  '/:id',
  authMiddleware,
  validate(updateServiceSchema),
  serviceController.updateService
);

// ── Rutas SOLO de administrador ───────────────────────────────────
serviceRoutes.delete(
  '/:id',
  authMiddleware,
  requireRole('admin'),
  serviceController.deleteService
);
