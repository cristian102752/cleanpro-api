import { z } from 'zod';
import { SERVICE_CATEGORIES } from '../models/service.model';

/** Validación Zod para CREAR un servicio de limpieza */
export const createServiceSchema = z.object({
  code: z
    .string({ required_error: 'El código es obligatorio' })
    .min(3, 'El código debe tener al menos 3 caracteres')
    .max(20, 'El código es demasiado largo')
    .regex(/^[A-Za-z0-9-]+$/, 'El código solo admite letras, números y guiones'),
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre es demasiado largo'),
  category: z.enum(SERVICE_CATEGORIES).default('general'),
  description: z.string().max(500, 'La descripción es demasiado larga').default(''),
  price: z
    .number({ required_error: 'El precio es obligatorio', invalid_type_error: 'El precio debe ser un número' })
    .positive('El precio debe ser mayor a 0')
    .max(10_000_000, 'El precio supera el máximo permitido'),
  durationMinutes: z
    .number({ required_error: 'La duración es obligatoria', invalid_type_error: 'La duración debe ser un número' })
    .int('La duración debe ser un entero')
    .min(15, 'La duración mínima es de 15 minutos')
    .max(1440, 'La duración máxima es de 1440 minutos'),
  suppliesIncluded: z.boolean().default(false),
  active: z.boolean().optional(),
});

/** Validación Zod para ACTUALIZAR un servicio (todos los campos opcionales) */
export const updateServiceSchema = createServiceSchema.partial();

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
