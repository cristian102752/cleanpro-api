# 🧽 CleanPro API — Empresa de Servicios de Limpieza

API REST para gestionar el catálogo de **servicios de limpieza** de la empresa **CleanPro**: limpieza general, profunda, desinfección, vidrios, tapicería y post-obra.

> 🎓 Bootcamp Express.js — **Semana 08: API Segura con RBAC y Capas de Seguridad**

---

## 🧰 Stack tecnológico

- **Runtime:** Node.js ≥ 20 + TypeScript
- **Framework:** Express 4
- **Base de datos:** MongoDB + Mongoose
- **Autenticación:** JWT (`jsonwebtoken`) + contraseñas con `bcryptjs`
- **Validación:** Zod
- **Seguridad:** Helmet, CORS con whitelist, `express-rate-limit`, sanitización anti NoSQL-injection
- **Gestor de paquetes:** pnpm (nunca npm/yarn en este bootcamp)

---

## 🌐 Dominio y recurso principal

**Dominio:** empresa de limpieza. El recurso principal es el **servicio de limpieza** (`service`), identificado por un **código único** (campo único del dominio, ej: `CLN-001`).

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `code` | string (único) | Código del servicio, ej. `CLN-001` |
| `name` | string | Nombre del servicio |
| `category` | enum | `general`, `profunda`, `desinfeccion`, `vidrios`, `tapiceria`, `post_obra` |
| `description` | string | Detalle del servicio |
| `price` | number | Precio en COP |
| `durationMinutes` | number | Duración estimada (mín. 15 min) |
| `suppliesIncluded` | boolean | ¿CleanPro lleva insumos y equipos? |
| `active` | boolean | ¿Disponible para agendar? |
| `createdBy` | ObjectId → User | Quién registró el servicio (dueño para RBAC) |

---

## 👥 Roles y permisos (RBAC)

| Rol | Permisos |
|-----|----------|
| `user` | Ver catálogo y detalle de servicios · Crear servicios · Actualizar **solo sus propios** servicios · Ver su perfil |
| `admin` | Todo lo del rol `user` · Actualizar **cualquier** servicio · **Eliminar servicios** · **Listar todos los usuarios** |

Reglas aplicadas con `authMiddleware` (401 sin token / token inválido) y `requireRole('admin')` (403 sin el rol).

---

## 🔌 Endpoints

| Método | Ruta | Acceso | Descripción |
|--------|------|--------|-------------|
| GET | `/api/v1/health` | Público | Estado de la API |
| POST | `/api/v1/auth/register` | Público (rate limit estricto) | Registrar usuario |
| POST | `/api/v1/auth/login` | Público (rate limit estricto) | Iniciar sesión → retorna JWT |
| GET | `/api/v1/users/me` | 🔑 Autenticado | Perfil del usuario actual |
| GET | `/api/v1/users` | 🛡️ Admin | Listar usuarios |
| GET | `/api/v1/services` | Público | Listar servicios (filtros: `?category=`, `?search=`, `?active=`) |
| GET | `/api/v1/services/:id` | Público | Detalle de un servicio |
| POST | `/api/v1/services` | 🔑 Autenticado | Crear servicio |
| PUT / PATCH | `/api/v1/services/:id` | 🔑 Autenticado + dueño o admin | Actualizar servicio |
| DELETE | `/api/v1/services/:id` | 🛡️ Admin | Eliminar servicio |

Respuesta estándar: `{ success: boolean, data?: ..., message?: string }`.

---

## 🔐 Capas de seguridad aplicadas

