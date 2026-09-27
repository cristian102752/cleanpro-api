import express from 'express';
import { apiLimiter, corsWhitelist, helmetSecurity } from './config/security';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { sanitizeInput } from './middlewares/sanitize.middleware';
import { authRoutes } from './routes/auth.routes';
import { serviceRoutes } from './routes/service.routes';
import { userRoutes } from './routes/user.routes';

/**
 * Aplicación Express de CleanPro API.
 * Se exporta sin escuchar puerto para poder testearla con Supertest.
 */
export const app = express();

// ── Capas de seguridad (Semana 08) ────────────────────────────────
app.use(helmetSecurity);   // 1. Headers de seguridad
app.use(corsWhitelist);    // 2. CORS con whitelist de orígenes
app.use(express.json());   // Parseo de body JSON
app.use(sanitizeInput);    // 3. Sanitización contra NoSQL injection
app.use('/api/v1', apiLimiter); // 4. Rate limiting general

// ── Salud de la API ───────────────────────────────────────────────
app.get('/api/v1/health', (_req, res) => {
  res.status(200).json({ success: true, message: 'CleanPro API operativa 🧽' });
});

// ── Rutas ─────────────────────────────────────────────────────────
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/services', serviceRoutes);

// ── 404 y manejo central de errores ───────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);
