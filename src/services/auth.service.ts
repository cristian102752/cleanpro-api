import { AppError } from '../errors/AppError';
import { UserDocument } from '../models/user.model';
import { usersRepository } from '../repositories/users.repository';
import type { JwtPayload } from '../types';
import { generateToken } from '../utils/jwt';
import type { LoginInput, RegisterInput } from '../validators/auth.schema';

/** Construye el payload del JWT a partir de un usuario */
const buildTokenPayload = (user: UserDocument): JwtPayload => ({
  id: String(user._id),
  email: user.email,
  role: user.role,
});

/** Lógica de negocio de autenticación (registro, login, perfil) */
export const authService = {
  /** Registra un usuario nuevo. 409 si el correo ya existe. */
  async register(input: RegisterInput) {
    const existing = await usersRepository.findByEmail(input.email);
    if (existing) {
      throw new AppError('El correo ya está registrado', 409);
    }

    const user = await usersRepository.create({
      name: input.name,
      email: input.email,
      password: input.password,
      role: input.role ?? 'user',
    });

    const token = generateToken(buildTokenPayload(user));
    return { user, token };
  },

  /** Inicia sesión. 401 si las credenciales son inválidas. */
  async login(input: LoginInput) {
    const user = await usersRepository.findByEmail(input.email);
    if (!user) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const isValidPassword = await user.comparePassword(input.password);
    if (!isValidPassword) {
      throw new AppError('Credenciales inválidas', 401);
    }

    const token = generateToken(buildTokenPayload(user));
    return { user, token };
  },

  /** Retorna el perfil del usuario autenticado. */
  async getProfile(id: string) {
    const user = await usersRepository.findById(id);
    if (!user) {
      throw new AppError('Usuario no encontrado', 404);
    }
    return user;
  },

  /** Lista todos los usuarios (solo administradores). */
  async getAllUsers() {
    return usersRepository.findAll();
  },
};
