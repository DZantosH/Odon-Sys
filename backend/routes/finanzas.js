// backend/routes/finanzas.js

const express = require('express');
const router = express.Router();
const finanzasController = require('../controllers/finanzasController');

// Middleware de validación (opcional - ajusta según tu configuración)
// const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas (opcional)
// router.use(authenticateToken);

// ==========================================
// RUTAS PARA TRANSACCIONES FINANCIERAS
// ==========================================

// GET /api/finanzas/transacciones - Obtener todas las transacciones
router.get('/transacciones', finanzasController.getAllTransacciones);

// GET /api/finanzas/transacciones/:id - Obtener transacción por ID
router.get('/transacciones/:id', finanzasController.getTransaccionById);

// POST /api/finanzas/transacciones - Crear nueva transacción
router.post('/transacciones', finanzasController.createTransaccion);

// PUT /api/finanzas/transacciones/:id - Actualizar transacción
router.put('/transacciones/:id', finanzasController.updateTransaccion);

// DELETE /api/finanzas/transacciones/:id - Eliminar transacción
router.delete('/transacciones/:id', finanzasController.deleteTransaccion);

// GET /api/finanzas/estadisticas - Obtener estadísticas
router.get('/estadisticas', finanzasController.getEstadisticas);

// ==========================================
// RUTAS ADICIONALES (FUTURAS EXPANSIONES)
// ==========================================

// Ruta para obtener categorías disponibles
router.get('/categorias', (req, res) => {
  const categorias = [
    { value: 'tratamientos', label: '🦷 Tratamientos', tipo: 'ingreso' },
    { value: 'materiales', label: '🧪 Materiales', tipo: 'gasto' },
    { value: 'servicios', label: '⚙️ Servicios', tipo: 'gasto' },
    { value: 'equipos', label: '🔧 Equipos', tipo: 'gasto' },
    { value: 'salarios', label: '👥 Salarios', tipo: 'gasto' },
    { value: 'alquiler', label: '🏢 Alquiler', tipo: 'gasto' },
    { value: 'marketing', label: '📢 Marketing', tipo: 'gasto' },
    { value: 'otros', label: '📋 Otros', tipo: 'ambos' }
  ];
  
  res.json({
    success: true,
    data: categorias,
    message: 'Categorías obtenidas correctamente'
  });
});

// Ruta para obtener métodos de pago disponibles
router.get('/metodos-pago', (req, res) => {
  const metodos = [
    { value: 'efectivo', label: '💵 Efectivo' },
    { value: 'tarjeta_debito', label: '💳 Tarjeta de Débito' },
    { value: 'tarjeta_credito', label: '💳 Tarjeta de Crédito' },
    { value: 'transferencia', label: '🏦 Transferencia' },
    { value: 'cheque', label: '📝 Cheque' },
    { value: 'otro', label: '🔄 Otro' }
  ];
  
  res.json({
    success: true,
    data: metodos,
    message: 'Métodos de pago obtenidos correctamente'
  });
});

// Ruta para resumen del dashboard
router.get('/resumen', async (req, res) => {
  try {
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Esta ruta podría combinarse con getEstadisticas pero la separamos para flexibilidad
    let whereClause = '';
    let params = [];
    
    if (fecha_inicio && fecha_fin) {
      whereClause = 'WHERE fecha BETWEEN ? AND ?';
      params = [fecha_inicio, fecha_fin];
    }
    
    const db = require('../config/database');
    
    const query = `
      SELECT 
        tipo,
        SUM(monto) as total,
        COUNT(*) as cantidad,
        AVG(monto) as promedio
      FROM transacciones_financieras 
      ${whereClause}
      GROUP BY tipo
    `;
    
    const [rows] = await db.execute(query, params);
    
    const resumen = {
      ingresos: { total: 0, cantidad: 0, promedio: 0 },
      gastos: { total: 0, cantidad: 0, promedio: 0 },
      balance: 0
    };
    
    rows.forEach(row => {
      if (row.tipo === 'ingreso') {
        resumen.ingresos = {
          total: parseFloat(row.total),
          cantidad: row.cantidad,
          promedio: parseFloat(row.promedio)
        };
      } else if (row.tipo === 'gasto') {
        resumen.gastos = {
          total: parseFloat(row.total),
          cantidad: row.cantidad,
          promedio: parseFloat(row.promedio)
        };
      }
    });
    
    resumen.balance = resumen.ingresos.total - resumen.gastos.total;
    
    res.json({
      success: true,
      data: resumen,
      message: 'Resumen obtenido correctamente'
    });
  } catch (error) {
    console.error('Error al obtener resumen:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Middleware para manejar rutas no encontradas en este módulo
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.originalUrl} no encontrada en el módulo de finanzas`
  });
});

module.exports = router;