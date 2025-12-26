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

// --- DEBUG DE DATOS RECIBIDOS ---
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && !req.is('multipart/form-data')) {
    console.log(`📦 Payload recibido (${req.method}):`, JSON.stringify(req.body, null, 2));
  }
  next();
});

// --- CONFIGURACIÓN CORS ---
const allowedOrigins = [
  'http://localhost:5173',                  // Tu entorno local
  'https://novatech-pos.netlify.app',       // Tu Frontend en producción
  'https://omicron-pos.netlify.app' ,        // Variante
  'https://novatech-venta.netlify.app'    // Variante2


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

// --- CONFIGURACIÓN CARPETA UPLOADS (SOLUCIÓN ROBUSTA) ---
// Definimos rutas absolutas para evitar confusiones relativas
const pathsToCreate = [
  path.resolve(process.cwd(), 'uploads'),            // Ruta Raíz Absoluta
  path.join(__dirname, '../uploads'),                // Ruta relativa al script
  path.join(process.cwd(), 'dist', 'uploads')        // Ruta en dist (por si acaso)
];

console.log('🔍 --- ASEGURANDO CARPETAS DE UPLOAD ---');
pathsToCreate.forEach(dirPath => {
  if (!fs.existsSync(dirPath)) {
    try {
      console.log(`🔨 Intentando crear: ${dirPath}`);
      fs.mkdirSync(dirPath, { recursive: true, mode: 0o755 });
      console.log(`✅ Carpeta creada con éxito: ${dirPath}`);
    } catch (e: any) {
      // YA NO IGNORAMOS EL ERROR - LO MOSTRAMOS
      console.error(`❌ FALLÓ creación de carpeta (${dirPath}):`, e.message);
    }
  } else {
    console.log(`🆗 Carpeta ya existe: ${dirPath}`);
  }
});
console.log('----------------------------------------');

// Servimos la carpeta raíz como la pública oficial
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

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

// --- MANEJADOR DE ERRORES GLOBAL (ALTA VISIBILIDAD) ---
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  // 1. LOG DETALLADO EN SERVIDOR (RENDER CONSOLE)
  console.error('\n🔥 ¡ERROR DETECTADO EN EL SERVIDOR! 🔥');
  console.error(`📍 Ruta: ${req.method} ${req.originalUrl}`);
  console.error(`❌ Mensaje: ${err.message}`);
  console.error(`❌ Tipo: ${err.name}`);
  if (err.stack) console.error(`❌ Stack (Primera línea): ${err.stack.split('\n')[1]}`);
  console.error('---------------------------------------\n');
  
  // 2. RESPUESTAS ESPECÍFICAS
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: `Error al subir imagen (Multer): ${err.message}`,
      code: err.code
    });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return res.status(400).json({
      message: `El dato '${value}' ya existe en el campo '${field}'.`,
      error: 'Registro duplicado'
    });
  }

  // 3. RESPUESTA ERROR 500
  // Enviamos el mensaje real al Frontend para que puedas verlo en Network -> Response
  res.status(500).json({
    message: 'Error interno del servidor',
    error: err.message || 'Error desconocido', // <--- Importante: Aquí verás la causa
    type: err.name,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`------------------------------------------------`);
  console.log(`🚀 SERVIDOR LISTO EN PUERTO ${PORT}`);
  console.log(`📂 Directorio de trabajo (CWD): ${process.cwd()}`);
  console.log(`------------------------------------------------`);
});