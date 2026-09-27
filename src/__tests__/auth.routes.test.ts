/**
 * INTEGRATION TESTS — auth.routes.ts y user.routes.ts (Semana 09)
 * Flujo completo de autenticación sobre HTTP con base de datos en memoria.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../app';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;

const newUser = {
  name: 'Cliente Nuevo',
  email: 'cliente@cleanpro.com',
  password: 'Cliente12345',
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterEach(async () => {
  await UserModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('POST /api/v1/auth/register — Integration', () => {
  it('retorna 201, token y usuario cuando los datos son válidos', async () => {
    const res = await request(app).post('/api/v1/auth/register').send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.email).toBe('cliente@cleanpro.com');
    // La contraseña nunca se expone en la respuesta
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('guarda la contraseña encriptada (hash bcrypt) en la base de datos', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);

    const raw = await UserModel.findOne({ email: newUser.email }).select('+password');
    expect(raw?.password).not.toBe(newUser.password);
    expect(raw?.password.startsWith('$2')).toBe(true);
  });

  it('retorna 409 si el correo ya está registrado', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);

    const res = await request(app).post('/api/v1/auth/register').send(newUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('retorna 422 si el email es inválido', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ name: 'Cliente', email: 'no-es-un-email', password: 'Cliente12345' });

    expect(res.status).toBe(422);
  });
});

describe('POST /api/v1/auth/login — Integration', () => {
  it('retorna 200 y token con credenciales correctas', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newUser.email, password: newUser.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.user.role).toBe('user');
  });

  it('retorna 401 con contraseña incorrecta', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newUser.email, password: 'clave-equivocada' });

    expect(res.status).toBe(401);
  });

  it('retorna 401 si el usuario no existe', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'fantasma@cleanpro.com', password: 'Fantasma1234' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/v1/users — Integration (RBAC)', () => {
  it('/me retorna 200 y el perfil del usuario autenticado', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newUser.email, password: newUser.password });
    const token = login.body.data.token as string;

    const res = await request(app).get('/api/v1/users/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.email).toBe(newUser.email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('/me retorna 401 sin token', async () => {
    const res = await request(app).get('/api/v1/users/me');

    expect(res.status).toBe(401);
  });

  it('GET /users retorna 200 y la lista si el usuario es admin', async () => {
    const admin = await UserModel.create({
      name: 'Admin CleanPro',
      email: 'admin@cleanpro.com',
      password: 'Admin12345',
      role: 'admin',
    });
    const adminToken = generateToken({
      id: String(admin._id),
      email: admin.email,
      role: 'admin',
    });

    const res = await request(app)
      .get('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].email).toBe('admin@cleanpro.com');
  });

  it('GET /users retorna 403 si el usuario no es admin', async () => {
    await request(app).post('/api/v1/auth/register').send(newUser);
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: newUser.email, password: newUser.password });
    const token = login.body.data.token as string;

    const res = await request(app).get('/api/v1/users').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });
});
