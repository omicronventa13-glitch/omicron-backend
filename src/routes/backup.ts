import { Router } from 'express';
import User from '../models/User';
import Product from '../models/Product';
import Ticket from '../models/Ticket';
import RepairOrder from '../models/RepairOrder';

const router = Router();

// GENERAR RESPALDO COMPLETO
router.get('/download', async (req, res) => {
  try {
    console.log("💾 Generando respaldo de base de datos...");

    // 1. Obtener datos de todas las colecciones
    const users = await User.find();
    const products = await Product.find();
    const tickets = await Ticket.find();
    const repairs = await RepairOrder.find();

    // 2. Empaquetar en un objeto
    const backupData = {
      metadata: {
        date: new Date(),
        version: "3.0",
        system: "Omicron POS"
      },
      collections: {
        users,
        products,
        tickets,
        repairs
      }
    };

    // 3. Convertir a JSON y enviar como archivo descargable
    const fileName = `Omicron_Backup_${new Date().toISOString().split('T')[0]}.json`;
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);
    
    // Enviar formateado (pretty print) para que sea legible si se abre
    res.send(JSON.stringify(backupData, null, 2));

  } catch (error: any) {
    console.error("Error al generar backup:", error);
    res.status(500).json({ message: "Error al generar el archivo de respaldo." });
  }
});

export default router;