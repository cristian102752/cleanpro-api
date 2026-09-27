import bcrypt from 'bcryptjs';
import { Document, model, Schema } from 'mongoose';
import type { Role } from '../types';

export interface UserDocument extends Document {
  name: string;
  email: string;
  password: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  /** Compara una contraseña en texto plano contra el hash guardado */
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new Schema<UserDocument>(
  {
    name: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'El correo es obligatorio'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'El formato del correo es inválido'],
    },
    password: {
      type: String,
      required: [true, 'La contraseña es obligatoria'],
      minlength: 8,
      select: false, // nunca se devuelve en consultas normales
    },
    role: {
      type: String,
      enum: { values: ['user', 'admin'], message: 'Rol inválido' },
      default: 'user',
    },
  },
  { timestamps: true }
);

// Encripta la contraseña automáticamente antes de guardar
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.password);
};

// Elimina la contraseña cuando el usuario se serializa a JSON
userSchema.methods.toJSON = function () {
  const obj = this.toObject() as Record<string, unknown>;
  delete obj.password;
  return obj;
};

export const UserModel = model<UserDocument>('User', userSchema);
