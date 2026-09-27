import { app } from './app';
import { connectDB } from './config/db';
import { env } from './config/env';

/** Punto de entrada: conecta MongoDB y levanta el servidor HTTP */
const bootstrap = async () => {
  await connectDB();
  app.listen(env.port, () => {
    console.log(`🚀 CleanPro API escuchando en http://localhost:${env.port}`);
    console.log(`🔐 Entorno: ${env.nodeEnv}`);
    console.log(`🧪 Health check: http://localhost:${env.port}/api/v1/health`);
  });
};

bootstrap().catch((err) => {
  console.error('❌ No fue posible iniciar el servidor:', err);
  process.exit(1);
});