1. **Helmet** — headers de seguridad en todas las respuestas (`X-Content-Type-Options: nosniff`, CSP, `X-Frame-Options`...).
2. **CORS con whitelist** — solo los orígenes de `CORS_ORIGINS` (`.env`) pueden consumir la API desde navegador; nunca `*`.
3. **Rate limiting** — general `100 req / 15 min` en `/api/v1` y estricto `5 req / 15 min` en `/auth/register` y `/auth/login` (responde **429** al excederlo). Header `RateLimit-Remaining` visible.
4. **Sanitización anti NoSQL injection** — se eliminan recursivamente las llaves que empiezan con `$` o contienen `.` en body y query (`{ "password": { "$gt": "" } }` queda neutralizado).
5. **Validación Zod** — payloads inválidos → `422` con detalle, sin llegar a la base de datos.
6. **Errores sin stack trace en producción** — el middleware de errores solo expone mensajes controlados cuando `NODE_ENV=production`.

### Evidencias para Thunder Client / Postman

- En **cualquier respuesta** aparecen los headers de Helmet (`x-content-type-options: nosniff`, `content-security-policy`, `x-frame-options`) y `ratelimit-remaining`.
- Enviar 6 peticiones seguidas a `POST /api/v1/auth/login` → la sexta responde **429** (límite 5 por ventana).
- Enviar `POST /api/v1/auth/login` con `{ "email": { "$gt": "" }, "password": { "$gt": "" } }` → **422** de Zod: el intento de NoSQL injection fue saneado.

---

## ▶️ Cómo ejecutar el proyecto

**Requisitos:** Node.js ≥ 20, pnpm 9+ y MongoDB (local o con Docker).

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear el archivo de entorno
Copy-Item .env.example .env     # Windows PowerShell (o: cp .env.example .env)

# 3. Levantar MongoDB con Docker (si no tienes MongoDB local)
docker run -d --name cleanpro-mongo -p 27017:27017 mongo:7

# 4. Iniciar el servidor en desarrollo
pnpm dev        # → http://localhost:4000

# 5. (Opcional) Sembrar datos demo: admin + usuario + 4 servicios
pnpm seed
```

**Credenciales demo (seed):**

| Rol | Correo | Contraseña |
|-----|--------|------------|
| admin | `admin@cleanpro.com` | `Admin12345` |
| user | `empleado@cleanpro.com` | `Empleado12345` |

### Ejemplo de uso con Thunder Client / Postman

```bash
# Login → copiar el token del response
POST http://localhost:4000/api/v1/auth/login
{ "email": "admin@cleanpro.com", "password": "Admin12345" }

# Crear servicio (header: Authorization: Bearer <token>)
POST http://localhost:4000/api/v1/services
{
  "code": "CLN-005",
  "name": "Limpieza de tapicería de muebles",
  "category": "tapiceria",
  "price": 70000,
  "durationMinutes": 90,
  "suppliesIncluded": true
}
```

---

## 📁 Estructura del proyecto

```
src/
├── config/           # env.ts (variables), db.ts (Mongo), security.ts (Helmet/CORS/RateLimit)
├── errors/           # AppError (errores operacionales con statusCode)
├── types/            # Tipos globales + extensión de Express.Request (req.user)
├── models/           # user.model.ts, service.model.ts (Mongoose)
├── repositories/     # Acceso a datos: users, services
├── services/         # Lógica de negocio: auth.service, service.service
├── validators/       # Esquemas Zod: auth.schema, service.schema
├── middlewares/      # auth (RBAC), validate (Zod), sanitize (NoSQL), error
├── controllers/      # auth, user, service
├── routes/           # auth.routes, user.routes, service.routes
├── scripts/          # seed.ts (datos demo)
├── app.ts            # App Express con capas de seguridad
└── server.ts         # Punto de entrada (conecta Mongo + listen)
```

---

## 📦 Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `pnpm dev` | Servidor en desarrollo con recarga (tsx watch) |
| `pnpm build` | Compila TypeScript a `dist/` |
| `pnpm start` | Ejecuta el build de producción |
| `pnpm seed` | Siembra usuarios y servicios demo |

---

Hecho para el bootcamp Express.js 🎓 — Ficha 3311987
