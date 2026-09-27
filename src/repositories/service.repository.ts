import { ServiceDocument, ServiceModel } from '../models/service.model';
import type { CreateServiceInput, UpdateServiceInput } from '../validators/service.schema';

/** Filtros disponibles para listar servicios de limpieza */
export interface ServiceFilters {
  category?: string;
  active?: boolean;
  search?: string;
}

export type NewServiceData = CreateServiceInput & { createdBy: string };

/** Capa de acceso a datos del recurso principal: servicios de limpieza */
export const serviceRepository = {
  /** Lista servicios aplicando filtros opcionales (categoría, estado, búsqueda) */
  findAll: (filters: ServiceFilters = {}): Promise<ServiceDocument[]> => {
    const query: Record<string, unknown> = {};
    if (filters.category) query.category = filters.category;
    if (typeof filters.active === 'boolean') query.active = filters.active;
    if (filters.search) query.name = { $regex: filters.search, $options: 'i' };
    return ServiceModel.find(query).sort({ createdAt: -1 });
  },

  findById: (id: string): Promise<ServiceDocument | null> => ServiceModel.findById(id),

  findByCode: (code: string): Promise<ServiceDocument | null> =>
    ServiceModel.findOne({ code: code.toUpperCase() }),

  create: (data: NewServiceData): Promise<ServiceDocument> => ServiceModel.create(data),

  updateById: (
    id: string,
    data: Partial<UpdateServiceInput> & { code?: string }
  ): Promise<ServiceDocument | null> =>
    ServiceModel.findByIdAndUpdate(id, data, { new: true, runValidators: true }),

  deleteById: (id: string): Promise<ServiceDocument | null> => ServiceModel.findByIdAndDelete(id),
};
