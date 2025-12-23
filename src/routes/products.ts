import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Product from '../models/Product';

const router = Router();

// --- CONFIGURACIÓN MULTER ---
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)){
    try {
        fs.mkdirSync(uploadDir);
    } catch (err) {
        console.error("Error creando directorio uploads:", err);
    }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// --- RUTAS ---

// OBTENER TODOS
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    const query = category ? { category } : {};
    const products = await Product.find(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error });
  }
});

// CREAR UNO (Con soporte para QR e Imagen)
router.post('/', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Normalizar body
    const body = { ...req.body };
    
    const { model, brand, type, color, category, stock, price, year, image: imageUrl, qrCode } = body;

    let finalImage = imageUrl || '';
    if (req.file) {
      finalImage = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    }

    const newProduct = new Product({
      model,
      brand,
      type,
      color,
      category,
      stock: Number(stock),
      price: Number(price),
      year: Number(year),
      image: finalImage,
      qrCode: qrCode || '' // Guardamos el QR si existe
    });

    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error: any) {
    res.status(500).json({ message: "Error al guardar producto", error: error.message });
  }
});

// ACTUALIZAR (Soporta actualización de Stock, QR e Imagen)
router.put('/:id', upload.single('image'), async (req: Request, res: Response): Promise<void> => {
  try {
    // Multer popula req.body, pero debemos procesarlo con cuidado (clonarlo)
    const body = { ...req.body };
    
    console.log(`🔥 Actualizando producto ${req.params.id}`);

    // Objeto de actualización
    const updateData: any = {
        brand: body.brand,
        model: body.model,
        type: body.type,
        color: body.color,
        category: body.category,
        stock: Number(body.stock), // Asegurar conversión a número para el stock
        price: Number(body.price),
        year: Number(body.year),
        qrCode: body.qrCode // Actualizamos el QR si viene
    };

    // Si se subió una nueva imagen, actualizar la URL
    if (req.file) {
        updateData.image = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    } else if (body.image) {
        // Si se pasó una URL de texto (y no un archivo), usarla
        updateData.image = body.image;
    }

    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    if (!updatedProduct) {
        res.status(404).json({ message: "Producto no encontrado" });
        return;
    }

    res.json(updatedProduct);
  } catch (error: any) {
    console.error("Error al actualizar:", error);
    res.status(500).json({ message: error.message });
  }
});

// ELIMINAR
router.delete('/:id', async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: 'Producto eliminado' });
    } catch (error: any) {
        res.status(500).json({ message: error.message });
    }
});

export default router;