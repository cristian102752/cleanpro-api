import dotenv from 'dotenv';

// Carga las variables de entorno de prueba antes de importar la app,
// garantizando NODE_ENV=test y límites de rate limit altos.
dotenv.config({ path: '.env.test' });
