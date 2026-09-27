/**
 * UNIT TESTS — service.service.ts (Semana 09)
 * El servicio del recurso principal (servicios de limpieza) se prueba
 * en aislamiento usando jest.mock sobre el repositorio: nunca toca la DB.
 */

jest.mock('../repositories/service.repository', () => ({
  serviceRepository: {
    findAll: jest.fn(),
    findById: jest.fn(),
    findByCode: jest.fn(),
    create: jest.fn(),
    updateById: jest.fn(),
    deleteById: jest.fn(),
  },
}));

import { ServiceDocument } from '../models/service.model';
import { serviceRepository } from '../repositories/service.repository';
import { serviceService } from '../services/service.service';
import type { JwtPayload } from '../types';
import type { CreateServiceInput } from '../validators/service.schema';

const repo = serviceRepository as jest.Mocked<typeof serviceRepository>;

// Actores RBAC
const owner: JwtPayload = { id: 'user-1', email: 'empleado@cleanpro.com', role: 'user' };
const otherUser: JwtPayload = { id: 'user-2', email: 'otro@cleanpro.com', role: 'user' };
const admin: JwtPayload = { id: 'admin-1', email: 'admin@cleanpro.com', role: 'admin' };

const buildService = (overrides: Record<string, unknown> = {}): ServiceDocument =>
  ({
    _id: 'service-id-1',
    code: 'CLN-001',
    name: 'Limpieza general de oficinas',
    category: 'general',
    description: 'Aseo completo de oficinas',
    price: 45000,
    durationMinutes: 120,
    suppliesIncluded: true,
    active: true,
    createdBy: 'user-1',
    ...overrides,
  }) as unknown as ServiceDocument;

const validInput: CreateServiceInput = {
  code: 'CLN-001',
  name: 'Limpieza general de oficinas',
  category: 'general',
  description: 'Aseo completo de oficinas',
  price: 45000,
  durationMinutes: 120,
  suppliesIncluded: true,
};

describe('serviceService', () => {
  describe('getServices()', () => {
    it('retorna todos los servicios del catálogo (happy path)', async () => {
      const services = [buildService(), buildService({ _id: 'service-id-2', code: 'CLN-002' })];
      repo.findAll.mockResolvedValue(services as never);

      const result = await serviceService.getServices();

      expect(repo.findAll).toHaveBeenCalledWith({});
      expect(result).toHaveLength(2);
      expect(result[0].code).toBe('CLN-001');
    });

    it('aplica los filtros de categoría y búsqueda al repositorio', async () => {
      repo.findAll.mockResolvedValue([buildService({ category: 'profunda' })] as never);

      const filters = { category: 'profunda', search: 'limpieza' };
      const result = await serviceService.getServices(filters);

      expect(repo.findAll).toHaveBeenCalledWith(filters);
      expect(result).toHaveLength(1);
      expect(result[0].category).toBe('profunda');
    });
  });

  describe('getServiceById()', () => {
    it('retorna el servicio cuando el ID existe', async () => {
      repo.findById.mockResolvedValue(buildService() as never);

      const result = await serviceService.getServiceById('service-id-1');

      expect(repo.findById).toHaveBeenCalledWith('service-id-1');
      expect(result.code).toBe('CLN-001');
      expect(result.price).toBe(45000);
    });

    it('lanza AppError 404 si el servicio no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(serviceService.getServiceById('id-inexistente')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Servicio de limpieza no encontrado',
      });
    });
  });

  describe('createService()', () => {
    it('crea el servicio con datos válidos y lo asocia al creador', async () => {
      repo.findByCode.mockResolvedValue(null);
      repo.create.mockResolvedValue(buildService() as never);

      const result = await serviceService.createService(validInput, owner);

      expect(repo.findByCode).toHaveBeenCalledWith('CLN-001');
      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CLN-001', createdBy: 'user-1', price: 45000 })
      );
      expect(result.code).toBe('CLN-001');
    });

    it('normaliza el código a mayúsculas al crear', async () => {
      repo.findByCode.mockResolvedValue(null);
      repo.create.mockResolvedValue(buildService() as never);

      await serviceService.createService({ ...validInput, code: 'cln-009' }, owner);

      expect(repo.create).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'CLN-009', createdBy: 'user-1' })
      );
    });

    it('lanza AppError 409 si el código ya está registrado (duplicado)', async () => {
      repo.findByCode.mockResolvedValue(buildService() as never);

      await expect(serviceService.createService(validInput, owner)).rejects.toMatchObject({
        statusCode: 409,
      });
      expect(repo.create).not.toHaveBeenCalled();
    });
  });

  describe('updateService()', () => {
    it('actualiza el servicio cuando el dueño lo edita', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.updateById.mockResolvedValue(buildService({ price: 60000 }) as never);

      const result = await serviceService.updateService('service-id-1', { price: 60000 }, owner);

      expect(repo.updateById).toHaveBeenCalledWith('service-id-1', { price: 60000 });
      expect(result.price).toBe(60000);
    });

    it('permite a un admin actualizar el servicio de otro usuario', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.updateById.mockResolvedValue(buildService({ active: false }) as never);

      const result = await serviceService.updateService('service-id-1', { active: false }, admin);

      expect(result.active).toBe(false);
    });

    it('lanza AppError 403 si no es el dueño ni admin', async () => {
      repo.findById.mockResolvedValue(buildService() as never);

      await expect(
        serviceService.updateService('service-id-1', { price: 99999 }, otherUser)
      ).rejects.toMatchObject({ statusCode: 403 });

      expect(repo.updateById).not.toHaveBeenCalled();
    });

    it('lanza AppError 404 si el servicio no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(
        serviceService.updateService('id-inexistente', { price: 100 }, owner)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it('lanza AppError 409 si el nuevo código choca con otro servicio', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.findByCode.mockResolvedValue(buildService({ _id: 'otro-servicio', code: 'CLN-002' }) as never);

      await expect(
        serviceService.updateService('service-id-1', { code: 'CLN-002' }, owner)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it('normaliza a mayúsculas el nuevo código cuando es válido', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.findByCode.mockResolvedValue(null);
      repo.updateById.mockResolvedValue(buildService({ code: 'CLN-007' }) as never);

      const result = await serviceService.updateService('service-id-1', { code: 'cln-007' }, owner);

      expect(repo.updateById).toHaveBeenCalledWith(
        'service-id-1',
        expect.objectContaining({ code: 'CLN-007' })
      );
      expect(result.code).toBe('CLN-007');
    });

    it('lanza AppError 404 si la actualización no encuentra el documento', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.updateById.mockResolvedValue(null);

      await expect(
        serviceService.updateService('service-id-1', { price: 55000 }, owner)
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe('deleteService()', () => {
    it('elimina el servicio cuando existe', async () => {
      repo.findById.mockResolvedValue(buildService() as never);
      repo.deleteById.mockResolvedValue(buildService() as never);

      await expect(serviceService.deleteService('service-id-1')).resolves.toBeUndefined();
      expect(repo.deleteById).toHaveBeenCalledWith('service-id-1');
    });

    it('lanza AppError 404 si el servicio no existe', async () => {
      repo.findById.mockResolvedValue(null);

      await expect(serviceService.deleteService('id-inexistente')).rejects.toMatchObject({
        statusCode: 404,
      });
      expect(repo.deleteById).not.toHaveBeenCalled();
    });
  });
});
