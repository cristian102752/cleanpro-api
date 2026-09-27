import 'dotenv/config';
import { z } from 'zod';

/**
 * Validación y carga centralizada de variables de entorno.
 * Si falta una variable obligatoria, la app no arranca (fail-fast).
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URL: z.string().min(1, 'MONGODB_URL es obligatorio'),
  JWT_SECRET: z.string().min(8, 'JWT_SECRET debe tener al menos 8 caracteres'),
  JWT_EXPIRES_IN: z.string().default('2h'),
  CORS_ORIGINS: z.string().default('http://localhost:3000'),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Variables de entorno inválidas:');
  for (const issue of parsed.error.issues) {
    console.error(`   - ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = {
  nodeEnv: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isTest: parsed.data.NODE_ENV === 'test',
  port: parsed.data.PORT,
  mongodbUrl: parsed.data.MONGODB_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  corsOrigins: parsed.data.CORS_ORIGINS.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  rateLimitMax: parsed.data.RATE_LIMIT_MAX,
  authRateLimitMax: parsed.data.AUTH_RATE_LIMIT_MAX,
};
