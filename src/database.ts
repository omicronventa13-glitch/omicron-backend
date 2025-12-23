import mongoose from 'mongoose';
import { seedUsers } from './seed'; // Importamos el seeder

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || '');
    console.log(`[DB] MongoDB Conectado: ${conn.connection.host}`);
    
    // Ejecutar Seeding después de conectar
    await seedUsers();
    
  } catch (error) {
    console.error(`[DB] Error de conexión: ${error}`);
    process.exit(1);
  }
};
