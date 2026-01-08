// Backend completo - routes/pacientes.js
// Con soporte completo para avatars y todos los endpoints necesarios

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// ===== CONFIGURACIÓN DE MULTER PARA AVATARS =====
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Crear directorio si no existe
    const uploadDir = 'uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`📁 Directorio creado: ${uploadDir}`);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generar nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = path.extname(file.originalname);
    const filename = `avatar-${req.params.pacienteId || req.body.paciente_id}-${uniqueSuffix}${extension}`;
    cb(null, filename);
  }
});

// Filtro para validar tipos de archivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  console.log('🔍 Validando archivo:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Tipo de archivo no válido. Solo se permiten imágenes (JPG, PNG, GIF, WEBP)');
    error.code = 'INVALID_FILE_TYPE';
    cb(error, false);
  }
};

// Configuración de multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo para avatars
    files: 1 // Solo un archivo
  }
});

// Middleware para verificar acceso a pacientes
const verifyPacientesAccess = (req, res, next) => {
  try {
    const userRole = req.user?.rol || req.user?.role;
    console.log('🔐 Verificando acceso - Usuario:', req.user?.nombre, 'Rol:', userRole);
    
    if (userRole === 'Administrador' || userRole === 'Doctor' || userRole === 'Secretaria') {
      next();
    } else {
      console.error('❌ Acceso denegado - Rol no autorizado:', userRole);
      return res.status(403).json({ 
        error: `Acceso denegado. Rol actual: ${userRole}. Se requiere: Administrador, Doctor o Secretaria` 
      });
    }
  } catch (error) {
    console.error('❌ Error en verifyPacientesAccess:', error);
    return res.status(500).json({ error: 'Error de autorización' });
  }
};

// ===== ENDPOINTS PARA AVATARS =====

// POST /:pacienteId/avatar - Subir avatar
router.post('/:id/avatar', verifyToken, verifyPacientesAccess, (req, res, next) => {
  console.log('📸 Iniciando upload de avatar para paciente:', req.params.pacienteId);
  
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      console.error('❌ Error en multer:', err);
      
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'El archivo es demasiado grande. Máximo permitido: 5MB',
          code: 'FILE_TOO_LARGE'
        });
      }
      
      if (err.code === 'INVALID_FILE_TYPE') {
        return res.status(400).json({
          success: false,
          message: err.message,
          code: 'INVALID_FILE_TYPE'
        });
      }
      
      return res.status(400).json({
        success: false,
        message: 'Error al procesar el archivo',
        error: err.message
      });
    }
    
    next();
  });
}, async (req, res) => {
  try {
    const { id: pacienteId } = req.params;
    
    console.log('📸 Procesando upload de avatar:', {
      pacienteId,
      file: req.file ? {
        originalname: req.file.originalname,
        filename: req.file.filename,
        size: req.file.size,
        mimetype: req.file.mimetype,
        path: req.file.path
      } : 'No file received'
    });

    // Validar que se recibió un archivo
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se recibió ningún archivo'
      });
    }

    // Validar que el paciente existe
    const pacienteQuery = 'SELECT id, foto_avatar FROM pacientes WHERE id = ? AND activo = 1';
    const [pacienteResults] = await pool.execute(pacienteQuery, [pacienteId]);
    
    if (pacienteResults.length === 0) {
      // Eliminar archivo subido si el paciente no existe
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.warn('⚠️ No se pudo eliminar archivo temporal:', unlinkError.message);
      }
      
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    const paciente = pacienteResults[0];
    
    // Eliminar foto anterior si existe
    if (paciente.foto_avatar) {
      const oldFilePath = path.join(__dirname, '..', paciente.foto_avatar);
      if (fs.existsSync(oldFilePath)) {
        try {
          fs.unlinkSync(oldFilePath);
          console.log('🗑️ Foto anterior eliminada:', oldFilePath);
        } catch (error) {
          console.warn('⚠️ No se pudo eliminar la foto anterior:', error.message);
        }
      }
    }

    // Construir la ruta relativa para guardar en la BD
    const relativePath = `uploads/avatars/${req.file.filename}`;
    
    // Actualizar la base de datos con la nueva foto
    const updateQuery = `
      UPDATE pacientes 
      SET foto_avatar = ?, 
          fecha_actualizacion = CURRENT_TIMESTAMP 
      WHERE id = ?
    `;
    
    await pool.execute(updateQuery, [relativePath, pacienteId]);
    
    console.log('✅ Avatar actualizado en BD:', {
      pacienteId,
      filename: req.file.filename,
      path: relativePath,
      size: req.file.size
    });

    // Respuesta exitosa
    res.json({
  success: true,
  message: 'Avatar actualizado correctamente',
  data: {
    foto_avatar: relativePath, // uploads/avatars/filename.jpg
    avatar_url: `/${relativePath}`, // /uploads/avatars/filename.jpg
    filename: req.file.filename,
    size: req.file.size,
    mimetype: req.file.mimetype,
    paciente_id: pacienteId,
    // 🔥 AGREGAR URL COMPLETA PARA DEBUG
    full_url: `${req.protocol}://${req.get('host')}/${relativePath}`
  }
});

  } catch (error) {
    console.error('❌ Error al subir avatar:', error);
    
    // Eliminar archivo si hubo error en la BD
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
        console.log('🗑️ Archivo temporal eliminado tras error');
      } catch (unlinkError) {
        console.error('❌ Error al eliminar archivo tras error:', unlinkError);
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir avatar',
      error: error.message
    });
  }
});

