import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import RepairOrder from '../models/RepairOrder';

const router = Router();

// --- CONFIGURACIÓN MULTER (Para subir archivos) ---
const uploadDir = 'uploads/repairs';
// Crear carpeta si no existe
if (!fs.existsSync(uploadDir)){
    try {
        fs.mkdirSync(uploadDir, { recursive: true });
    } catch (err) {
        console.error("Error creando directorio:", err);
    }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Nombre único: campo-fecha-random.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Middleware que acepta 'evidencePhotos' (múltiples) y 'clientSignature' (uno)
const repairUploads = upload.fields([
  { name: 'evidencePhotos', maxCount: 10 },
  { name: 'clientSignature', maxCount: 1 }
]);

// --- RUTAS ---

// CREAR ORDEN
router.post('/', repairUploads, async (req: any, res: any) => {
  try {
    console.log("🔥 [POST] Procesando nueva orden de reparación...");
    
    // 1. Normalización del Body (Vital para que Multer + FormData funcione bien)
    const body = { ...req.body }; 
    
    // 2. Validación Manual Básica
    if (!body.clientName || !body.service) {
        return res.status(400).json({ 
            message: "Faltan datos obligatorios (Cliente o Servicio). Revisa el formulario." 
        });
    }

    // 3. Generar Folio Automático
    const autoFolio = `REP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 4. Procesar Archivos (Fotos y Firma)
    const files = req.files || {};
    
    const evidencePhotos = files['evidencePhotos'] 
      ? files['evidencePhotos'].map((file: any) => `${req.protocol}://${req.get('host')}/uploads/repairs/${file.filename}`)
      : [];

    let clientSignature = '';
    if (files['clientSignature'] && files['clientSignature'][0]) {
      const file = files['clientSignature'][0];
      clientSignature = `${req.protocol}://${req.get('host')}/uploads/repairs/${file.filename}`;
    }

    // 5. Reconstruir objeto DEVICE
    // El frontend envía datos como "device[brand]", aquí los capturamos
    const deviceData = {
        brand: body['device[brand]'] || body.brand || 'N/A',
        model: body['device[model]'] || body.model || 'N/A',
        color: body['device[color]'] || body.color || 'N/A'
    };

    // 6. Parsing de Números
    const cost = parseFloat(body.cost) || 0;
    const downPayment = parseFloat(body.downPayment) || 0;

    // 7. Crear el Objeto para Mongo
    const newOrder = new RepairOrder({
      folio: autoFolio,
      clientName: body.clientName,
      phone: body.phone || 'Sin teléfono',
      service: body.service,
      cost: cost,
      downPayment: downPayment,
      deliveryDate: body.deliveryDate || null,
      comments: body.comments || '',
      status: body.status || 'Pendiente',
      
      // Datos del Equipo
      device: deviceData,
      
      // Datos de Seguridad (Patrón/Contraseña)
      unlockType: body.unlockType || 'none',
      unlockCode: body.unlockCode || '',

      // Archivos
      evidencePhotos,
      clientSignature
    });

    // 8. Guardar
    await newOrder.save();
    console.log("✅ Orden guardada exitosamente:", newOrder.folio);
    
    res.status(201).json(newOrder);

  } catch (error: any) {
    console.error("💀 Error en servidor:", error);
    
    // Manejo específico de errores de validación de Mongoose
    if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors).map((val: any) => val.message);
        return res.status(400).json({ message: `Datos inválidos: ${messages.join('. ')}` });
    }
    
    // Error genérico
    res.status(500).json({ 
        message: error.message || "Error interno del servidor al procesar la solicitud." 
    });
  }
});

// OBTENER TODAS
router.get('/', async (req, res) => {
  try {
    const orders = await RepairOrder.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ACTUALIZAR (PUT)
router.put('/:id', repairUploads, async (req: any, res: any) => {
  try {
    const body = { ...req.body };
    const updateData: any = { ...body };

    // Reconstruir device si viene aplanado en la edición
    if (body['device[brand]']) {
        updateData.device = {
            brand: body['device[brand]'],
            model: body['device[model]'],
            color: body['device[color]']
        };
    }
    
    // Actualizar datos de seguridad si vienen
    if (body.unlockType) updateData.unlockType = body.unlockType;
    if (body.unlockCode) updateData.unlockCode = body.unlockCode;

    // Procesar nuevas fotos si existen (se agregan a las existentes o reemplazan según lógica deseada)
    // Aquí asumimos reemplazo o gestión simple por ahora
    const files = req.files || {};
    if (files['evidencePhotos']) {
       const newPhotos = files['evidencePhotos'].map((file: any) => `${req.protocol}://${req.get('host')}/uploads/repairs/${file.filename}`);
       updateData.evidencePhotos = newPhotos; 
    }
    
    // Procesar nueva firma si existe
    if (files['clientSignature'] && files['clientSignature'][0]) {
        const file = files['clientSignature'][0];
        updateData.clientSignature = `${req.protocol}://${req.get('host')}/uploads/repairs/${file.filename}`;
    }

    const updatedOrder = await RepairOrder.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(updatedOrder);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

// ELIMINAR
router.delete('/:id', async (req, res) => {
  try {
    await RepairOrder.findByIdAndDelete(req.params.id);
    res.json({ message: 'Orden eliminada' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
});

export default router;