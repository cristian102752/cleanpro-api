/**
 * UNIT TESTS — auth.service.ts (Semana 09)
 * Servicio de autenticación probado en aislamiento con jest.mock:
 * el repositorio de usuarios y la generación de JWT se simulan.
 */

jest.mock('../repositories/users.repository', () => ({
  usersRepository: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../utils/jwt', () => ({
  generateToken: jest.fn(),
  verifyToken: jest.fn(),
}));

import { UserDocument } from '../models/user.model';
import { usersRepository } from '../repositories/users.repository';
import { authService } from '../services/auth.service';
import { generateToken } from '../utils/jwt';

const mockUsersRepo = usersRepository as jest.Mocked<typeof usersRepository>;
const mockGenerateToken = generateToken as jest.MockedFunction<typeof generateToken>;

const buildUser = (overrides: Partial<UserDocument> = {}): UserDocument =>
  ({
    _id: 'user-id-1',
    name: 'Ana Fernández',
    email: 'ana@cleanpro.com',
    password: '$2a$10$hashsimulado',
    role: 'user',
    comparePassword: jest.fn(),
    ...overrides,
  }) as unknown as UserDocument;

describe('authService', () => {
  describe('register()', () => {
    it('crea el usuario y retorna un token cuando el correo es nuevo', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);
      mockUsersRepo.create.mockResolvedValue(buildUser());
      mockGenerateToken.mockReturnValue('token-jwt-valido');

      const result = await authService.register({
        name: 'Ana Fernández',
        email: 'ana@cleanpro.com',
        password: 'Password123',
      });

      expect(mockUsersRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'ana@cleanpro.com', role: 'user' })
      );
      expect(mockGenerateToken).toHaveBeenCalledWith({
        id: 'user-id-1',
        email: 'ana@cleanpro.com',
        role: 'user',
      });
      expect(result.token).toBe('token-jwt-valido');
      expect(result.user.email).toBe('ana@cleanpro.com');
    });

    it('lanza AppError 409 si el correo ya está registrado', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(buildUser());

      await expect(
        authService.register({
          name: 'Ana Fernández',
          email: 'ana@cleanpro.com',
          password: 'Password123',
        })
      ).rejects.toMatchObject({ statusCode: 409 });

      expect(mockUsersRepo.create).not.toHaveBeenCalled();
    });
  });

  describe('login()', () => {
    it('retorna usuario y token con credenciales válidas', async () => {
      const user = buildUser();
      (user.comparePassword as jest.Mock).mockResolvedValue(true);
      mockUsersRepo.findByEmail.mockResolvedValue(user);
      mockGenerateToken.mockReturnValue('token-de-sesion');

      const result = await authService.login({
        email: 'ana@cleanpro.com',
        password: 'Password123',
      });

      expect(user.comparePassword).toHaveBeenCalledWith('Password123');
      expect(result.token).toBe('token-de-sesion');
      expect(result.user).toBe(user);
    });

    it('lanza AppError 401 si el usuario no existe', async () => {
      mockUsersRepo.findByEmail.mockResolvedValue(null);

      await expect(
        authService.login({ email: 'nadie@cleanpro.com', password: 'Password123' })
      ).rejects.toMatchObject({ statusCode: 401 });
    });

    it('lanza AppError 401 si la contraseña es incorrecta', async () => {
      const user = buildUser();
      (user.comparePassword as jest.Mock).mockResolvedValue(false);
      mockUsersRepo.findByEmail.mockResolvedValue(user);

      await expect(
        authService.login({ email: 'ana@cleanpro.com', password: 'clave-incorrecta' })
      ).rejects.toMatchObject({ statusCode: 401 });

      expect(mockGenerateToken).not.toHaveBeenCalled();
    });
  });

  describe('getProfile()', () => {
    it('retorna el usuario cuando existe', async () => {
      const user = buildUser();
      mockUsersRepo.findById.mockResolvedValue(user);

      const result = await authService.getProfile('user-id-1');

      expect(mockUsersRepo.findById).toHaveBeenCalledWith('user-id-1');
      expect(result).toBe(user);
    });

    it('lanza AppError 404 si el usuario no existe', async () => {
      mockUsersRepo.findById.mockResolvedValue(null);

      await expect(authService.getProfile('id-inexistente')).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
