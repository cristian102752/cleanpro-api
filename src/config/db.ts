import mongoose from 'mongoose';
import { env } from './env';

/** Conecta la API con MongoDB usando la URL configurada en .env */
export const connectDB = async (): Promise<void> => {
  mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB conectado correctamente');
  });
  mongoose.connection.on('error', (err) => {
    console.error('🔴 Error en la conexión de MongoDB:', err);
  });
  await mongoose.connect(env.mongodbUrl);
};

/** Cierra la conexión con MongoDB (apagado limpio del servidor) */
export const disconnectDB = async (): Promise<void> => {
  await mongoose.disconnect();
};
