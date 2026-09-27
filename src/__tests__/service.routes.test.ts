/**
 * INTEGRATION TESTS — service.routes.ts (Semana 09)
 * Pruebas HTTP reales con Supertest + MongoDB Memory Server:
 * pasan por middlewares de seguridad, validación Zod y RBAC.
 */
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import { app } from '../app';
import { ServiceModel } from '../models/service.model';
import { UserModel } from '../models/user.model';
import { generateToken } from '../utils/jwt';

let mongoServer: MongoMemoryServer;
let userToken: string;
let otherUserToken: string;
let adminToken: string;
let userId: string;

const API = '/api/v1/services';

const validServicePayload = {
  code: 'CLN-100',
  name: 'Limpieza general de hogares',
  category: 'general',
  description: 'Aseo completo de casas y apartamentos',
  price: 50000,
  durationMinutes: 120,
  suppliesIncluded: true,
};

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Usuarios de prueba creados directamente en la base en memoria
  const user = await UserModel.create({
    name: 'Empleado de Limpieza',
    email: 'empleado@cleanpro.com',
    password: 'Empleado12345',
    role: 'user',
  });
  const otherUser = await UserModel.create({
    name: 'Otro Empleado',
    email: 'otro@cleanpro.com',
    password: 'Otro1234567',
    role: 'user',
  });
  const admin = await UserModel.create({
    name: 'Admin CleanPro',
    email: 'admin@cleanpro.com',
    password: 'Admin12345',
    role: 'admin',
  });

  userId = String(user._id);
  userToken = generateToken({ id: userId, email: user.email, role: 'user' });
  otherUserToken = generateToken({ id: String(otherUser._id), email: otherUser.email, role: 'user' });
  adminToken = generateToken({ id: String(admin._id), email: admin.email, role: 'admin' });
});

afterEach(async () => {
  // Limpieza de estado global entre tests
  await ServiceModel.deleteMany({});
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe(`${API} — Integration`, () => {
  it('GET / retorna 200 y un array vacío inicialmente', async () => {
    const res = await request(app).get(API);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(0);
    expect(res.body.data).toEqual([]);
    // Verifica que Helmet está activo (Semana 08)
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('POST / retorna 401 sin token de autenticación', async () => {
    const res = await request(app).post(API).send(validServicePayload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('POST / retorna 422 con datos inválidos (validación Zod)', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: 'X', name: '', price: -10 });

    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Datos inválidos');
  });

  it('POST / retorna 201 y crea el servicio con datos válidos (autenticado)', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.code).toBe('CLN-100');
    expect(res.body.data.createdBy).toBe(userId);

    const saved = await ServiceModel.findOne({ code: 'CLN-100' });
    expect(saved).not.toBeNull();
    expect(saved?.price).toBe(50000);
  });

  it('POST / retorna 409 si el código ya existe', async () => {
    await request(app).post(API).set('Authorization', `Bearer ${userToken}`).send(validServicePayload);

    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });

  it('GET /:id retorna 200 con un servicio existente', async () => {
    const created = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);
    const id = created.body.data._id as string;

    const res = await request(app).get(`${API}/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.data.code).toBe('CLN-100');
    expect(res.body.data.name).toBe('Limpieza general de hogares');
  });

  it('GET /:id retorna 404 con un ObjectId inexistente', async () => {
    const missingId = new mongoose.Types.ObjectId();

    const res = await request(app).get(`${API}/${missingId}`);

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /:id retorna 400 con un identificador malformado', async () => {
    const res = await request(app).get(`${API}/no-es-un-id`);

    expect(res.status).toBe(400);
  });

  it('GET / filtra por categoría (query params)', async () => {
    await request(app).post(API).set('Authorization', `Bearer ${userToken}`).send(validServicePayload);
    await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validServicePayload, code: 'CLN-200', category: 'desinfeccion', name: 'Desinfección de consultorios' });

    const res = await request(app).get(`${API}?category=desinfeccion`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].category).toBe('desinfeccion');
  });

  it('PUT /:id retorna 200 y actualiza el servicio (dueño)', async () => {
    const created = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);
    const id = created.body.data._id as string;

    const res = await request(app)
      .put(`${API}/${id}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ price: 65000, suppliesIncluded: false });

    expect(res.status).toBe(200);
    expect(res.body.data.price).toBe(65000);
    expect(res.body.data.suppliesIncluded).toBe(false);
  });

  it('PATCH /:id retorna 403 si no es el dueño ni admin', async () => {
    const created = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);
    const id = created.body.data._id as string;

    const res = await request(app)
      .patch(`${API}/${id}`)
      .set('Authorization', `Bearer ${otherUserToken}`)
      .send({ price: 99999 });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('DELETE /:id retorna 403 si el usuario no es admin', async () => {
    const created = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);
    const id = created.body.data._id as string;

    const res = await request(app)
      .delete(`${API}/${id}`)
      .set('Authorization', `Bearer ${userToken}`);

    expect(res.status).toBe(403);
    const stillThere = await ServiceModel.findById(id);
    expect(stillThere).not.toBeNull();
  });

  it('DELETE /:id retorna 204 cuando un admin elimina el servicio', async () => {
    const created = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send(validServicePayload);
    const id = created.body.data._id as string;

    const res = await request(app)
      .delete(`${API}/${id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    const deleted = await ServiceModel.findById(id);
    expect(deleted).toBeNull();
  });

  it('mitiga NoSQL injection: operadores $ se eliminan antes de Zod', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });

    // Zod rechaza el body saneado (email ya no es un string válido)
    expect(res.status).toBe(422);
  });

  it('retorna 401 con un token inválido o manipulado', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', 'Bearer token.invalido.manipulado')
      .send(validServicePayload);

    expect(res.status).toBe(401);
    expect(res.body.message).toContain('Token');
  });

  it('retorna 400 cuando el body JSON está malformado', async () => {
    const res = await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .set('Content-Type', 'application/json')
      .send('{"code": "CLN-999", invalido');

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('El cuerpo JSON es inválido');
  });

  it('GET / soporta los filtros search y active juntos', async () => {
    await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validServicePayload, name: 'Lavado de vidrios panorámicos', category: 'vidrios' });
    await request(app)
      .post(API)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ ...validServicePayload, code: 'CLN-300', name: 'Pulido de pisos', active: false });

    const res = await request(app).get(`${API}?search=vidrios&active=true`);

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(1);
    expect(res.body.data[0].category).toBe('vidrios');
  });

  it('CORS permite un origen de la whitelist', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://localhost:3000');

    expect(res.status).toBe(200);
    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
  });

  it('CORS rechaza un origen fuera de la whitelist', async () => {
    const res = await request(app)
      .get('/api/v1/health')
      .set('Origin', 'http://sitio-malicioso.com');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('expone headers de seguridad Helmet y RateLimit en las respuestas', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['ratelimit-remaining']).toBeDefined();
    expect(res.headers['ratelimit-limit']).toBeDefined();
  });
});
