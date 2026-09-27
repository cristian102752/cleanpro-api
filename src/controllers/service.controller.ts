import { NextFunction, Request, Response } from 'express';
import { ServiceFilters } from '../repositories/service.repository';
import { serviceService } from '../services/service.service';

/** Controlador del recurso principal: servicios de limpieza */
export const serviceController = {
  /** GET /api/v1/services — catálogo público con filtros opcionales */
  async getServices(req: Request, res: Response, next: NextFunction) {
    try {
      const { category, search, active } = req.query;
      const filters: ServiceFilters = {
        category: typeof category === 'string' && category !== '' ? category : undefined,
        search: typeof search === 'string' && search !== '' ? search : undefined,
        active: typeof active === 'string' && active !== '' ? active === 'true' : undefined,
      };
      const services = await serviceService.getServices(filters);
      res.status(200).json({ success: true, count: services.length, data: services });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/v1/services/:id — detalle público de un servicio */
  async getServiceById(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceService.getServiceById(req.params.id);
      res.status(200).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/v1/services — crear (requiere autenticación) */
  async createService(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceService.createService(req.body, req.user!);
      res.status(201).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  },

  /** PUT/PATCH /api/v1/services/:id — actualizar (dueño o admin) */
  async updateService(req: Request, res: Response, next: NextFunction) {
    try {
      const service = await serviceService.updateService(req.params.id, req.body, req.user!);
      res.status(200).json({ success: true, data: service });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/v1/services/:id — eliminar (solo admin) */
  async deleteService(req: Request, res: Response, next: NextFunction) {
    try {
      await serviceService.deleteService(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