// DELETE /:pacienteId/avatar - Eliminar avatar
router.delete('/:pacienteId/avatar', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log('🗑️ Eliminando avatar para paciente:', pacienteId);
    
    // Obtener la foto actual
    const [pacienteResults] = await pool.execute(
      'SELECT foto_avatar FROM pacientes WHERE id = ? AND activo = 1',
      [pacienteId]
    );
    
    if (pacienteResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    const paciente = pacienteResults[0];
    
    // Eliminar archivo físico si existe
    if (paciente.foto_avatar) {
      const filePath = path.join(__dirname, '..', paciente.foto_avatar);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
          console.log('🗑️ Archivo físico eliminado:', filePath);
        } catch (error) {
          console.warn('⚠️ No se pudo eliminar archivo físico:', error.message);
        }
      } else {
        console.log('ℹ️ Archivo físico no encontrado:', filePath);
      }
    }
    
    // Actualizar BD para remover la referencia
    await pool.execute(
      'UPDATE pacientes SET foto_avatar = NULL, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      [pacienteId]
    );
    
    console.log('✅ Avatar eliminado de BD para paciente:', pacienteId);
    
    res.json({
      success: true,
      message: 'Avatar eliminado correctamente',
      data: {
        paciente_id: pacienteId,
        archivo_eliminado: paciente.foto_avatar || null
      }
    });
    
  } catch (error) {
    console.error('❌ Error al eliminar avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /:pacienteId/avatar - Obtener información del avatar
router.get('/:pacienteId/avatar', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log('🔍 Obteniendo info de avatar para paciente:', pacienteId);
    
    const [pacienteResults] = await pool.execute(
      'SELECT foto_avatar FROM pacientes WHERE id = ? AND activo = 1',
      [pacienteId]
    );
    
    if (pacienteResults.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }
    
    const paciente = pacienteResults[0];
    
    res.json({
      success: true,
      data: {
        paciente_id: pacienteId,
        tiene_avatar: !!paciente.foto_avatar,
        foto_avatar: paciente.foto_avatar,
        avatar_url: paciente.foto_avatar ? `/uploads/avatars/${path.basename(paciente.foto_avatar)}` : null
      }
    });
    
  } catch (error) {
    console.error('❌ Error al obtener avatar:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// ===== ENDPOINTS PRINCIPALES =====

// 🧪 ENDPOINT DE PRUEBA
router.get('/test', verifyToken, async (req, res) => {
  try {
    console.log('🧪 Test endpoint - Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    
    const [testResult] = await pool.execute('SELECT 1 as test_connection, NOW() as server_time');
    
    res.json({
      success: true,
      message: 'Backend funcionando correctamente',
      user: {
        id: req.user?.id,
        nombre: req.user?.nombre,
        rol: req.user?.rol
      },
      database: testResult[0],
      timestamp: new Date().toISOString(),
      features: {
        avatar_upload: true,
        avatar_delete: true,
        avatar_info: true,
        static_files: true
      }
    });
    
  } catch (error) {
    console.error('❌ Error en test endpoint:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 🔍 ENDPOINT PARA VERIFICAR ESTRUCTURA
router.get('/estructura', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    console.log('🔍 Verificando estructura de tabla pacientes...');
    
    // Obtener estructura de la tabla
    const [columns] = await pool.execute('DESCRIBE pacientes');
    
    // Contar registros
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM pacientes');
    
    // Contar registros con avatars
    const [avatarStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_activos,
        SUM(CASE WHEN estado = 'Temporal' THEN 1 ELSE 0 END) as total_temporales,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as total_permanentes,
        SUM(CASE WHEN foto_avatar IS NOT NULL THEN 1 ELSE 0 END) as con_avatar,
        SUM(CASE WHEN foto_avatar IS NULL THEN 1 ELSE 0 END) as sin_avatar
      FROM pacientes 
      WHERE activo = 1
    `);
    
    res.json({
      success: true,
      tabla_existe: true,
      columnas: columns,
      estadisticas: avatarStats[0],
      total_registros: count[0].total,
      avatar_features: {
        columna_foto_avatar: columns.some(col => col.Field === 'foto_avatar'),
        upload_endpoint: 'POST /api/pacientes/:id/avatar',
        delete_endpoint: 'DELETE /api/pacientes/:id/avatar',
        info_endpoint: 'GET /api/pacientes/:id/avatar',
        static_files: 'GET /uploads/avatars/:filename'
      }
    });
    
  } catch (error) {
    console.error('❌ Error verificando estructura:', error);
    res.status(500).json({ 
      error: 'Error verificando estructura de tabla',
      details: error.message 
    });
  }
});

// 🔍 BUSCAR PACIENTES
router.get('/buscar', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ error: 'El término de búsqueda debe tener al menos 2 caracteres' });
    }
    
    const searchTerm = `%${q.trim()}%`;
    const query = `
      SELECT 
        id,
        COALESCE(nombre, '') as nombre,
        COALESCE(apellido_paterno, '') as apellido_paterno,
        COALESCE(apellido_materno, '') as apellido_materno,
        fecha_nacimiento,
        telefono,
        COALESCE(estado, 'Activo') as estado,
        id as matricula,
        foto_avatar,
        CASE 
          WHEN fecha_nacimiento = '1900-01-01' OR fecha_nacimiento IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
        END as edad_calculada
      FROM pacientes 
      WHERE activo = 1 AND (
        nombre LIKE ? OR 
        apellido_paterno LIKE ? OR 
        apellido_materno LIKE ? OR
        telefono LIKE ? OR
        id LIKE ? OR
        CONCAT(nombre, ' ', apellido_paterno, ' ', apellido_materno) LIKE ?
      )
      ORDER BY 
        CASE WHEN COALESCE(estado, 'Activo') = 'Temporal' THEN 0 ELSE 1 END,
        apellido_paterno, apellido_materno, nombre
      LIMIT 20
    `;
    
    const [results] = await pool.execute(query, [
      searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm
    ]);
    
    // Procesar resultados para incluir información de avatar
    const processedResults = results.map(paciente => ({
      ...paciente,
      edad: paciente.edad_calculada || 'N/A',
      tiene_avatar: !!paciente.foto_avatar,
      avatar_url: paciente.foto_avatar ? `/uploads/avatars/${path.basename(paciente.foto_avatar)}` : null
    }));
    
    res.json(processedResults);
    
  } catch (err) {
    console.error('❌ Error en búsqueda de pacientes:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 📋 HISTORIAL INDIVIDUAL DE PACIENTE
router.get('/:id/historial', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id: pacienteId } = req.params;
    
    console.log('📋 GET /pacientes/:id/historial - Paciente ID:', pacienteId);
    console.log('👤 Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    
    // 🔥 QUERY CORREGIDO - INCLUIR TODOS LOS CAMPOS NECESARIOS
    const pacienteQuery = `
      SELECT 
        id,
        COALESCE(nombre, '') as nombre,
        COALESCE(apellido_paterno, '') as apellido_paterno,
        COALESCE(apellido_materno, '') as apellido_materno,
        telefono,
        correo_electronico,
        sexo,
        fecha_nacimiento,
        
        -- 🔥 CAMPOS QUE FALTABAN:
        calle_numero,
        numero_seguridad_social,
        matricula,
        lugar_nacimiento,
        lugar_procedencia,
        grupo_etnico,
        religion,
        rfc,
        derecho_habiente,
        nombre_institucion,
        observaciones_internas,
        
        -- Campos de estado
        activo,
        COALESCE(estado, 'Activo') as estado,
        foto_avatar,
        
        -- Edad calculada
        CASE 
          WHEN fecha_nacimiento = '1900-01-01' OR fecha_nacimiento IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
        END as edad_calculada,
        
        -- Fechas de auditoría
        fecha_creacion,
        fecha_actualizacion
        
      FROM pacientes 
      WHERE id = ? AND activo = 1
    `;
    
    const [pacienteResult] = await pool.execute(pacienteQuery, [pacienteId]);
    
    if (pacienteResult.length === 0) {
      console.log('❌ Paciente no encontrado para ID:', pacienteId);
      return res.status(404).json({ 
        error: 'Paciente no encontrado',
        pacienteId: pacienteId
      });
    }
    
    // 🔥 CONSTRUIR OBJETO PACIENTE CON TODOS LOS CAMPOS
    const pacienteRaw = pacienteResult[0];
    const paciente = {
      // Campos básicos
      id: pacienteRaw.id,
      nombre: pacienteRaw.nombre,
      apellido_paterno: pacienteRaw.apellido_paterno,
      apellido_materno: pacienteRaw.apellido_materno,
      fecha_nacimiento: pacienteRaw.fecha_nacimiento,
      sexo: pacienteRaw.sexo,
      
      // Contacto
      telefono: pacienteRaw.telefono,
      correo_electronico: pacienteRaw.correo_electronico,
      
      // 🔥 DIRECCIÓN - MAPEAR CORRECTAMENTE
      direccion: pacienteRaw.calle_numero, // Para el frontend
      calle_numero: pacienteRaw.calle_numero, // Para consistencia
      
      // 🔥 CAMPOS QUE ESTABAN FALTANDO
      numero_seguridad_social: pacienteRaw.numero_seguridad_social,
      matricula: pacienteRaw.matricula,
      lugar_nacimiento: pacienteRaw.lugar_nacimiento,
      lugar_procedencia: pacienteRaw.lugar_procedencia,
      grupo_etnico: pacienteRaw.grupo_etnico,
      religion: pacienteRaw.religion,
      rfc: pacienteRaw.rfc,
      derecho_habiente: Boolean(pacienteRaw.derecho_habiente),
      nombre_institucion: pacienteRaw.nombre_institucion,
      observaciones_internas: pacienteRaw.observaciones_internas,
      
      // Estados y metadatos
      activo: pacienteRaw.activo,
      estado: pacienteRaw.estado,
      tipo_paciente: pacienteRaw.estado === 'Temporal' ? 'Temporal' : 'Activo',
      edad: pacienteRaw.edad_calculada || 'N/A',
      es_temporal: pacienteRaw.estado === 'Temporal',
      
      // Avatar
      foto_avatar: pacienteRaw.foto_avatar,
      tiene_avatar: !!pacienteRaw.foto_avatar,
      avatar_url: pacienteRaw.foto_avatar ? `/uploads/avatars/${path.basename(pacienteRaw.foto_avatar)}` : null,
      
      // Fechas
      fecha_registro: pacienteRaw.fecha_creacion,
      fecha_actualizacion: pacienteRaw.fecha_actualizacion
    };
    
    // 🔥 DEBUG MEJORADO
    console.log('✅ Paciente encontrado y procesado:');
    console.log('  - Nombre:', paciente.nombre, paciente.apellido_paterno);
    console.log('  - Dirección (calle_numero):', JSON.stringify(paciente.calle_numero));
    console.log('  - Dirección (direccion):', JSON.stringify(paciente.direccion));
    console.log('  - Seguridad Social:', JSON.stringify(paciente.numero_seguridad_social));
    console.log('  - Matrícula:', JSON.stringify(paciente.matricula));
    console.log('  - RFC:', JSON.stringify(paciente.rfc));
    console.log('  - Avatar:', paciente.tiene_avatar);
    
    // Obtener historial clínico (sin cambios)
    let historial = [];
    
    try {
      const [historialResult] = await pool.execute(`
        SELECT 
          hc.id,
          hc.fecha_consulta,
          hc.diagnostico,
          hc.tratamiento,
          hc.medicamentos,
          hc.observaciones,
          hc.motivo_consulta_texto,
          hc.plan_tratamiento,
          hc.evolucion,
          hc.estado,
          hc.version,
          hc.fecha_creacion,
          
          -- Campos JSON completos
          hc.motivo_consulta,
          hc.antecedentes_heredo_familiares,
          hc.antecedentes_personales_no_patologicos,
          hc.antecedentes_personales_patologicos,
          hc.examen_extrabucal,
          hc.examen_intrabucal,
          hc.auxiliares_diagnostico,
          
          -- Información del doctor
          CONCAT(COALESCE(u.nombre, ''), ' ', COALESCE(u.apellido_paterno, '')) as doctor_nombre,
          u.especialidad,
          
          -- Información de la cita
          c.tipo_cita,
          c.precio
        FROM historial_clinico hc
        LEFT JOIN usuarios u ON hc.doctor_id = u.id
        LEFT JOIN citas c ON hc.cita_id = c.id
        WHERE hc.paciente_id = ?
        ORDER BY hc.fecha_consulta DESC
      `, [pacienteId]);
      
      historial = historialResult;
      console.log('📊 Registros de historial encontrados:', historial.length);
      
    } catch (historialError) {
      console.error('❌ Error al obtener historial clínico:', historialError.message);
      historial = [];
    }
    
    const response = {
      paciente: paciente,
      historial: historial,
      total_registros: historial.length,
      paciente_id: pacienteId,
      avatar_info: {
        tiene_avatar: paciente.tiene_avatar,
        avatar_url: paciente.avatar_url,
        upload_endpoint: `/api/pacientes/${pacienteId}/avatar`
      }
    };
    
    console.log('✅ Respuesta enviada con campos completos:', {
      paciente: paciente.nombre,
      registros_historial: historial.length,
      tiene_avatar: paciente.tiene_avatar,
      direccion_incluida: !!paciente.calle_numero,
      seguridad_social_incluida: !!paciente.numero_seguridad_social,
      matricula_incluida: !!paciente.matricula
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ ERROR en GET /pacientes/:id/historial:', error);
    res.status(500).json({ 
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : 'Error interno'
    });
  }
});

// ✅ ENDPOINT PRINCIPAL PARA LISTAR TODOS LOS PACIENTES
router.get('/', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    console.log('📋 GET /pacientes - Iniciando...');
    console.log('👤 Usuario:', req.user?.nombre, 'ID:', req.user?.id, 'Rol:', req.user?.rol);
    
    // Query actualizada con las nuevas columnas requeridas
    const query = `
      SELECT 
        id,
        COALESCE(nombre, '') as nombre,
        COALESCE(apellido_paterno, '') as apellido_paterno,
        COALESCE(apellido_materno, '') as apellido_materno,
        fecha_nacimiento,
        telefono,
        correo_electronico,
        COALESCE(estado, 'Activo') as estado,
        fecha_creacion as fecha_registro,
        activo,
        sexo,
        rfc,
        matricula,
        foto_avatar,
        
        -- Calcular edad en la consulta
        CASE 
          WHEN fecha_nacimiento = '1900-01-01' OR fecha_nacimiento IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
        END as edad_calculada,
        
        -- Determinar tipo de paciente
        CASE 
          WHEN COALESCE(estado, 'Activo') = 'Temporal' THEN 'Temporal'
          ELSE 'Activo'
        END as tipo_paciente,
        
        -- Nombre completo para búsquedas
        CONCAT(
          COALESCE(nombre, ''), 
          CASE WHEN COALESCE(apellido_paterno, '') != '' THEN CONCAT(' ', apellido_paterno) ELSE '' END,
          CASE WHEN COALESCE(apellido_materno, '') != '' THEN CONCAT(' ', apellido_materno) ELSE '' END
        ) as nombre_completo
        
      FROM pacientes 
      WHERE activo = 1
      ORDER BY 
        -- Temporales primero
        CASE WHEN COALESCE(estado, 'Activo') = 'Temporal' THEN 0 ELSE 1 END,
        -- Luego por apellido paterno
        apellido_paterno,
        apellido_materno,
        nombre
      LIMIT 1000
    `;
    
    console.log('🔍 Ejecutando query actualizada...');
    const [rows] = await pool.execute(query);
    
    console.log('✅ Query ejecutada exitosamente');
    console.log('📊 Pacientes encontrados:', rows.length);
    
    if (rows.length === 0) {
      console.log('ℹ️ No se encontraron pacientes activos');
      return res.json([]);
    }
    
    // Procesar resultados para formato esperado por el frontend
    const pacientesProcesados = rows.map(paciente => {
      return {
        ...paciente,
        edad: paciente.edad_calculada || 'N/A',
        es_temporal: paciente.estado === 'Temporal',
        tiene_avatar: !!paciente.foto_avatar,
        avatar_url: paciente.foto_avatar ? `/uploads/avatars/${path.basename(paciente.foto_avatar)}` : null
      };
    });
    
    console.log('📝 Primer paciente procesado:', {
      id: pacientesProcesados[0]?.id,
      nombre: pacientesProcesados[0]?.nombre,
      apellido_paterno: pacientesProcesados[0]?.apellido_paterno,
      apellido_materno: pacientesProcesados[0]?.apellido_materno,
      edad: pacientesProcesados[0]?.edad,
      telefono: pacientesProcesados[0]?.telefono,
      matricula: pacientesProcesados[0]?.matricula,
      tipo_paciente: pacientesProcesados[0]?.tipo_paciente,
      estado: pacientesProcesados[0]?.estado,
      tiene_avatar: pacientesProcesados[0]?.tiene_avatar
    });
    
    // Estadísticas para logs
    const temporales = pacientesProcesados.filter(p => p.es_temporal).length;
    const activos = pacientesProcesados.filter(p => !p.es_temporal).length;
    const conAvatar = pacientesProcesados.filter(p => p.foto_avatar).length;
    
    console.log('📊 Estadísticas:', { total: rows.length, temporales, activos, con_avatar: conAvatar });
    
    res.status(200).json(pacientesProcesados);
    
  } catch (error) {
    console.error('❌ ERROR COMPLETO en GET /pacientes:');
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    let errorMessage = 'Error interno del servidor';
    let errorCode = 'UNKNOWN_ERROR';
    
    if (error.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Tabla pacientes no existe en la base de datos';
      errorCode = 'TABLE_NOT_EXISTS';
    } else if (error.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Error en campos de la tabla pacientes: ' + error.message;
      errorCode = 'FIELD_ERROR';
    } else if (error.code === 'ECONNREFUSED') {
      errorMessage = 'No se puede conectar a la base de datos';
      errorCode = 'DB_CONNECTION_ERROR';
    }
    
    res.status(500).json({
      error: errorMessage,
      code: errorCode,
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack,
        errno: error.errno
      } : undefined
    });
  }
});

// 👤 OBTENER PACIENTE POR ID
router.get('/:id', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('👤 GET /pacientes/:id - ID:', id);
    
    const query = `
      SELECT 
        id,
        matricula,
        nombre,
        apellido_paterno,
        apellido_materno,
        fecha_nacimiento,
        sexo,
        telefono,
        correo_electronico,
        calle_numero,
        numero_seguridad_social,
        lugar_nacimiento,
        lugar_procedencia,
        grupo_etnico,
        religion,
        rfc,
        derecho_habiente,
        nombre_institucion,
        observaciones_internas,
        activo,
        COALESCE(estado, 'Activo') as estado,
        foto_avatar,
        CASE 
          WHEN fecha_nacimiento = '1900-01-01' OR fecha_nacimiento IS NULL THEN NULL
          ELSE TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
        END as edad_calculada,
        fecha_creacion,
        fecha_actualizacion
      FROM pacientes 
      WHERE id = ? AND activo = 1
    `;
    
    const [results] = await pool.execute(query, [id]);
    
    if (results.length === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    const paciente = {
      ...results[0],
      edad: results[0].edad_calculada || 'N/A',
      es_temporal: results[0].estado === 'Temporal',
      tiene_avatar: !!results[0].foto_avatar,
      avatar_url: results[0].foto_avatar ? `/uploads/avatars/${path.basename(results[0].foto_avatar)}` : null
    };
    
    res.json(paciente);
    
  } catch (error) {
    console.error('❌ Error al obtener paciente:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ➕ CREAR NUEVO PACIENTE
router.post('/', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const {
      nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
      lugar_nacimiento, lugar_procedencia, telefono, correo_electronico,
      calle_numero, sexo, grupo_etnico, religion, rfc,
      derecho_habiente, nombre_institucion, numero_seguridad_social,
      observaciones_internas, estado
    } = req.body;
    
    // Validaciones básicas
    if (!nombre || !apellido_paterno || !sexo) {
      return res.status(400).json({
        error: 'Campos requeridos: nombre, apellido_paterno, sexo'
      });
    }
    
    const query = `
      INSERT INTO pacientes (
        nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        lugar_nacimiento, lugar_procedencia, telefono, correo_electronico,
        calle_numero, sexo, grupo_etnico, religion, rfc, numero_seguridad_social,
        derecho_habiente, nombre_institucion, observaciones_internas, activo, estado
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `;
    
    const values = [
      nombre, 
      apellido_paterno, 
      apellido_materno || null, 
      fecha_nacimiento || '1900-01-01',
      lugar_nacimiento || null, 
      lugar_procedencia || null, 
      telefono || null,
      correo_electronico || null, 
      calle_numero || null, 
      sexo,
      grupo_etnico || null, 
      religion || null, 
      rfc || null,
      numero_seguridad_social || null,
      derecho_habiente || false, 
      nombre_institucion || null,
      observaciones_internas || null,
      estado || 'Activo'
    ];
    
    const [result] = await pool.execute(query, values);
    
    console.log('✅ Paciente creado con ID:', result.insertId);
    
    res.status(201).json({
      message: 'Paciente creado exitosamente',
      id: result.insertId,
      matricula: result.insertId,
      tipo_paciente: estado || 'Activo'
    });
    
  } catch (err) {
    console.error('❌ Error al crear paciente:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ✏️ ACTUALIZAR PACIENTE - VERSIÓN CORREGIDA
router.put('/:id', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    console.log('✏️ === INICIO DEBUG ACTUALIZACIÓN BACKEND ===');
    console.log('📋 ID del paciente:', id);
    console.log('📝 Datos recibidos:', JSON.stringify(updateData, null, 2));
    console.log('👤 Usuario que actualiza:', req.user?.nombre, 'ID:', req.user?.id);
    
    // Verificar que el paciente existe
    const [existing] = await pool.execute(
      'SELECT * FROM pacientes WHERE id = ? AND activo = 1', 
      [id]
    );
    
    if (existing.length === 0) {
      console.error('❌ Paciente no encontrado:', id);
      return res.status(404).json({ 
        success: false,
        error: 'Paciente no encontrado' 
      });
    }
    
    console.log('✅ Paciente encontrado:', existing[0].nombre, existing[0].apellido_paterno);
    
    // 🔥 FUNCIÓN PARA PROCESAR FECHA DE NACIMIENTO
    const procesarFechaNacimiento = (fechaInput) => {
      console.log('📅 Procesando fecha:', fechaInput, typeof fechaInput);
      
      if (!fechaInput || fechaInput === '' || fechaInput === 'undefined' || fechaInput === 'null') {
        console.log('📅 Fecha vacía, usando fecha por defecto');
        return '1900-01-01';
      }
      
      if (typeof fechaInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaInput)) {
        console.log('📅 Fecha ya en formato correcto:', fechaInput);
        return fechaInput;
      }
      
      try {
        const fecha = new Date(fechaInput);
        if (isNaN(fecha.getTime())) {
          console.warn('⚠️ Fecha inválida, usando fecha por defecto');
          return '1900-01-01';
        }
        
        const año = fecha.getFullYear();
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const dia = String(fecha.getDate()).padStart(2, '0');
        
        const fechaFormateada = `${año}-${mes}-${dia}`;
        console.log('📅 Fecha formateada:', fechaFormateada);
        return fechaFormateada;
        
      } catch (error) {
        console.error('❌ Error al procesar fecha:', error);
        return '1900-01-01';
      }
    };
    
    // 🔥 FILTRAR Y VALIDAR CAMPOS PERMITIDOS
    const camposPermitidos = [
      'nombre', 'apellido_paterno', 'apellido_materno', 'fecha_nacimiento',
      'lugar_nacimiento', 'lugar_procedencia', 'telefono', 'correo_electronico',
      'calle_numero', 'sexo', 'grupo_etnico', 'religion', 'rfc',
      'derecho_habiente', 'nombre_institucion', 'numero_seguridad_social',
      'observaciones_internas'
    ];
    
    const camposActualizar = {};
    
    camposPermitidos.forEach(campo => {
      if (updateData.hasOwnProperty(campo)) {
        let valor = updateData[campo];
        
        // Procesar fecha especialmente
        if (campo === 'fecha_nacimiento') {
          valor = procesarFechaNacimiento(valor);
        }
        // Procesar derecho habiente
        else if (campo === 'derecho_habiente') {
          valor = Boolean(valor) ? 1 : 0;
        }
        // Limpiar strings vacíos a null
        else if (typeof valor === 'string') {
          valor = valor.trim();
          if (valor === '') {
            valor = null;
          }
        }
        // Si es explícitamente null, mantenerlo
        else if (valor === null || valor === undefined) {
          valor = null;
        }
        
        camposActualizar[campo] = valor;
        console.log(`🔧 Campo ${campo}:`, updateData[campo], '->', valor);
      }
    });
    
    console.log('📝 Campos finales a actualizar:', JSON.stringify(camposActualizar, null, 2));
    
    if (Object.keys(camposActualizar).length === 0) {
      console.warn('⚠️ No hay campos válidos para actualizar');
      return res.status(400).json({ 
        success: false,
        error: 'No hay campos válidos para actualizar',
        camposRecibidos: Object.keys(updateData)
      });
    }

    // 🔥 CONSTRUIR QUERY DINÁMICO
    const setClauses = [];
    const values = [];
    
    Object.entries(camposActualizar).forEach(([campo, valor]) => {
      setClauses.push(`${campo} = ?`);
      values.push(valor);
    });
    
    // Agregar campos de auditoría
    setClauses.push('actualizado_por = ?', 'fecha_actualizacion = NOW()');
    values.push(req.user?.id || null, id);
    
    const query = `UPDATE pacientes SET ${setClauses.join(', ')} WHERE id = ?`;
    
    console.log('🔍 Query final:', query);
    console.log('🔍 Valores:', values);
    
    // 🔥 EJECUTAR ACTUALIZACIÓN
    const [result] = await pool.execute(query, values);
    
    console.log('📊 Resultado MySQL:', {
      affectedRows: result.affectedRows,
      changedRows: result.changedRows,
      info: result.info,
      warningCount: result.warningCount
    });
    
    if (result.affectedRows === 0) {
      console.error('❌ No se actualizó ningún registro');
      return res.status(400).json({ 
        success: false,
        error: 'No se pudo actualizar el paciente. Es posible que no haya cambios.',
        affectedRows: result.affectedRows
      });
    }
    
    // 🔥 VERIFICAR LA ACTUALIZACIÓN LEYENDO EL REGISTRO
    const [updatedRecord] = await pool.execute(
      `SELECT 
        id, nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
        telefono, correo_electronico, calle_numero, sexo, grupo_etnico,
        religion, rfc, numero_seguridad_social, derecho_habiente,
        nombre_institucion, observaciones_internas, fecha_actualizacion
      FROM pacientes 
      WHERE id = ? AND activo = 1`,
      [id]
    );
    
    console.log('✅ Registro después de actualizar:', updatedRecord[0]);
    console.log('✏️ === FIN DEBUG ACTUALIZACIÓN BACKEND ===');

    // 🎉 RESPUESTA EXITOSA
    res.json({ 
      success: true,
      id: id,
      campos_actualizados: Object.keys(camposActualizar),
      datos_actualizados: camposActualizar,
      verificacion: updatedRecord[0] || null,
      mysql_info: {
        affectedRows: result.affectedRows,
        changedRows: result.changedRows
      }
    });
    
  } catch (err) {
    console.error('❌ ERROR COMPLETO al actualizar paciente:');
    console.error('❌ Error message:', err.message);
    console.error('❌ Error code:', err.code);
    console.error('❌ Error errno:', err.errno);
    console.error('❌ Error stack:', err.stack);
    
    let errorMessage = 'Error interno del servidor';
    let errorDetails = null;
    
    // Identificar errores específicos de MySQL
    if (err.code === 'ER_DATA_TOO_LONG') {
      errorMessage = 'Algún campo excede la longitud máxima permitida';
      errorDetails = 'Revisa que los textos no sean demasiado largos';
    } else if (err.code === 'ER_BAD_NULL_ERROR') {
      errorMessage = 'Se intentó guardar un valor nulo en un campo requerido';
      errorDetails = err.message;
    } else if (err.code === 'ER_TRUNCATED_WRONG_VALUE') {
      errorMessage = 'Formato de fecha o valor incorrecto';
      errorDetails = err.message;
    } else if (err.code === 'ER_NO_SUCH_TABLE') {
      errorMessage = 'Error de base de datos: tabla no encontrada';
    } else if (err.code === 'ER_BAD_FIELD_ERROR') {
      errorMessage = 'Error en los campos de la tabla';
      errorDetails = err.message;
    }
    
    return res.status(500).json({ 
      success: false,
      error: errorMessage,
      codigo_error: err.code,
      details: errorDetails,
      debug_info: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        code: err.code,
        errno: err.errno,
        sql: err.sql
      } : undefined
    });
  }
});

// 🗑️ DESACTIVAR PACIENTE (soft delete)
router.delete('/:id', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE pacientes SET activo = 0, fecha_actualizacion = NOW() WHERE id = ? AND activo = 1', 
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    
    console.log('✅ Paciente desactivado:', id);
    
    res.json({ message: 'Paciente desactivado exitosamente' });
    
  } catch (err) {
    console.error('❌ Error al desactivar paciente:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// 📊 ENDPOINT PARA ESTADÍSTICAS DE PACIENTES
router.get('/stats/resumen', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    console.log('📊 GET /pacientes/stats/resumen');
    
    const [estadisticas] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pacientes,
        SUM(CASE WHEN COALESCE(estado, 'Activo') = 'Temporal' THEN 1 ELSE 0 END) as temporales,
        SUM(CASE WHEN COALESCE(estado, 'Activo') = 'Activo' THEN 1 ELSE 0 END) as activos,
        SUM(CASE WHEN sexo = 'M' THEN 1 ELSE 0 END) as masculinos,
        SUM(CASE WHEN sexo = 'F' THEN 1 ELSE 0 END) as femeninos,
        SUM(CASE WHEN foto_avatar IS NOT NULL THEN 1 ELSE 0 END) as con_avatar,
        AVG(
          CASE 
            WHEN fecha_nacimiento != '1900-01-01' AND fecha_nacimiento IS NOT NULL 
            THEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE())
            ELSE NULL
          END
        ) as edad_promedio,
        COUNT(CASE WHEN telefono IS NOT NULL AND telefono != '' THEN 1 END) as con_telefono,
        COUNT(CASE WHEN correo_electronico IS NOT NULL AND correo_electronico != '' THEN 1 END) as con_email
      FROM pacientes 
      WHERE activo = 1
    `);
    
    const [edadesPorRango] = await pool.execute(`
      SELECT 
        CASE 
          WHEN fecha_nacimiento = '1900-01-01' OR fecha_nacimiento IS NULL THEN 'Sin fecha'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) < 18 THEN 'Menores (0-17)'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 18 AND 30 THEN 'Jóvenes (18-30)'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 31 AND 50 THEN 'Adultos (31-50)'
          WHEN TIMESTAMPDIFF(YEAR, fecha_nacimiento, CURDATE()) BETWEEN 51 AND 70 THEN 'Maduros (51-70)'
          ELSE 'Tercera edad (71+)'
        END as rango_edad,
        COUNT(*) as cantidad
      FROM pacientes 
      WHERE activo = 1
      GROUP BY rango_edad
      ORDER BY 
        CASE 
          WHEN rango_edad = 'Sin fecha' THEN 6
          WHEN rango_edad = 'Menores (0-17)' THEN 1
          WHEN rango_edad = 'Jóvenes (18-30)' THEN 2
          WHEN rango_edad = 'Adultos (31-50)' THEN 3
          WHEN rango_edad = 'Maduros (51-70)' THEN 4
          ELSE 5
        END
    `);
    
    const respuesta = {
      resumen: estadisticas[0],
      edades_por_rango: edadesPorRango,
      fecha_consulta: new Date().toISOString()
    };
    
    console.log('📊 Estadísticas generadas:', respuesta.resumen);
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('❌ Error al obtener estadísticas:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// ===== SISTEMA DE GENERACIÓN DE MATRÍCULAS =====

// 🏷️ FUNCIÓN PARA GENERAR MATRÍCULA AUTOMÁTICA
const generarMatricula = (pacienteId, fechaCreacion = null) => {
  const fecha = fechaCreacion ? new Date(fechaCreacion) : new Date();
  
  // Formato: PAC + DDMMYY + / + ID
  const dia = fecha.getDate().toString().padStart(2, '0');
  const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
  const año = fecha.getFullYear().toString().slice(-2);
  
  return `PAC${dia}${mes}${año}/${pacienteId}`;
};

// 🔄 ENDPOINT PARA GENERAR MATRÍCULAS FALTANTES
router.post('/generar-matriculas', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    console.log('🏷️ Iniciando generación de matrículas para pacientes activos...');
    
    // Obtener pacientes activos sin matrícula
    const [pacientesSinMatricula] = await pool.execute(`
      SELECT id, nombre, apellido_paterno, fecha_creacion, estado 
      FROM pacientes 
      WHERE activo = 1 
        AND estado = 'Activo' 
        AND (matricula IS NULL OR matricula = '' OR matricula = id)
      ORDER BY id
    `);
    
    console.log(`📊 Encontrados ${pacientesSinMatricula.length} pacientes sin matrícula`);
    
    if (pacientesSinMatricula.length === 0) {
      return res.json({
        success: true,
        message: 'Todos los pacientes activos ya tienen matrícula',
        pacientes_procesados: 0
      });
    }
    
    const matriculasGeneradas = [];
    
    // Generar matrícula para cada paciente
    for (const paciente of pacientesSinMatricula) {
      const nuevaMatricula = generarMatricula(paciente.id, paciente.fecha_creacion);
      
      // Actualizar en la base de datos
      await pool.execute(
        'UPDATE pacientes SET matricula = ? WHERE id = ?',
        [nuevaMatricula, paciente.id]
      );
      
      matriculasGeneradas.push({
        id: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido_paterno}`,
        matricula_anterior: null,
        matricula_nueva: nuevaMatricula
      });
      
      console.log(`✅ Matrícula generada para ${paciente.nombre} ${paciente.apellido_paterno}: ${nuevaMatricula}`);
    }
    
    console.log(`🎉 Proceso completado: ${matriculasGeneradas.length} matrículas generadas`);
    
    res.json({
      success: true,
      message: `Se generaron ${matriculasGeneradas.length} matrículas exitosamente`,
      pacientes_procesados: matriculasGeneradas.length,
      matriculas_generadas: matriculasGeneradas
    });
    
  } catch (error) {
    console.error('❌ Error al generar matrículas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// 🔄 ENDPOINT PARA REGENERAR MATRÍCULA DE UN PACIENTE ESPECÍFICO
router.post('/:id/generar-matricula', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log(`🏷️ Generando matrícula para paciente ID: ${id}`);
    
    // Verificar que el paciente existe y es activo
    const [pacienteResult] = await pool.execute(
      'SELECT id, nombre, apellido_paterno, fecha_creacion, estado, matricula FROM pacientes WHERE id = ? AND activo = 1',
      [id]
    );
    
    if (pacienteResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado o inactivo'
      });
    }
    
    const paciente = pacienteResult[0];
    const matriculaAnterior = paciente.matricula;
    const nuevaMatricula = generarMatricula(paciente.id, paciente.fecha_creacion);
    
    // Actualizar en la base de datos
    await pool.execute(
      'UPDATE pacientes SET matricula = ? WHERE id = ?',
      [nuevaMatricula, id]
    );
    
    console.log(`✅ Matrícula actualizada para ${paciente.nombre} ${paciente.apellido_paterno}: ${nuevaMatricula}`);
    
    res.json({
      success: true,
      message: 'Matrícula generada exitosamente',
      paciente: {
        id: paciente.id,
        nombre: `${paciente.nombre} ${paciente.apellido_paterno}`,
        matricula_anterior: matriculaAnterior,
        matricula_nueva: nuevaMatricula
      }
    });
    
  } catch (error) {
    console.error('❌ Error al generar matrícula:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// 📊 ENDPOINT PARA VERIFICAR ESTADO DE MATRÍCULAS
router.get('/verificar-matriculas', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    console.log('📊 Verificando estado de matrículas...');
    
    const [estadisticas] = await pool.execute(`
      SELECT 
        COUNT(*) as total_pacientes,
        SUM(CASE WHEN estado = 'Activo' THEN 1 ELSE 0 END) as total_activos,
        SUM(CASE WHEN estado = 'Temporal' THEN 1 ELSE 0 END) as total_temporales,
        SUM(CASE 
          WHEN estado = 'Activo' AND (matricula IS NOT NULL AND matricula != '' AND matricula != id) 
          THEN 1 ELSE 0 
        END) as activos_con_matricula,
        SUM(CASE 
          WHEN estado = 'Activo' AND (matricula IS NULL OR matricula = '' OR matricula = id) 
          THEN 1 ELSE 0 
        END) as activos_sin_matricula
      FROM pacientes 
      WHERE activo = 1
    `);
    
    const [pacientesSinMatricula] = await pool.execute(`
      SELECT id, nombre, apellido_paterno, estado, matricula
      FROM pacientes 
      WHERE activo = 1 
        AND estado = 'Activo' 
        AND (matricula IS NULL OR matricula = '' OR matricula = id)
      ORDER BY apellido_paterno, nombre
      LIMIT 10
    `);
    
    res.json({
      success: true,
      estadisticas: estadisticas[0],
      pacientes_sin_matricula: pacientesSinMatricula,
      requiere_accion: estadisticas[0].activos_sin_matricula > 0,
      mensaje: estadisticas[0].activos_sin_matricula > 0 
        ? `Hay ${estadisticas[0].activos_sin_matricula} pacientes activos sin matrícula`
        : 'Todos los pacientes activos tienen matrícula'
    });
    
  } catch (error) {
    console.error('❌ Error al verificar matrículas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===== ENDPOINTS DE CONVERSIÓN TEMPORAL A ACTIVO =====

// 🔄 ENDPOINT MEJORADO PARA CONVERTIR PACIENTE TEMPORAL A ACTIVO
router.put('/:id/convertir-activo', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const datosConversion = req.body;
    
    console.log('🔄 Convirtiendo paciente temporal a activo:', id);
    console.log('📋 Datos recibidos:', datosConversion);
    
    // Verificar que el paciente existe
    const [pacienteExistente] = await pool.execute(
      'SELECT * FROM pacientes WHERE id = ? AND activo = 1', 
      [id]
    );
    
    if (pacienteExistente.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Paciente no encontrado' 
      });
    }
    
    const paciente = pacienteExistente[0];
    console.log('📋 Paciente encontrado:', paciente);
    
    // Si ya es activo, informarlo
    if (paciente.estado === 'Activo') {
      return res.json({
        success: true,
        message: 'El paciente ya es permanente',
        id: id,
        matricula: paciente.matricula || `PAC${new Date().getDate().toString().padStart(2, '0')}${(new Date().getMonth() + 1).toString().padStart(2, '0')}${new Date().getFullYear().toString().slice(-2)}/${id}`,
        tipo_paciente: 'Activo',
        accion: 'ya_activo'
      });
    }
    
    // Preparar datos para actualización - Mantener datos existentes o usar los nuevos
    const datosActualizacion = {
      nombre: datosConversion.nombre || paciente.nombre,
      apellido_paterno: datosConversion.apellido_paterno || paciente.apellido_paterno,
      apellido_materno: datosConversion.apellido_materno || paciente.apellido_materno,
      fecha_nacimiento: datosConversion.fecha_nacimiento || paciente.fecha_nacimiento,
      telefono: datosConversion.telefono || paciente.telefono,
      correo_electronico: datosConversion.correo_electronico || paciente.correo_electronico,
      sexo: datosConversion.sexo || paciente.sexo,
      calle_numero: datosConversion.calle_numero || paciente.calle_numero,
      lugar_nacimiento: datosConversion.lugar_nacimiento || paciente.lugar_nacimiento,
      lugar_procedencia: datosConversion.lugar_procedencia || paciente.lugar_procedencia,
      grupo_etnico: datosConversion.grupo_etnico || paciente.grupo_etnico,
      religion: datosConversion.religion || paciente.religion,
      rfc: datosConversion.rfc || paciente.rfc,
      derecho_habiente: datosConversion.derecho_habiente !== undefined 
        ? datosConversion.derecho_habiente 
        : paciente.derecho_habiente,
      nombre_institucion: datosConversion.nombre_institucion || paciente.nombre_institucion
    };
    
    // 🏷️ GENERAR MATRÍCULA AUTOMÁTICAMENTE
    const fechaCreacion = paciente.fecha_creacion || new Date();
    const fecha = new Date(fechaCreacion);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    const nuevaMatricula = `PAC${dia}${mes}${año}/${id}`;
    
    console.log('📝 Datos finales para actualización:', datosActualizacion);
    console.log('🏷️ Matrícula generada:', nuevaMatricula);
    
    // Actualizar paciente a estado Activo CON matrícula
    const query = `
      UPDATE pacientes 
      SET 
        nombre = ?,
        apellido_paterno = ?,
        apellido_materno = ?,
        fecha_nacimiento = ?,
        telefono = ?,
        correo_electronico = ?,
        sexo = ?,
        calle_numero = ?,
        lugar_nacimiento = ?,
        lugar_procedencia = ?,
        grupo_etnico = ?,
        religion = ?,
        rfc = ?,
        derecho_habiente = ?,
        nombre_institucion = ?,
        estado = 'Activo',
        tipo_paciente = 'Activo',
        matricula = ?,
        fecha_actualizacion = NOW(),
        actualizado_por = ?
      WHERE id = ?
    `;
    
    const valores = [
      datosActualizacion.nombre,
      datosActualizacion.apellido_paterno,
      datosActualizacion.apellido_materno,
      datosActualizacion.fecha_nacimiento,
      datosActualizacion.telefono,
      datosActualizacion.correo_electronico,
      datosActualizacion.sexo,
      datosActualizacion.calle_numero,
      datosActualizacion.lugar_nacimiento,
      datosActualizacion.lugar_procedencia,
      datosActualizacion.grupo_etnico,
      datosActualizacion.religion,
      datosActualizacion.rfc,
      datosActualizacion.derecho_habiente ? 1 : 0,
      datosActualizacion.nombre_institucion,
      nuevaMatricula, // 🏷️ Matrícula generada automáticamente
      req.user?.id || null,
      id
    ];
    
    const [resultado] = await pool.execute(query, valores);
    
    if (resultado.affectedRows === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No se pudo convertir el paciente' 
      });
    }
    
    console.log('✅ Paciente convertido exitosamente:', id);
    console.log('🏷️ Matrícula asignada:', nuevaMatricula);
    
    res.json({
      success: true,
      message: 'Paciente convertido a permanente exitosamente',
      id: id,
      matricula: nuevaMatricula,
      tipo_paciente: 'Activo',
      accion: 'convertido',
      datos_actualizados: datosActualizacion,
      matricula_generada: nuevaMatricula
    });
    
  } catch (error) {
    console.error('❌ Error al convertir paciente:', error);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// 🔄 ENDPOINT ALTERNATIVO SIMPLE PARA CONVERSIÓN
router.post('/:id/activar', verifyToken, verifyPacientesAccess, async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('🔄 Activando paciente temporal:', id);
    
    // Verificar que el paciente existe y es temporal
    const [pacienteResult] = await pool.execute(
      'SELECT * FROM pacientes WHERE id = ? AND activo = 1',
      [id]
    );
    
    if (pacienteResult.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado'
      });
    }
    
    const paciente = pacienteResult[0];
    
    // Generar matrícula
    const fechaCreacion = paciente.fecha_creacion || new Date();
    const fecha = new Date(fechaCreacion);
    const dia = fecha.getDate().toString().padStart(2, '0');
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0');
    const año = fecha.getFullYear().toString().slice(-2);
    const nuevaMatricula = `PAC${dia}${mes}${año}/${id}`;
    
    // Actualizar a activo con matrícula
    await pool.execute(`
      UPDATE pacientes 
      SET estado = 'Activo', 
          tipo_paciente = 'Activo', 
          matricula = ?, 
          fecha_actualizacion = NOW() 
      WHERE id = ?
    `, [nuevaMatricula, id]);
    
    console.log('✅ Paciente activado:', id, 'Matrícula:', nuevaMatricula);
    
    res.json({
      success: true,
      message: 'Paciente activado exitosamente',
      id: id,
      matricula: nuevaMatricula,
      tipo_paciente: 'Activo'
    });
    
  } catch (error) {
    console.error('❌ Error al activar paciente:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// ===== LOGGING Y DOCUMENTACIÓN =====

console.log('✅ Endpoints principales de pacientes configurados');
console.log('📍 Rutas principales disponibles:');
console.log('   - GET    /api/pacientes (listar todos)');
console.log('   - GET    /api/pacientes/:id (obtener por ID)');
console.log('   - POST   /api/pacientes (crear nuevo)');
console.log('   - PUT    /api/pacientes/:id (actualizar)');
console.log('   - DELETE /api/pacientes/:id (desactivar)');
console.log('   - GET    /api/pacientes/stats/resumen (estadísticas)');
console.log('📍 Rutas adicionales:');
console.log('   - GET    /api/pacientes/buscar?q=término (buscar)');
console.log('   - GET    /api/pacientes/:id/historial (historial)');
console.log('   - POST   /api/pacientes/:id/avatar (subir avatar)');
console.log('   - DELETE /api/pacientes/:id/avatar (eliminar avatar)');
console.log('   - GET    /api/pacientes/:id/avatar (info avatar)');
console.log('🏷️ Sistema de matrículas configurado:');
console.log('   - POST /api/pacientes/generar-matriculas (generar todas las faltantes)');
console.log('   - POST /api/pacientes/:id/generar-matricula (generar para uno específico)');
console.log('   - GET  /api/pacientes/verificar-matriculas (verificar estado)');
console.log('🔄 Endpoints de conversión configurados:');
console.log('   - PUT  /api/pacientes/:id/convertir-activo (conversión completa)');
console.log('   - POST /api/pacientes/:id/activar (conversión simple)');
console.log('🧪 Endpoints de utilidad:');
console.log('   - GET /api/pacientes/test (prueba de funcionamiento)');
console.log('   - GET /api/pacientes/estructura (verificar estructura DB)');

module.exports = router;