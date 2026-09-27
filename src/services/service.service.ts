import { AppError } from '../errors/AppError';
import { ServiceDocument } from '../models/service.model';
import { serviceRepository, ServiceFilters } from '../repositories/service.repository';
import type { JwtPayload } from '../types';
import type { CreateServiceInput, UpdateServiceInput } from '../validators/service.schema';

/**
 * Lógica de negocio del recurso principal de CleanPro:
 * los servicios de limpieza. Aplica RBAC a nivel de recurso:
 * solo el dueño o un admin pueden actualizar un servicio.
 */
export const serviceService = {
  /** Lista todos los servicios del catálogo (público), con filtros opcionales */
  async getServices(filters: ServiceFilters = {}) {
    return serviceRepository.findAll(filters);
  },

  /** Retorna un servicio por su id. 404 si no existe. */
  async getServiceById(id: string) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError('Servicio de limpieza no encontrado', 404);
    }
    return service;
  },

  /** Crea un servicio de limpieza. 409 si el código ya existe. */
  async createService(input: CreateServiceInput, actor: JwtPayload) {
    const existing = await serviceRepository.findByCode(input.code);
    if (existing) {
      throw new AppError(`Ya existe un servicio con el código ${input.code.toUpperCase()}`, 409);
    }

    return serviceRepository.create({
      ...input,
      code: input.code.toUpperCase(),
      createdBy: actor.id,
    });
  },

  /**
   * Actualiza un servicio. RBAC de recurso:
   * - 404 si no existe
   * - 403 si no es el dueño ni admin
   * - 409 si el nuevo código choca con otro servicio
   */
  async updateService(id: string, input: UpdateServiceInput, actor: JwtPayload) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError('Servicio de limpieza no encontrado', 404);
    }

    const isOwner = String(service.createdBy) === actor.id;
    if (!isOwner && actor.role !== 'admin') {
      throw new AppError('Solo el creador del servicio o un administrador puede actualizarlo', 403);
    }

    if (input.code && input.code.toUpperCase() !== service.code) {
      const duplicated = await serviceRepository.findByCode(input.code);
      if (duplicated) {
        throw new AppError(`Ya existe un servicio con el código ${input.code.toUpperCase()}`, 409);
      }
    }

    const updates: Partial<UpdateServiceInput> & { code?: string } = { ...input };
    if (input.code) updates.code = input.code.toUpperCase();

    const updated = await serviceRepository.updateById(id, updates);
    if (!updated) {
      throw new AppError('Servicio de limpieza no encontrado', 404);
    }
    return updated;
  },

  /** Elimina un servicio. 404 si no existe (la ruta ya exige rol admin). */
  async deleteService(id: string) {
    const service = await serviceRepository.findById(id);
    if (!service) {
      throw new AppError('Servicio de limpieza no encontrado', 404);
    }

    await serviceRepository.deleteById(id);
  },
};
