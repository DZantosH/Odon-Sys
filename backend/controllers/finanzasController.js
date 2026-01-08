// backend/controllers/finanzasController.js

const db = require('../config/database'); // Ajusta la ruta según tu configuración

const finanzasController = {
  // Obtener todas las transacciones
  getAllTransacciones: async (req, res) => {
    try {
      const query = `
        SELECT 
          id,
          tipo,
          monto,
          categoria,
          descripcion,
          metodo_pago,
          fecha,
          created_at,
          updated_at
        FROM transacciones_financieras 
        ORDER BY fecha DESC, created_at DESC
      `;
      
      const [rows] = await db.execute(query);
      
      res.json({
        success: true,
        data: rows,
        message: 'Transacciones obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error al obtener transacciones:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener transacción por ID
  getTransaccionById: async (req, res) => {
    try {
      const { id } = req.params;
      
      const query = `
        SELECT 
          id,
          tipo,
          monto,
          categoria,
          descripcion,
          metodo_pago,
          fecha,
          created_at,
          updated_at
        FROM transacciones_financieras 
        WHERE id = ?
      `;
      
      const [rows] = await db.execute(query, [id]);
      
      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }
      
      res.json({
        success: true,
        data: rows[0],
        message: 'Transacción obtenida correctamente'
      });
    } catch (error) {
      console.error('Error al obtener transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Crear nueva transacción
  createTransaccion: async (req, res) => {
    try {
      const { tipo, monto, categoria, descripcion, metodo_pago, fecha } = req.body;
      
      // Validaciones básicas
      if (!tipo || !monto || !categoria || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'Los campos tipo, monto, categoria y fecha son obligatorios'
        });
      }
      
      if (!['ingreso', 'gasto'].includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo debe ser "ingreso" o "gasto"'
        });
      }
      
      if (monto <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }
      
      const query = `
        INSERT INTO transacciones_financieras 
        (tipo, monto, categoria, descripcion, metodo_pago, fecha) 
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const [result] = await db.execute(query, [
        tipo,
        parseFloat(monto),
        categoria,
        descripcion || null,
        metodo_pago || null,
        fecha
      ]);
      
      // Obtener la transacción recién creada
      const [newTransaction] = await db.execute(
        'SELECT * FROM transacciones_financieras WHERE id = ?',
        [result.insertId]
      );
      
      res.status(201).json({
        success: true,
        data: newTransaction[0],
        message: 'Transacción creada correctamente'
      });
    } catch (error) {
      console.error('Error al crear transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Actualizar transacción
  updateTransaccion: async (req, res) => {
    try {
      const { id } = req.params;
      const { tipo, monto, categoria, descripcion, metodo_pago, fecha } = req.body;
      
      // Verificar que la transacción existe
      const [existingTransaction] = await db.execute(
        'SELECT id FROM transacciones_financieras WHERE id = ?',
        [id]
      );
      
      if (existingTransaction.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }
      
      // Validaciones básicas
      if (!tipo || !monto || !categoria || !fecha) {
        return res.status(400).json({
          success: false,
          message: 'Los campos tipo, monto, categoria y fecha son obligatorios'
        });
      }
      
      if (!['ingreso', 'gasto'].includes(tipo)) {
        return res.status(400).json({
          success: false,
          message: 'El tipo debe ser "ingreso" o "gasto"'
        });
      }
      
      if (monto <= 0) {
        return res.status(400).json({
          success: false,
          message: 'El monto debe ser mayor a 0'
        });
      }
      
      const query = `
        UPDATE transacciones_financieras 
        SET tipo = ?, monto = ?, categoria = ?, descripcion = ?, metodo_pago = ?, fecha = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      await db.execute(query, [
        tipo,
        parseFloat(monto),
        categoria,
        descripcion || null,
        metodo_pago || null,
        fecha,
        id
      ]);
      
      // Obtener la transacción actualizada
      const [updatedTransaction] = await db.execute(
        'SELECT * FROM transacciones_financieras WHERE id = ?',
        [id]
      );
      
      res.json({
        success: true,
        data: updatedTransaction[0],
        message: 'Transacción actualizada correctamente'
      });
    } catch (error) {
      console.error('Error al actualizar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Eliminar transacción
  deleteTransaccion: async (req, res) => {
    try {
      const { id } = req.params;
      
      // Verificar que la transacción existe
      const [existingTransaction] = await db.execute(
        'SELECT id FROM transacciones_financieras WHERE id = ?',
        [id]
      );
      
      if (existingTransaction.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transacción no encontrada'
        });
      }
      
      await db.execute('DELETE FROM transacciones_financieras WHERE id = ?', [id]);
      
      res.json({
        success: true,
        message: 'Transacción eliminada correctamente'
      });
    } catch (error) {
      console.error('Error al eliminar transacción:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },

  // Obtener estadísticas financieras
  getEstadisticas: async (req, res) => {
    try {
      const { fecha_inicio, fecha_fin } = req.query;
      
      let whereClause = '';
      let params = [];
      
      if (fecha_inicio && fecha_fin) {
        whereClause = 'WHERE fecha BETWEEN ? AND ?';
        params = [fecha_inicio, fecha_fin];
      }
      
      // Totales por tipo
      const totalesQuery = `
        SELECT 
          tipo,
          SUM(monto) as total,
          COUNT(*) as cantidad
        FROM transacciones_financieras 
        ${whereClause}
        GROUP BY tipo
      `;
      
      // Totales por categoría
      const categoriasQuery = `
        SELECT 
          categoria,
          tipo,
          SUM(monto) as total,
          COUNT(*) as cantidad
        FROM transacciones_financieras 
        ${whereClause}
        GROUP BY categoria, tipo
        ORDER BY categoria, tipo
      `;
      
      // Totales mensuales
      const mensualesQuery = `
        SELECT 
          DATE_FORMAT(fecha, '%Y-%m') as mes,
          tipo,
          SUM(monto) as total
        FROM transacciones_financieras 
        ${whereClause}
        GROUP BY DATE_FORMAT(fecha, '%Y-%m'), tipo
        ORDER BY mes
      `;
      
      const [totales] = await db.execute(totalesQuery, params);
      const [categorias] = await db.execute(categoriasQuery, params);
      const [mensuales] = await db.execute(mensualesQuery, params);
      
      res.json({
        success: true,
        data: {
          totales,
          categorias,
          mensuales
        },
        message: 'Estadísticas obtenidas correctamente'
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  }
};

module.exports = finanzasController;