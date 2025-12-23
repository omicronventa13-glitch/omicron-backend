import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs'; // Importamos FS para manejar archivos
import { connectDB } from './database';

// Importar Rutas
import productRoutes from './routes/products';
import authRoutes from './routes/auth';
import repairRoutes from './routes/repairs';
import userRoutes from './routes/users';
import ticketRoutes from './routes/tickets';
import backupRoutes from './routes/backup';

dotenv.config();
const app = express();

// Conexión DB
connectDB();

// --- MIDDLEWARES GLOBALES ---
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(morgan('dev'));

// --- MONITOR DE TRÁFICO (DEBUG) ---
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} | Origin: ${req.headers.origin}`);
  next();
});

// --- CONFIGURACIÓN CORS ---
const allowedOrigins = [
  'http://localhost:5173',                  // Tu entorno local
  'https://novatech-pos.netlify.app',       // Tu Frontend en producción
  'https://omicron-pos.netlify.app'         // Variante
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 Bloqueado por CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Accept', 'Pragma', 'Expires'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- CONFIGURACIÓN CARPETA UPLOADS (FIX PARA RENDER) ---
const uploadsPath = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsPath)) {
  try {
    fs.mkdirSync(uploadsPath, { recursive: true });
    console.log(`📂 Carpeta 'uploads' creada automáticamente en: ${uploadsPath}`);
  } catch (error) {
    console.error('❌ Error al crear carpeta uploads:', error);
  }
}
app.use('/uploads', express.static(uploadsPath));
console.log(`📂 Carpeta pública de uploads servida desde: ${uploadsPath}`);

// --- RUTAS ---
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/repairs', repairRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/backup', backupRoutes);

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('API Punto de Venta v3.0 - ACTIVA');
});

// --- MANEJADOR DE ERRORES GLOBAL (MODO DEBUG ACTIVADO) ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 1. Lo registramos en los logs de Render para que tú lo veas en el Dashboard
  console.error('🔥 ERROR CRÍTICO DEL SERVIDOR (Detalle):');
  console.error(err);

  // 2. Manejo de errores específicos
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'El archivo es demasiado grande (Máx 5MB)' });
  }

  if (err.name === 'ValidationError') {
     return res.status(400).json({ message: 'Error de validación de datos', error: err.message });
  }

  // 3. RESPUESTA AL FRONTEND (Ahora enviamos el error real en lugar de ocultarlo)
  res.status(500).json({
    message: 'Error interno del servidor',
    error: err.message || 'Error desconocido', // <--- AQUÍ VERÁS EL PROBLEMA REAL
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`------------------------------------------------`);
  console.log(`🚀 SERVIDOR LISTO EN PUERTO ${PORT}`);
  console.log(`------------------------------------------------`);
});