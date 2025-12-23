import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import morgan from 'morgan';
import helmet from 'helmet';
import path from 'path';
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

// --- MONITOR DE TRÁFICO (DEBUG - AL INICIO) ---
// Lo movemos aquí arriba para ver las peticiones ANTES de que CORS actúe.
// Esto nos confirmará si el Frontend está llegando a la URL correcta.
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.originalUrl} | Origin: ${req.headers.origin}`);
  next();
});

// --- CONFIGURACIÓN CORS (CRÍTICA PARA NETLIFY) ---
const allowedOrigins = [
  'http://localhost:5173',                  // Tu entorno local
  'https://novatech-pos.netlify.app',       // Tu Frontend en producción
  'https://omicron-pos.netlify.app'         // Variante
];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (como Postman o apps móviles nativas)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.log(`🚫 Bloqueado por CORS: ${origin}`); // Log explícito del bloqueo
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  // AGREGADO: 'Cache-Control', 'X-Requested-With', 'Accept' para evitar bloqueos por headers del navegador
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control', 'X-Requested-With', 'Accept'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configurar carpeta de uploads pública
const uploadsPath = path.join(__dirname, '../uploads');
app.use('/uploads', express.static(uploadsPath));
console.log(`📂 Carpeta pública de uploads configurada en: ${uploadsPath}`);

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

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`------------------------------------------------`);
  console.log(`🚀 SERVIDOR REINICIADO Y LISTO EN PUERTO ${PORT}`);
  console.log(`------------------------------------------------`);
});