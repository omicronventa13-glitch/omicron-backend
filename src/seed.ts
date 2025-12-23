import bcrypt from 'bcryptjs';
import User from './models/User';

const users = [
  {
    username: 'Omicron',
    password: 'Omicron13.01',
    role: 'super'
  },
  {
    username: 'Admin',
    password: 'Admin.2025-0101',
    role: 'admin'
  },
  {
    username: 'Vendedor',
    password: 'venta1.2025',
    role: 'vendedor'
  }
];

export const seedUsers = async () => {
  try {
    // Verificar si ya existen usuarios para no duplicarlos
    const count = await User.countDocuments();
    if (count > 0) {
      console.log('[Seed] Usuarios ya existen, saltando creación.');
      return;
    }

    console.log('[Seed] Creando usuarios iniciales...');

    for (const user of users) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await User.create({
        username: user.username,
        password: hashedPassword,
        role: user.role
      });
    }

    console.log('[Seed] ¡Usuarios creados exitosamente!');
  } catch (error) {
    console.error('[Seed] Error al crear usuarios:', error);
  }
};