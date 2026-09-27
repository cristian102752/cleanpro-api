import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './env';

/**
 * ============================================================
 *  CAPAS DE SEGURIDAD DE LA API (Semana 08)
 * ============================================================
 * 1. Helmet       → headers de seguridad HTTP en cada respuesta
 * 2. CORS         → whitelist de orígenes permitidos (nunca "*")
 * 3. Rate limiting→ límite de peticiones por IP (general y auth)
 * ============================================================
 */

// 1) Helmet: activa headers como X-Content-Type-Options: nosniff,
//    Content-Security-Policy, X-Frame-Options, etc.
export const helmetSecurity = helmet();

// 2) CORS con whitelist: solo los orígenes listados en .env pueden
//    consumir la API desde el navegador.
export const corsWhitelist = cors({
  origin(origin, callback) {
    // Se permiten peticiones sin header Origin (Thunder Client, Postman,
    // curl, apps móviles) — el navegador siempre envía Origin.
    if (!origin || env.corsOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origen ${origin} no permitido por CORS`));
  },
  credentials: true,
});

// 3a) Rate limiter general: protege todas las rutas de /api/v1
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: env.rateLimitMax,
  standardHeaders: true, // expone RateLimit-Remaining en los headers
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, inténtalo más tarde',
  },
});

// 3b) Rate limiter estricto para autenticación (login / registro):
//     frena ataques de fuerza bruta. Al superarlo responde 429.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  limit: env.authRateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Demasiados intentos de autenticación, espera 15 minutos',
  },
});
