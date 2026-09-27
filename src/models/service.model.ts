import { Document, model, Schema, Types } from 'mongoose';

/**
 * Categorías de los servicios de limpieza ofrecidos por CleanPro.
 */
export const SERVICE_CATEGORIES = [
  'general',      // Limpieza general (oficinas, hogares)
  'profunda',     // Limpieza profunda
  'desinfeccion', // Desinfección y sanitización
  'vidrios',      // Lavado de vidrios
  'tapiceria',    // Limpieza de tapicería y muebles
  'post_obra',    // Limpieza post-obra / post-construcción
] as const;

export type ServiceCategory = (typeof SERVICE_CATEGORIES)[number];

export interface ServiceDocument extends Document {
  /** Código único del servicio, ej: CLN-001 (campo único del dominio) */
  code: string;
  name: string;
  category: ServiceCategory;
  description: string;
  /** Precio del servicio en pesos colombianos (COP) */
  price: number;
  durationMinutes: number;
  /** Indica si CleanPro lleva los insumos y equipos de limpieza */
  suppliesIncluded: boolean;
  active: boolean;
  /** Usuario que registró el servicio (dueño del recurso para RBAC) */
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const serviceSchema = new Schema<ServiceDocument>(
  {
    code: {
      type: String,
      required: [true, 'El código del servicio es obligatorio'],
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    name: {
      type: String,
      required: [true, 'El nombre del servicio es obligatorio'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    category: {
      type: String,
      enum: { values: SERVICE_CATEGORIES as unknown as string[], message: 'Categoría inválida' },
      default: 'general',
    },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    price: {
      type: Number,
      required: [true, 'El precio es obligatorio'],
      min: [0, 'El precio no puede ser negativo'],
    },
    durationMinutes: {
      type: Number,
      required: [true, 'La duración es obligatoria'],
      min: [15, 'La duración mínima es de 15 minutos'],
    },
    suppliesIncluded: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El servicio debe tener un creador'],
    },
  },
  { timestamps: true }
);

export const ServiceModel = model<ServiceDocument>('Service', serviceSchema);
