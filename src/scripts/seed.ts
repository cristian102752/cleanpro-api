/**
 * Seed de datos de demostración para CleanPro API.
 * Ejecutar con: pnpm seed
 * Crea un usuario administrador, un usuario normal y 4 servicios de ejemplo.
 */
import mongoose from 'mongoose';
import { env } from '../config/env';
import { ServiceModel } from '../models/service.model';
import { UserModel } from '../models/user.model';

const ADMIN_EMAIL = 'admin@cleanpro.com';
const ADMIN_PASSWORD = 'Admin12345';
const USER_EMAIL = 'empleado@cleanpro.com';
const USER_PASSWORD = 'Empleado12345';

const run = async () => {
  await mongoose.connect(env.mongodbUrl);
  console.log('🟢 Conectado a MongoDB, sembrando datos...');

  let admin = await UserModel.findOne({ email: ADMIN_EMAIL });
  if (!admin) {
    admin = await UserModel.create({
      name: 'Administrador CleanPro',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
    });
    console.log(`✅ Admin creado → ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } else {
    console.log('ℹ️  El admin ya existía');
  }

  const empleado = await UserModel.findOne({ email: USER_EMAIL });
  if (!empleado) {
    await UserModel.create({
      name: 'Empleado de Limpieza',
      email: USER_EMAIL,
      password: USER_PASSWORD,
      role: 'user',
    });
    console.log(`✅ Usuario normal creado → ${USER_EMAIL} / ${USER_PASSWORD}`);
  }

  const servicesCount = await ServiceModel.countDocuments();
  if (servicesCount === 0) {
    await ServiceModel.create([
      {
        code: 'CLN-001',
        name: 'Limpieza general de oficinas',
        category: 'general',
        description: 'Aseo completo de oficinas: pisos, escritorios, baños y zonas comunes.',
        price: 45000,
        durationMinutes: 120,
        suppliesIncluded: true,
        createdBy: admin._id,
      },
      {
        code: 'CLN-002',
        name: 'Limpieza profunda post-obra',
        category: 'post_obra',
        description: 'Remoción de polvo de construcción, residuos y limpieza detallada.',
        price: 180000,
        durationMinutes: 300,
        suppliesIncluded: true,
        createdBy: admin._id,
      },
      {
        code: 'CLN-003',
        name: 'Desinfección y sanitización',
        category: 'desinfeccion',
        description: 'Aplicación de desinfectantes certificados en superficies de alto contacto.',
        price: 220000,
        durationMinutes: 240,
        suppliesIncluded: true,
        createdBy: admin._id,
      },
      {
        code: 'CLN-004',
        name: 'Lavado de vidrios en altura',
        category: 'vidrios',
        description: 'Limpieza de ventanas y fachadas de vidrio con equipo especializado.',
        price: 90000,
        durationMinutes: 180,
        suppliesIncluded: false,
        createdBy: admin._id,
      },
    ]);
    console.log('✅ 4 servicios de limpieza creados');
  } else {
    console.log('ℹ️  Ya existían servicios, se omite el seed');
  }

  await mongoose.disconnect();
  console.log('🏁 Seed completado');
};

run().catch((err) => {
  console.error('❌ Error en el seed:', err);
  process.exit(1);
});
