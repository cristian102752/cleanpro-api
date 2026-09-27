import { UserDocument, UserModel } from '../models/user.model';
import type { Role } from '../types';

export interface NewUserData {
  name: string;
  email: string;
  password: string;
  role?: Role;
}

/** Capa de acceso a datos de usuarios (encapsula Mongoose) */
export const usersRepository = {
  /** Busca un usuario por correo, incluyendo la contraseña (para login) */
  findByEmail: (email: string): Promise<UserDocument | null> =>
    UserModel.findOne({ email: email.toLowerCase() }).select('+password'),

  findById: (id: string): Promise<UserDocument | null> => UserModel.findById(id),

  findAll: (): Promise<UserDocument[]> => UserModel.find().sort({ createdAt: -1 }),

  create: (data: NewUserData): Promise<UserDocument> => UserModel.create(data),
};
