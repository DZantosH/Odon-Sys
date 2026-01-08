const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const router = express.Router();

// Middleware para verificar acceso
const verifyAccess = (req, res, next) => {
  const userRole = req.user?.rol;
  if (userRole === 'Administrador' || userRole === 'Doctor' || userRole === 'Secretaria') {
    next();
  } else {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol autorizado' 
    });
  }
};

// 🩺 CREAR/INICIAR CONSULTA ACTUAL
router.post('/', verifyToken, verifyAccess, [
  body('paciente_id').isInt({ min: 1 }).withMessage('ID de paciente válido requerido'),
  body('doctor_id').isInt({ min: 1 }).withMessage('ID de doctor válido requerido'),
  body('cita_id').optional().isInt({ min: 1 }).withMessage('ID de cita debe ser válido')
], async (req, res) => {
  try {
    console.log('🩺 [CONSULTA] ========================================');
    console.log('🩺 [CONSULTA] POST /consultas-actuales - Iniciando consulta');
    console.log('🩺 [CONSULTA] Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    console.log('🩺 [CONSULTA] Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [CONSULTA] Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Datos de entrada inválidos'
      });
    }

    const {
      paciente_id,
      doctor_id,
      cita_id,
      motivo_consulta,
      estado = 'en_proceso'
    } = req.body;

    // Verificar si ya existe una consulta activa para este paciente
    const [consultaExistente] = await pool.execute(`
      SELECT id, estado FROM consultas_actuales 
      WHERE paciente_id = ? AND estado IN ('en_proceso', 'pausada')
    `, [paciente_id]);

    if (consultaExistente.length > 0) {
      console.log('⚠️ [CONSULTA] Ya existe consulta activa para paciente:', paciente_id);
      return res.json({
        success: true,
        message: 'Ya existe una consulta activa para este paciente',
        consulta_id: consultaExistente[0].id,
        action: 'continuar'
      });
    }

    // Crear nueva consulta actual
    const insertQuery = `
      INSERT INTO consultas_actuales (
        paciente_id, cita_id, doctor_id, motivo_consulta, 
        estado, fecha_inicio
      ) VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(insertQuery, [
      paciente_id,
      cita_id || null,
      doctor_id,
      motivo_consulta || 'Consulta General',
      estado
    ]);
    
    console.log('✅ [CONSULTA] Consulta actual creada con ID:', result.insertId);

    // Obtener información completa de la consulta creada
    const [consultaCompleta] = await pool.execute(`
      SELECT 
        ca.*,
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as paciente_nombre,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre,
        c.fecha_cita, c.hora_cita, c.tipo_cita
      FROM consultas_actuales ca
      LEFT JOIN pacientes p ON ca.paciente_id = p.id
      LEFT JOIN usuarios u ON ca.doctor_id = u.id
      LEFT JOIN citas c ON ca.cita_id = c.id
      WHERE ca.id = ?
    `, [result.insertId]);

    const response = {
      success: true,
      message: 'Consulta iniciada exitosamente',
      consulta_id: result.insertId,
      data: consultaCompleta[0],
      action: 'nueva'
    };

    console.log('📤 [CONSULTA] Enviando respuesta:', response);
    console.log('🩺 [CONSULTA] ========================================');
    
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ [CONSULTA] ERROR COMPLETO:', error);
    console.error('❌ [CONSULTA] Stack trace:', error.stack);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al iniciar la consulta',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 🩺 OBTENER CONSULTAS ACTUALES (EN PROCESO)
router.get('/activas', verifyToken, verifyAccess, async (req, res) => {
  try {
    console.log('🩺 [CONSULTAS ACTIVAS] Obteniendo consultas en proceso...');
    
    const query = `
      SELECT 
        ca.*,
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as paciente_nombre,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre,
        c.fecha_cita, c.hora_cita, c.tipo_cita,
        p.telefono as paciente_telefono,
        p.fecha_nacimiento as paciente_fecha_nacimiento
      FROM consultas_actuales ca
      LEFT JOIN pacientes p ON ca.paciente_id = p.id
      LEFT JOIN usuarios u ON ca.doctor_id = u.id
      LEFT JOIN citas c ON ca.cita_id = c.id
      WHERE ca.estado IN ('en_proceso', 'pausada')
      ORDER BY ca.fecha_inicio DESC
    `;
    
    const [consultas] = await pool.execute(query);
    
    console.log('✅ [CONSULTAS ACTIVAS] Encontradas:', consultas.length);
    
    res.json({
      success: true,
      data: consultas,
      total: consultas.length
    });
    
  } catch (error) {
    console.error('❌ [CONSULTAS ACTIVAS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener consultas activas'
    });
  }
});

// 🩺 FINALIZAR CONSULTA
router.put('/:id/finalizar', verifyToken, verifyAccess, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🩺 [FINALIZAR] Finalizando consulta ID:', id);
    
    const [result] = await pool.execute(`
      UPDATE consultas_actuales 
      SET estado = 'completada', fecha_fin = NOW()
      WHERE id = ?
    `, [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consulta no encontrada'
      });
    }
    
    console.log('✅ [FINALIZAR] Consulta finalizada exitosamente');
    
    res.json({
      success: true,
      message: 'Consulta finalizada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [FINALIZAR] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al finalizar consulta'
    });
  }
});

module.exports = router;