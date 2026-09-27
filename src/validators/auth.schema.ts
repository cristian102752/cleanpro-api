import { z } from 'zod';

/** Validación Zod del registro de usuarios */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'El nombre es obligatorio' })
    .min(2, 'El nombre debe tener al menos 2 caracteres')
    .max(80, 'El nombre es demasiado largo'),
  email: z.string({ required_error: 'El correo es obligatorio' }).email('El correo es inválido'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña es demasiado larga'),
  /** Nota: rol opcional solo para demos del bootcamp; en producción
   *  los admins se crean por seed o por otro administrador. */
  role: z.enum(['user', 'admin']).optional(),
});

/** Validación Zod del inicio de sesión */
export const loginSchema = z.object({
  email: z.string({ required_error: 'El correo es obligatorio' }).email('El correo es inválido'),
  password: z.string({ required_error: 'La contraseña es obligatoria' }).min(1, 'La contraseña es obligatoria'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
