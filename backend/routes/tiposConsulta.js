const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const router = express.Router();

// RUTA DE PRUEBA SIN AUTENTICACIÓN (TEMPORAL)
router.get('/test', async (req, res) => {
  try {
    console.log('🧪 [TEST] Probando tipos de consulta sin auth...');
    
    const query = `SELECT id, nombre, descripcion, precio, activo FROM tipos_consulta WHERE activo = 1 ORDER BY nombre ASC`;
    const [rows] = await pool.execute(query);
    
    console.log('🧪 [TEST] Registros encontrados:', rows.length);
    console.log('🧪 [TEST] Datos:', rows);
    
    res.json({
      success: true,
      data: rows,
      total: rows.length,
      message: 'Test exitoso - datos cargados desde DB'
    });
    
  } catch (error) {
    console.error('❌ [TEST] Error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
});

// OBTENER TODOS LOS TIPOS DE CONSULTA - CON DEBUG
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('🔍 [TIPOS CONSULTA] ===========================================');
    console.log('🔍 [TIPOS CONSULTA] Iniciando consulta...');
    console.log('🔍 [TIPOS CONSULTA] Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    
    const query = `SELECT id, nombre, descripcion, precio, activo FROM tipos_consulta WHERE activo = 1 ORDER BY nombre ASC`;
    
    console.log('🔍 [TIPOS CONSULTA] Ejecutando query:', query);
    
    const [rows] = await pool.execute(query);
    
    console.log('✅ [TIPOS CONSULTA] Registros encontrados:', rows.length);
    console.log('✅ [TIPOS CONSULTA] Datos completos:', JSON.stringify(rows, null, 2));
    
    const response = {
      success: true,
      data: rows,
      total: rows.length
    };
    
    console.log('📤 [TIPOS CONSULTA] Enviando respuesta:', JSON.stringify(response, null, 2));
    console.log('🔍 [TIPOS CONSULTA] ===========================================');
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [TIPOS CONSULTA] ERROR COMPLETO:', error);
    console.error('❌ [TIPOS CONSULTA] Error message:', error.message);
    console.error('❌ [TIPOS CONSULTA] Error stack:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;