const express = require('express');
const { body, validationResult } = require('express-validator');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/database');
const router = express.Router();

  /**
 * Función para obtener horarios de trabajo desde la base de datos
 * @param {Object} pool - Pool de conexiones MySQL
 * @returns {Array} Array de horarios en formato HH:MM
 */
const obtenerHorariosTrabajo = async (pool) => {
  try {
    console.log('⏰ [HORARIOS-BD] Obteniendo horarios desde base de datos...');
    
    // Obtener configuración de horarios de la BD
    const [config] = await pool.execute(`
      SELECT clave, valor 
      FROM configuracion_admin 
      WHERE seccion = 'horarios' 
      AND clave IN ('hora_apertura', 'hora_cierre')
    `);

    const horaApertura = config.find(c => c.clave === 'hora_apertura')?.valor || '11:00';
    const horaCierre = config.find(c => c.clave === 'hora_cierre')?.valor || '19:30';

    console.log(`⏰ [HORARIOS-BD] Horarios configurados: ${horaApertura} - ${horaCierre}`);

    // Generar horarios cada 30 minutos
    const horarios = [];
    const [horaIni, minIni] = horaApertura.split(':').map(Number);
    const [horaFin, minFin] = horaCierre.split(':').map(Number);

    let hora = horaIni;
    let minuto = minIni;

    while (hora < horaFin || (hora === horaFin && minuto <= minFin)) {
      horarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
      
      minuto += 30;
      if (minuto >= 60) {
        minuto = 0;
        hora++;
      }
    }

    console.log(`✅ [HORARIOS-BD] ${horarios.length} horarios generados:`, horarios);
    return horarios;
    
  } catch (error) {
    console.error('❌ [HORARIOS-BD] Error al obtener horarios de BD:', error);
    
    // Fallback a horarios predefinidos si falla la BD
    const horariosFallback = [
      '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
      '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
    ];
    
    console.log('🔄 [HORARIOS-BD] Usando horarios fallback:', horariosFallback.length);
    return horariosFallback;
  }
};

// ✅ VERIFICAR QUE POOL ESTÉ DISPONIBLE AL CARGAR EL MÓDULO
console.log('🔌 [CITAS] Verificando conexión pool:', pool ? '✅ Disponible' : '❌ No disponible');

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

// Middleware para verificar pool antes de cada request
const verifyPool = (req, res, next) => {
  if (!pool) {
    console.error('❌ [POOL] Pool de conexiones no disponible');
    return res.status(500).json({
      success: false,
      message: 'Error de configuración de base de datos',
      error: 'Pool de conexiones no disponible'
    });
  }
  next();
};

// 🆕 OBTENER CITAS DE HOY - ENDPOINT FALTANTE
router.get('/hoy', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('📅 [CITAS HOY] ========================================');
    console.log('📅 [CITAS HOY] GET /citas/hoy - Obteniendo citas de hoy');
    console.log('📅 [CITAS HOY] Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    
    const hoy = new Date().toISOString().split('T')[0];
    console.log('📆 [CITAS HOY] Fecha de hoy:', hoy);
    
    const query = `
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.tipo_consulta,
        c.estado,
        c.observaciones,
        c.precio,
        
        -- Información del paciente
        COALESCE(
          CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')),
          c.nombre_paciente
        ) as paciente_nombre,
        
        p.telefono as paciente_telefono,
        p.matricula as paciente_matricula,
        
        -- Información del doctor
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre,
        u.especialidad as doctor_especialidad,
        
        -- Información del tipo de consulta
        tc.nombre as tipo_consulta_nombre,
        tc.descripcion as tipo_consulta_descripcion
        
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      WHERE c.fecha_cita = ?
      ORDER BY c.hora_cita ASC
    `;
    
    console.log('🔍 [CITAS HOY] Ejecutando query para citas de hoy...');
    const [citas] = await pool.execute(query, [hoy]);
    
    console.log('✅ [CITAS HOY] Citas encontradas:', citas.length);
    
    // Log de ejemplo para debug
    if (citas.length > 0) {
      console.log('📝 [CITAS HOY] Primera cita:', {
        id: citas[0].id,
        paciente: citas[0].paciente_nombre,
        hora: citas[0].hora_cita,
        tipo: citas[0].tipo_consulta
      });
    } else {
      console.log('📝 [CITAS HOY] No hay citas programadas para hoy');
    }
    
    const response = {
      success: true,
      fecha: hoy,
      total: citas.length,
      citas: citas
    };
    
    console.log('📤 [CITAS HOY] Enviando respuesta con', citas.length, 'citas');
    console.log('📅 [CITAS HOY] ========================================');
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [CITAS HOY] ERROR COMPLETO:', error);
    console.error('❌ [CITAS HOY] Stack trace:', error.stack);
    res.status(500).json({ 
      success: false,
      error: 'Error interno del servidor',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 📅 CREAR NUEVA CITA
router.post('/', verifyToken, verifyAccess, verifyPool, [
  body('nombre_paciente').notEmpty().withMessage('Nombre del paciente es requerido'),
  body('edad_paciente').optional().isInt({ min: 1, max: 150 }).withMessage('Edad debe ser entre 1 y 150 años'),
  body('fecha_consulta').isDate().withMessage('Fecha válida requerida'),
  body('horario_consulta').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horario válido requerido'),
  body('doctor_id').isInt({ min: 1 }).withMessage('Doctor válido requerido')
], async (req, res) => {
  try {
    console.log('📅 [CITAS] ========================================');
    console.log('📅 [CITAS] POST /citas - Creando nueva cita');
    console.log('📅 [CITAS] Usuario:', req.user?.nombre, 'Rol:', req.user?.rol);
    console.log('📅 [CITAS] Datos recibidos:', JSON.stringify(req.body, null, 2));
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.error('❌ [CITAS] Errores de validación:', errors.array());
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Datos de entrada inválidos'
      });
    }

    const {
      paciente_id,
      nombre_paciente,
      edad_paciente,
      telefono_temporal,
      tipo_consulta,
      tipo_consulta_id,
      fecha_consulta,
      horario_consulta,
      doctor_id,
      observaciones,
      precio,
      es_temporal
    } = req.body;

    let pacienteIdFinal = paciente_id;
    let pacienteTemporal = false;
    
    // Crear paciente temporal si es necesario
    if (!paciente_id || es_temporal) {
      console.log('🆕 [CITAS] Creando paciente temporal');
      
      const nombrePartes = nombre_paciente.trim().split(' ');
      const nombre = nombrePartes[0] || '';
      const apellidoPaterno = nombrePartes.slice(1).join(' ') || 'Temporal';
      
      // Calcular fecha de nacimiento si se proporciona edad
      let fechaNacimientoStr = null;
      if (edad_paciente) {
        const fechaNacimientoAprox = new Date();
        fechaNacimientoAprox.setFullYear(fechaNacimientoAprox.getFullYear() - edad_paciente);
        fechaNacimientoStr = fechaNacimientoAprox.toISOString().split('T')[0];
      }
      
      try {
        const insertPacienteQuery = `
          INSERT INTO pacientes (
            nombre, apellido_paterno, apellido_materno, fecha_nacimiento,
            sexo, telefono, estado, activo, creado_por
          ) VALUES (?, ?, NULL, ?, 'M', ?, 'Temporal', 1, ?)
        `;
        
        const [resultPaciente] = await pool.execute(insertPacienteQuery, [
          nombre,
          apellidoPaterno,
          fechaNacimientoStr,
          telefono_temporal || null,
          req.user?.id || null
        ]);
        
        pacienteIdFinal = resultPaciente.insertId;
        pacienteTemporal = true;
        
        console.log('✅ [CITAS] Paciente temporal creado con ID:', pacienteIdFinal);
      } catch (pacienteError) {
        console.error('❌ [CITAS] Error al crear paciente temporal:', pacienteError);
        return res.status(500).json({
          success: false,
          message: 'Error al crear paciente temporal'
        });
      }
    }

    // Verificar doctor
    const [doctorCheck] = await pool.execute(
      'SELECT id, nombre, apellido_paterno FROM usuarios WHERE id = ? AND rol = "Doctor" AND activo = 1',
      [doctor_id]
    );

    if (doctorCheck.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado o inactivo'
      });
    }

    const doctor = doctorCheck[0];

    // Verificar disponibilidad de horario
    const [conflictoHorario] = await pool.execute(`
      SELECT id FROM citas 
      WHERE doctor_id = ? AND fecha_cita = ? AND hora_cita = ? 
      AND estado NOT IN ('Cancelada', 'No_Asistio')
    `, [doctor_id, fecha_consulta, horario_consulta]);

    if (conflictoHorario.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El doctor ya tiene una cita programada en ese horario'
      });
    }

    // Insertar cita
    const insertQuery = `
      INSERT INTO citas (
        paciente_id, doctor_id, fecha_cita, hora_cita, 
        tipo_cita, tipo_consulta_id, estado, observaciones, precio,
        fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, 'Programada', ?, ?, NOW())
    `;

    // Preparar observaciones
    let observacionesFinales = observaciones || '';
    if (edad_paciente) {
      const infoEdad = `Edad: ${edad_paciente} años`;
      observacionesFinales = observacionesFinales ? 
        `${observacionesFinales}\n${infoEdad}` : 
        infoEdad;
    }

    const insertValues = [
      pacienteIdFinal,
      doctor_id,
      fecha_consulta,
      horario_consulta,
      tipo_consulta || 'Consulta',
      tipo_consulta_id || null,
      observacionesFinales.trim(),
      parseFloat(precio) || 0
    ];

    console.log('🔧 [CITAS] Insertando cita...');
    const [result] = await pool.execute(insertQuery, insertValues);
    
    console.log('✅ [CITAS] Cita creada exitosamente con ID:', result.insertId);

    const response = {
      success: true,
      message: 'Cita agendada exitosamente',
      citaId: result.insertId,
      paciente_id: pacienteIdFinal,
      paciente: nombre_paciente,
      edad: edad_paciente,
      doctor: `Dr. ${doctor.nombre} ${doctor.apellido_paterno}`,
      fecha: fecha_consulta,
      hora: horario_consulta,
      tipo: tipo_consulta,
      precio: parseFloat(precio) || 0.00,
      pacienteTemporal: pacienteTemporal
    };

    console.log('📤 [CITAS] Enviando respuesta exitosa');
    res.status(201).json(response);

  } catch (error) {
    console.error('❌ [CITAS] ERROR COMPLETO:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al crear la cita',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 📅 OBTENER HISTORIAL DE CITAS POR PACIENTE
router.get('/paciente/:pacienteId', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const { pacienteId } = req.params;
    console.log('📅 [HISTORIAL-CITAS] Obteniendo historial para paciente:', pacienteId);
    
    if (!pacienteId || isNaN(pacienteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paciente inválido'
      });
    }
    
    const query = `
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.tipo_cita,
        c.estado,
        c.observaciones,
        c.precio,
        c.fecha_creacion,
        c.fecha_actualizacion,
        
        CONCAT(u.nombre, ' ', u.apellido_paterno, ' ', COALESCE(u.apellido_materno, '')) as doctor_nombre_completo,
        u.especialidad as doctor_especialidad,
        
        tc.nombre as tipo_consulta_nombre,
        tc.descripcion as tipo_consulta_descripcion,
        tc.precio as tipo_consulta_precio,
        
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as paciente_nombre_completo
        
      FROM citas c
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE c.paciente_id = ?
      ORDER BY c.fecha_cita DESC, c.hora_cita DESC
    `;
    
    console.log('🔍 [HISTORIAL-CITAS] Ejecutando query...');
    const [citas] = await pool.execute(query, [pacienteId]);
    
    console.log('✅ [HISTORIAL-CITAS] Citas encontradas:', citas.length);
    
    res.json({
      success: true,
      data: citas,
      paciente_id: parseInt(pacienteId),
      total: citas.length,
      estadisticas: {
        completadas: citas.filter(c => c.estado?.toLowerCase() === 'completada').length,
        programadas: citas.filter(c => ['programada', 'confirmada'].includes(c.estado?.toLowerCase())).length,
        canceladas: citas.filter(c => ['cancelada', 'no_asistio'].includes(c.estado?.toLowerCase())).length
      }
    });
    
  } catch (error) {
    console.error('❌ [HISTORIAL-CITAS] Error completo:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial de citas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 📋 OBTENER CITAS
router.get('/', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('📋 [CITAS] GET /citas - Obteniendo citas');
    
    const { fecha, doctor_id, paciente_id } = req.query;
    
    let query = `
      SELECT 
        c.*,
        COALESCE(
          CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')),
          c.nombre_paciente
        ) as paciente_nombre_completo,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre_completo,
        tc.nombre as tipo_consulta_nombre,
        tc.descripcion as tipo_consulta_descripcion
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      WHERE 1=1
    `;
    
    const queryParams = [];
    
    if (fecha) {
      query += ' AND c.fecha_cita = ?';
      queryParams.push(fecha);
    }
    
    if (doctor_id) {
      query += ' AND c.doctor_id = ?';
      queryParams.push(doctor_id);
    }
    
    if (paciente_id) {
      query += ' AND c.paciente_id = ?';
      queryParams.push(paciente_id);
    }
    
    query += ' ORDER BY c.fecha_cita DESC, c.hora_cita ASC';
    
    const [citas] = await pool.execute(query, queryParams);
    
    console.log('✅ [CITAS] Citas encontradas:', citas.length);
    
    res.json({
      success: true,
      data: citas,
      total: citas.length
    });
    
  } catch (error) {
    console.error('❌ [CITAS] Error al obtener citas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas'
    });
  }
});

// 📅 OBTENER CITAS DEL MES PARA CALENDARIO
router.get('/mes/:year/:month', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(`📅 [CALENDARIO] Obteniendo citas para ${month}/${year}`);
    
    const yearInt = parseInt(year);
    const monthInt = parseInt(month);
    
    if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
      return res.status(400).json({
        error: 'Parámetros inválidos',
        message: 'Año y mes deben ser números válidos'
      });
    }
    
    const primerDia = `${year}-${month.padStart(2, '0')}-01`;
    const ultimoDiaDelMes = new Date(yearInt, monthInt, 0).getDate();
    const ultimoDia = `${year}-${month.padStart(2, '0')}-${ultimoDiaDelMes.toString().padStart(2, '0')}`;
    
    const query = `
      SELECT 
        c.id,
        c.fecha_cita,
        c.hora_cita,
        c.tipo_cita,
        c.estado,
        c.observaciones,
        c.precio,
        COALESCE(
          CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')),
          c.nombre_paciente
        ) as paciente_nombre,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre,
        tc.nombre as tipo_consulta_nombre
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      WHERE c.fecha_cita >= ? AND c.fecha_cita <= ?
      AND c.estado NOT IN ('Cancelada', 'No_Asistio')
      ORDER BY c.fecha_cita, c.hora_cita
    `;
    
    const [citas] = await pool.execute(query, [primerDia, ultimoDia]);
    
    console.log(`✅ [CALENDARIO] Encontradas ${citas.length} citas válidas`);
    
    res.json(citas);
    
  } catch (error) {
    console.error('❌ [CALENDARIO] ERROR COMPLETO:', error);
    
    res.status(500).json({
      error: 'Error interno del servidor',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno',
      success: false
    });
  }
});

// 📅 OBTENER CITAS POR FECHA ESPECÍFICA - ✅ CORREGIDO
router.get('/fecha/:fecha', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const { fecha } = req.params;
    console.log('📅 [CITAS] Obteniendo citas para fecha:', fecha);
    
    const query = `
      SELECT 
        c.id,
        c.paciente_id,
        c.fecha_cita,
        c.hora_cita,
        c.tipo_consulta,
        c.estado,
        c.observaciones,
        c.precio,
        c.doctor_id,
        c.tipo_consulta_id,
        
        p.nombre as paciente_nombre,
        p.apellido_paterno as paciente_apellido,
        p.apellido_materno as paciente_apellido_materno,
        p.telefono as paciente_telefono,
        p.correo_electronico as paciente_email,
        CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')) as paciente_nombre_completo,
        
        d.nombre as doctor_nombre,
        d.apellido_paterno as doctor_apellido,
        d.apellido_materno as doctor_apellido_materno,
        CONCAT(d.nombre, ' ', d.apellido_paterno, ' ', COALESCE(d.apellido_materno, '')) as doctor_nombre_completo,
        
        tc.nombre as tipo_consulta_nombre,
        tc.precio as tipo_consulta_precio
        
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios d ON c.doctor_id = d.id  
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      WHERE DATE(c.fecha_cita) = ?
      ORDER BY c.hora_cita ASC
    `;
    
    console.log('🔍 [DEBUG] Ejecutando consulta SQL con pool');
    const [citas] = await pool.execute(query, [fecha]);
    
    console.log('✅ [CITAS] Citas encontradas para', fecha, ':', citas.length);
    
    res.json({
      success: true,
      data: citas,
      count: citas.length,
      fecha: fecha
    });
    
  } catch (error) {
    console.error('❌ [CITAS] Error al obtener citas por fecha:', error);
    console.error('❌ [CITAS] Stack trace:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Error al obtener citas',
      error: error.message
    });
  }
});

// 🔄 ACTUALIZAR ESTADO DE CITA
router.put('/:id/estado', verifyToken, verifyAccess, verifyPool, [
  body('estado').isIn(['Programada', 'Confirmada', 'En_Proceso', 'Completada', 'Cancelada', 'No_Asistio'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array() 
      });
    }
    
    const [result] = await pool.execute(
      'UPDATE citas SET estado = ?, fecha_actualizacion = NOW() WHERE id = ?',
      [estado, id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    console.log('✅ [CITAS] Estado actualizado para cita ID:', id, 'Nuevo estado:', estado);
    
    res.json({
      success: true,
      message: 'Estado de cita actualizado exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [CITAS] Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado de cita'
    });
  }
});

// POST /api/citas/verificar-vencidas - ✅ COMPLETAMENTE CORREGIDO
router.post('/verificar-vencidas', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('🔄 [VERIFICAR-VENCIDAS] Iniciando verificación...');
    
    const ahora = new Date();
    const haceMasDeUnaHora = new Date(ahora.getTime() - (60 * 60 * 1000));
    
    // ✅ CAMBIO: NO MODIFICAR observaciones, solo actualizar estado
    const query = `
  UPDATE citas 
  SET estado = 'No_Asistio', 
      fecha_actualizacion = NOW()
  WHERE estado IN ('Programada', 'Confirmada')
  AND TIMESTAMP(fecha_cita, hora_cita) < ?
  AND fecha_cita = CURDATE()
`;
    
    const fechaLimite = haceMasDeUnaHora.toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await pool.execute(query, [fechaLimite]);
    
    console.log(`🔄 [VERIFICAR-VENCIDAS] ${result.affectedRows} citas actualizadas`);
    
    res.json({
      success: true,
      citasActualizadas: result.affectedRows,
      mensaje: `${result.affectedRows} citas actualizadas automáticamente`,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [VERIFICAR-VENCIDAS] Error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error al verificar citas vencidas',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor'
    });
  }
});

// 🧪 ENDPOINTS DE DEBUG - ✅ CORREGIDOS
router.get('/debug/test-connection', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('🧪 [DEBUG] Probando conexión a BD...');
    
    const [result] = await pool.execute('SELECT COUNT(*) as total FROM citas WHERE DATE(fecha_cita) = ?', ['2025-06-26']);
    
    console.log('✅ [DEBUG] Conexión exitosa, citas del 26/06:', result[0].total);
    
    res.json({
      success: true,
      message: 'Conexión exitosa',
      citas_26_junio: result[0].total,
      fecha_actual: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Error de conexión:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

router.get('/debug/citas-raw', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('🔍 [DEBUG] Obteniendo citas raw...');
    
    const [citas] = await pool.execute(`
      SELECT 
        c.id,
        c.paciente_id,
        c.fecha_cita,
        c.hora_cita,
        c.estado,
        p.nombre,
        p.apellido_paterno
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      WHERE DATE(c.fecha_cita) = '2025-06-26'
      LIMIT 5
    `);
    
    console.log('📋 [DEBUG] Citas raw encontradas:', citas.length);
    
    res.json({
      success: true,
      data: citas,
      count: citas.length
    });
    
  } catch (error) {
    console.error('❌ [DEBUG] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 🗑️ CANCELAR CITA
router.delete('/:id', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const { id } = req.params;
    
    const [result] = await pool.execute(
      'UPDATE citas SET estado = "Cancelada", fecha_actualizacion = NOW() WHERE id = ?',
      [id]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }
    
    console.log('✅ [CITAS] Cita cancelada ID:', id);
    
    res.json({
      success: true,
      message: 'Cita cancelada exitosamente'
    });
    
  } catch (error) {
    console.error('❌ [CITAS] Error al cancelar cita:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar cita'
    });
  }
});

// 🤖 FUNCIÓN PARA ACTUALIZAR ESTADOS AUTOMÁTICAMENTE
const actualizarEstadosAutomaticos = async () => {
  try {
    const ahora = new Date();
    const hace2Horas = new Date(ahora.getTime() - (2 * 60 * 60 * 1000));
    
    console.log('🤖 [AUTO-UPDATE] Verificando citas para marcar como "No Asistió"...');
    
    // ✅ CAMBIO: NO MODIFICAR observaciones, solo actualizar estado
    const queryNoAsistio = `
  UPDATE citas 
  SET estado = 'No_Asistio', 
      fecha_actualizacion = NOW()
  WHERE estado IN ('Programada', 'Confirmada')
  AND fecha_cita = CURDATE()
  AND TIMESTAMP(fecha_cita, hora_cita) < ?
`;

    
    const fechaLimite = hace2Horas.toISOString().slice(0, 19).replace('T', ' ');
    
    const [result] = await pool.execute(queryNoAsistio, [fechaLimite]);
    
    if (result.affectedRows > 0) {
      console.log(`✅ [AUTO-UPDATE] ${result.affectedRows} citas marcadas como "No Asistió" automáticamente`);
      
      const [citasActualizadas] = await pool.execute(`
        SELECT 
          c.id, c.fecha_cita, c.hora_cita, c.estado,
          COALESCE(
            CONCAT(p.nombre, ' ', p.apellido_paterno),
            c.nombre_paciente
          ) as paciente_nombre
        FROM citas c
        LEFT JOIN pacientes p ON c.paciente_id = p.id
        WHERE c.estado = 'No_Asistio' 
        AND c.fecha_actualizacion >= DATE_SUB(NOW(), INTERVAL 5 MINUTE)
        ORDER BY c.fecha_actualizacion DESC
        LIMIT 10
      `);
      
      console.log('📋 [AUTO-UPDATE] Citas marcadas como "No Asistió":');
      citasActualizadas.forEach((cita, index) => {
        console.log(`   ${index + 1}. ID: ${cita.id} - ${cita.paciente_nombre} - ${cita.fecha_cita} ${cita.hora_cita}`);
      });
    } else {
      console.log('ℹ️ [AUTO-UPDATE] No hay citas que requieran actualización a "No Asistió"');
    }
    
    return { 
      citasNoAsistio: result.affectedRows,
      fecha_actualizacion: new Date().toISOString(),
      criterios: {
        fecha_limite: fechaLimite,
        retraso_minimo: '2 horas'
      }
    };
    
  } catch (error) {
    console.error('❌ [AUTO-UPDATE] Error completo:', error);
    return { 
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};


// 🔄 ENDPOINT PARA ACTUALIZACIÓN MANUAL
router.post('/actualizar-estados', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('🔄 [ENDPOINT-AUTO-UPDATE] Ejecutando actualización de estados...');
    
    const resultado = await actualizarEstadosAutomaticos();
    
    const response = {
      success: true,
      message: 'Estados de citas actualizados automáticamente',
      resultado: resultado,
      timestamp: new Date().toISOString(),
      usuario: req.user?.nombre
    };
    
    console.log('📤 [ENDPOINT-AUTO-UPDATE] Enviando respuesta:', response);
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [ENDPOINT-AUTO-UPDATE] ERROR COMPLETO:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estados de citas',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno del servidor',
      timestamp: new Date().toISOString()
    });
  }
});

// 🔍 ENDPOINT PARA VERIFICAR ESTADOS (DEBUGGING)
router.get('/verificar-estados', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('🔍 [VERIFICAR-ESTADOS] Verificando estados de citas...');
    
    const ahora = new Date();
    const fechaActual = ahora.toISOString().split('T')[0];
    const horaActual = ahora.toTimeString().split(' ')[0].substring(0, 5);
    
    const [citasPendientes] = await pool.execute(`
      SELECT 
        c.id, c.fecha_cita, c.hora_cita, c.estado,
        CONCAT(p.nombre, ' ', p.apellido_paterno) as paciente_nombre,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      WHERE c.estado IN ('Programada', 'Confirmada', 'En_Proceso')
      AND (
        c.fecha_cita < ? 
        OR (c.fecha_cita = ? AND c.hora_cita <= ?)
      )
      ORDER BY c.fecha_cita DESC, c.hora_cita DESC
      LIMIT 20
    `, [fechaActual, fechaActual, horaActual]);
    
    const [estadisticas] = await pool.execute(`
      SELECT 
        estado,
        COUNT(*) as cantidad,
        DATE(fecha_cita) as fecha
      FROM citas 
      WHERE fecha_cita >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY estado, DATE(fecha_cita)
      ORDER BY fecha DESC, estado
    `);
    
    const response = {
      success: true,
      timestamp: new Date().toISOString(),
      criterios_actualizacion: {
        fecha_actual: fechaActual,
        hora_actual: horaActual
      },
      citas_que_deberian_estar_completadas: citasPendientes,
      estadisticas_ultimos_7_dias: estadisticas,
      total_pendientes_actualizacion: citasPendientes.length
    };
    
    console.log('✅ [VERIFICAR-ESTADOS] Respuesta preparada:', {
      citasPendientes: citasPendientes.length,
      estadisticas: estadisticas.length
    });
    
    res.json(response);
    
  } catch (error) {
    console.error('❌ [VERIFICAR-ESTADOS] Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar estados',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 🔄 ACTUALIZAR CITA COMPLETA (REAGENDAR)
router.put('/:id', verifyToken, verifyAccess, verifyPool, [
  body('fecha_cita').optional().isDate().withMessage('Fecha válida requerida'),
  body('hora_cita').optional().matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Horario válido requerido'),
  body('estado').optional().isIn(['Programada', 'Confirmada', 'En_Proceso', 'Completada', 'Cancelada', 'No_Asistio', 'Reagendada'])
    .withMessage('Estado inválido')
], async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔄 [CITAS] PUT /citas/:id - Actualizando cita ID:', id);
    
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Datos de entrada inválidos'
      });
    }

    // Verificar que la cita existe
    const [citaExistente] = await pool.execute(
      'SELECT * FROM citas WHERE id = ?',
      [id]
    );

    if (citaExistente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citaExistente[0];
    const {
      fecha_cita,
      hora_cita,
      estado,
      observaciones,
      tipo_consulta_id,
      precio,
      notas
    } = req.body;

    // Verificar disponibilidad de horario si se cambia fecha/hora
    if ((fecha_cita && fecha_cita !== cita.fecha_cita) || 
        (hora_cita && hora_cita !== cita.hora_cita)) {
      
      const nuevaFecha = fecha_cita || cita.fecha_cita;
      const nuevaHora = hora_cita || cita.hora_cita;
      
      const [conflictoHorario] = await pool.execute(`
        SELECT id, nombre_paciente FROM citas 
        WHERE doctor_id = ? AND fecha_cita = ? AND hora_cita = ? 
        AND id != ? AND estado NOT IN ('Cancelada', 'No_Asistio')
      `, [cita.doctor_id, nuevaFecha, nuevaHora, id]);

      if (conflictoHorario.length > 0) {
        return res.status(409).json({
          success: false,
          message: `El doctor ya tiene una cita programada en ese horario`,
          conflicto: conflictoHorario[0]
        });
      }
    }

    // Preparar campos para actualizar
    const camposActualizar = [];
    const valoresActualizar = [];

    if (fecha_cita && fecha_cita !== cita.fecha_cita) {
      camposActualizar.push('fecha_cita = ?');
      valoresActualizar.push(fecha_cita);
    }

    if (hora_cita && hora_cita !== cita.hora_cita) {
      camposActualizar.push('hora_cita = ?');
      valoresActualizar.push(hora_cita);
    }

    if (estado && estado !== cita.estado) {
      camposActualizar.push('estado = ?');
      valoresActualizar.push(estado);
    }

    if (tipo_consulta_id && tipo_consulta_id !== cita.tipo_consulta_id) {
      camposActualizar.push('tipo_consulta_id = ?');
      valoresActualizar.push(tipo_consulta_id);
    }

    if (precio !== undefined && parseFloat(precio) !== parseFloat(cita.precio)) {
      camposActualizar.push('precio = ?');
      valoresActualizar.push(parseFloat(precio));
    }

    // Combinar observaciones existentes con nuevas notas
    if (observaciones || notas) {
      const observacionesActuales = cita.observaciones || '';
      const notasNuevas = observaciones || notas || '';
      
      let observacionesFinales = observacionesActuales;
      
      if (notasNuevas && !observacionesActuales.includes(notasNuevas)) {
        const timestamp = new Date().toLocaleString('es-MX');
        observacionesFinales = observacionesActuales 
          ? `${observacionesActuales}\n\n[${timestamp}] ${notasNuevas}`
          : `[${timestamp}] ${notasNuevas}`;
      }
      
      if (observacionesFinales !== observacionesActuales) {
        camposActualizar.push('observaciones = ?');
        valoresActualizar.push(observacionesFinales);
      }
    }

    // Siempre actualizar fecha de modificación
    camposActualizar.push('fecha_actualizacion = NOW()');

    if (camposActualizar.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    // Ejecutar actualización
    const updateQuery = `UPDATE citas SET ${camposActualizar.join(', ')} WHERE id = ?`;
    valoresActualizar.push(id);

    const [result] = await pool.execute(updateQuery, valoresActualizar);
    
    if (result.affectedRows === 0) {
      return res.status(500).json({
        success: false,
        message: 'No se pudo actualizar la cita'
      });
    }

    // Obtener cita actualizada para respuesta
    const [citaActualizada] = await pool.execute(`
      SELECT 
        c.*,
        COALESCE(
          CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')),
          c.nombre_paciente
        ) as paciente_nombre_completo,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre_completo,
        tc.nombre as tipo_consulta_nombre
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      WHERE c.id = ?
    `, [id]);

    const citaFinal = citaActualizada[0];
    
    console.log('✅ [CITAS] Cita actualizada exitosamente:', citaFinal.id);

    const response = {
      success: true,
      message: 'Cita actualizada exitosamente',
      data: citaFinal,
      cambios_realizados: {
        fecha_anterior: cita.fecha_cita,
        fecha_nueva: citaFinal.fecha_cita,
        hora_anterior: cita.hora_cita,
        hora_nueva: citaFinal.hora_cita,
        estado_anterior: cita.estado,
        estado_nuevo: citaFinal.estado
      }
    };
    
    res.json(response);

  } catch (error) {
    console.error('❌ [CITAS] ERROR al actualizar:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al actualizar la cita',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// ===== AGREGAR ESTOS ENDPOINTS AL FINAL DE TU ARCHIVO citas.js =====

// 📅 ENDPOINT 1: OBTENER HORARIOS DISPONIBLES PARA REAGENDAR
router.get('/:id/horarios-disponibles', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const citaId = req.params.id;
    const { fecha } = req.query;
    
    console.log(`⏰ [HORARIOS] Obteniendo horarios disponibles para cita ${citaId} en fecha ${fecha}`);
    
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    // Validar formato de fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }

    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden agendar citas en fechas pasadas',
        horarios: []
      });
    }

    // Obtener información de la cita
    const [cita] = await pool.execute(
      'SELECT doctor_id, fecha_cita, hora_cita FROM citas WHERE id = ?',
      [citaId]
    );

    if (cita.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    // Obtener horarios ocupados excluyendo la cita actual
    const [horariosOcupados] = await pool.execute(`
      SELECT hora_cita 
      FROM citas 
      WHERE fecha_cita = ? 
      AND doctor_id = ?
      AND estado NOT IN ('Cancelada', 'No_Asistio')
      AND id != ?
    `, [fecha, cita[0].doctor_id, citaId]);

    console.log(`📋 [HORARIOS] Horarios ocupados encontrados:`, horariosOcupados.length);

    const horasOcupadas = horariosOcupados
      .map(row => {
        if (row.hora_cita) {
          return row.hora_cita.length === 8 ? row.hora_cita.slice(0, 5) : row.hora_cita;
        }
        return null;
      })
      .filter(Boolean);

    console.log(`⏰ [HORARIOS] Horas ocupadas procesadas:`, horasOcupadas);

    // 🔧 CAMBIO: Obtener horarios desde BD
    const HORARIOS_TRABAJO = await obtenerHorariosTrabajo(pool);

    // Filtrar horarios disponibles
    let horariosDisponibles = HORARIOS_TRABAJO.filter(horario => 
      !horasOcupadas.includes(horario)
    );

    // Si es hoy, filtrar horarios que ya pasaron
    if (fechaObj.toDateString() === hoy.toDateString()) {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      
      horariosDisponibles = horariosDisponibles.filter(horario => {
        const [hora, minuto] = horario.split(':').map(Number);
        const horarioMinutos = hora * 60 + minuto;
        const actualMinutos = horaActual * 60 + minutoActual + 30; // 30 min de anticipación
        
        return horarioMinutos >= actualMinutos;
      });
      
      console.log(`🕐 [HORARIOS] Filtrado por hora actual, quedan: ${horariosDisponibles.length}`);
    }

    console.log(`✅ [HORARIOS] Horarios disponibles finales:`, horariosDisponibles.length);

    res.json({
      success: true,
      fecha: fecha,
      horarios: horariosDisponibles,
      total_disponibles: horariosDisponibles.length,
      cita_actual: {
        fecha: cita[0].fecha_cita,
        hora: cita[0].hora_cita
      },
      debug: {
        horas_ocupadas: horasOcupadas,
        doctor_id: cita[0].doctor_id,
        horarios_configurados: HORARIOS_TRABAJO.length
      }
    });

  } catch (error) {
    console.error('❌ [HORARIOS] Error al obtener horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener horarios disponibles',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 🔄 REAGENDAR CITA ESPECÍFICA
router.put('/:id/reagendar', verifyToken, verifyAccess, verifyPool, [
  body('nueva_fecha').isDate().withMessage('Nueva fecha válida requerida'),
  body('nueva_hora').matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Nueva hora válida requerida')
], async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const citaId = req.params.id;
    const { nueva_fecha, nueva_hora, observaciones } = req.body;
    
    console.log(`🔄 [REAGENDAR] Reagendando cita ${citaId}:`, { nueva_fecha, nueva_hora });

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false,
        errors: errors.array(),
        message: 'Datos de entrada inválidos'
      });
    }

    // 1. Verificar que la cita existe
    const [citaExistente] = await connection.execute(
      'SELECT * FROM citas WHERE id = ?',
      [citaId]
    );

    if (citaExistente.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Cita no encontrada'
      });
    }

    const cita = citaExistente[0];

    // 2. Verificar que el nuevo horario esté disponible
    const [conflictos] = await connection.execute(`
      SELECT id, nombre_paciente 
      FROM citas 
      WHERE fecha_cita = ? 
      AND hora_cita = ? 
      AND doctor_id = ?
      AND estado NOT IN ('Cancelada', 'No_Asistio')
      AND id != ?
    `, [nueva_fecha, nueva_hora, cita.doctor_id, citaId]);

    if (conflictos.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El horario seleccionado ya está ocupado',
        conflicto: conflictos[0]
      });
    }

    // 3. Preparar observaciones actualizadas
    const fechaOriginal = cita.fecha_cita;
    const horaOriginal = cita.hora_cita;
    const fechaReagendar = new Date().toLocaleString('es-MX');
    
    const nuevasObservaciones = [
      cita.observaciones || '',
      `\n[REAGENDADA ${fechaReagendar}]: Movida de ${fechaOriginal} ${horaOriginal} a ${nueva_fecha} ${nueva_hora}`,
      observaciones ? `Motivo: ${observaciones}` : ''
    ].filter(Boolean).join('\n').trim();

    // 4. Actualizar la cita
    const [result] = await connection.execute(`
      UPDATE citas 
      SET fecha_cita = ?,
          hora_cita = ?,
          estado = 'Programada',
          observaciones = ?,
          fecha_actualizacion = NOW()
      WHERE id = ?
    `, [nueva_fecha, nueva_hora, nuevasObservaciones, citaId]);

    if (result.affectedRows === 0) {
      throw new Error('No se pudo actualizar la cita');
    }

    // 5. Registrar en el log de citas (si la tabla existe)
    try {
      await connection.execute(`
        INSERT INTO citas_logs (cita_id, accion, detalle, fecha_log)
        VALUES (?, 'REAGENDADA', ?, NOW())
      `, [
        citaId,
        `Cita reagendada de ${fechaOriginal} ${horaOriginal} a ${nueva_fecha} ${nueva_hora}`
      ]);
    } catch (logError) {
      console.log('ℹ️ [REAGENDAR] No se pudo registrar en citas_logs (tabla no existe)');
    }

    // 6. Obtener la cita actualizada con datos completos
    const [citaActualizada] = await connection.execute(`
      SELECT 
        c.*,
        COALESCE(
          CONCAT(p.nombre, ' ', p.apellido_paterno, ' ', COALESCE(p.apellido_materno, '')),
          c.nombre_paciente
        ) as paciente_nombre_completo,
        p.telefono as paciente_telefono,
        tc.nombre as tipo_consulta_nombre,
        tc.precio as precio_consulta,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre_completo
      FROM citas c
      LEFT JOIN pacientes p ON c.paciente_id = p.id
      LEFT JOIN tipos_consulta tc ON c.tipo_consulta_id = tc.id
      LEFT JOIN usuarios u ON c.doctor_id = u.id
      WHERE c.id = ?
    `, [citaId]);

    await connection.commit();

    console.log('✅ [REAGENDAR] Cita reagendada exitosamente:', citaActualizada[0].id);

    res.json({
      success: true,
      message: 'Cita reagendada exitosamente',
      cita: citaActualizada[0],
      cambios: {
        fecha_anterior: fechaOriginal,
        hora_anterior: horaOriginal,
        fecha_nueva: nueva_fecha,
        hora_nueva: nueva_hora
      }
    });

  } catch (error) {
    await connection.rollback();
    console.error('❌ [REAGENDAR] Error al reagendar cita:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error al reagendar la cita',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  } finally {
    connection.release();
  }
});

// 📅 ENDPOINT 2: HORARIOS DISPONIBLES GENERAL
router.get('/horarios/disponibles', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    const { fecha, doctor_id = null } = req.query;
    
    console.log(`⏰ [HORARIOS-GENERAL] Obteniendo horarios para fecha: ${fecha}, doctor: ${doctor_id}`);
    
    if (!fecha) {
      return res.status(400).json({
        success: false,
        message: 'La fecha es requerida'
      });
    }

    // Validar formato de fecha
    const fechaObj = new Date(fecha + 'T00:00:00');
    if (isNaN(fechaObj.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Formato de fecha inválido'
      });
    }

    // No permitir fechas pasadas
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaObj < hoy) {
      return res.status(400).json({
        success: false,
        message: 'No se pueden consultar horarios de fechas pasadas',
        horarios: []
      });
    }

    // Obtener horarios ocupados
    let query = `
      SELECT hora_cita 
      FROM citas 
      WHERE fecha_cita = ? 
      AND estado NOT IN ('Cancelada', 'No_Asistio')
    `;
    
    let params = [fecha];
    
    // Si se especifica doctor, filtrar por doctor
    if (doctor_id) {
      query += ' AND doctor_id = ?';
      params.push(doctor_id);
    }

    const [horariosOcupados] = await pool.execute(query, params);
    
    console.log(`📋 [HORARIOS-GENERAL] Horarios ocupados encontrados:`, horariosOcupados.length);

    // Extraer solo las horas ocupadas
    const horasOcupadas = horariosOcupados.map(row => {
      if (row.hora_cita) {
        return row.hora_cita.length === 8 ? row.hora_cita.slice(0, 5) : row.hora_cita;
      }
      return null;
    }).filter(Boolean);

    console.log(`⏰ [HORARIOS-GENERAL] Horas ocupadas procesadas:`, horasOcupadas);

    // 🔧 CAMBIO: Obtener horarios desde BD
    const HORARIOS_TRABAJO = await obtenerHorariosTrabajo(pool);

    // Filtrar horarios disponibles
    let horariosDisponibles = HORARIOS_TRABAJO.filter(horario => 
      !horasOcupadas.includes(horario)
    );

    // Si es hoy, filtrar horarios que ya pasaron
    if (fechaObj.toDateString() === hoy.toDateString()) {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      
      horariosDisponibles = horariosDisponibles.filter(horario => {
        const [hora, minuto] = horario.split(':').map(Number);
        const horarioMinutos = hora * 60 + minuto;
        const actualMinutos = horaActual * 60 + minutoActual + 30; // 30 min de anticipación
        
        return horarioMinutos >= actualMinutos;
      });
      
      console.log(`🕐 [HORARIOS-GENERAL] Filtrado por hora actual, quedan: ${horariosDisponibles.length}`);
    }

    console.log(`✅ [HORARIOS-GENERAL] Horarios disponibles finales:`, horariosDisponibles.length);

    res.json({
      success: true,
      fecha: fecha,
      total_disponibles: horariosDisponibles.length,
      horarios: horariosDisponibles,
      horarios_ocupados: horasOcupadas,
      configuracion: {
        total_horarios_sistema: HORARIOS_TRABAJO.length,
        horarios_sistema: HORARIOS_TRABAJO
      },
      message: horariosDisponibles.length > 0 
        ? `${horariosDisponibles.length} horarios disponibles`
        : 'No hay horarios disponibles para esta fecha'
    });

  } catch (error) {
    console.error('❌ [HORARIOS-GENERAL] Error al obtener horarios disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
    });
  }
});

// 📅 OBTENER HORARIOS DE TRABAJO CONFIGURADOS
router.get('/horarios/trabajo', verifyToken, verifyAccess, verifyPool, async (req, res) => {
  try {
    console.log('⚙️ [HORARIOS-TRABAJO] Obteniendo configuración de horarios...');
    
    // Obtener configuración de la BD
    const [config] = await pool.execute(`
      SELECT clave, valor 
      FROM configuracion_admin 
      WHERE seccion = 'horarios' 
      AND clave IN ('hora_apertura', 'hora_cierre')
    `);

    const horaApertura = config.find(c => c.clave === 'hora_apertura')?.valor || '08:30';
    const horaCierre = config.find(c => c.clave === 'hora_cierre')?.valor || '20:00';

    // Generar horarios cada 30 minutos
    const horarios = [];
    const [horaIni, minIni] = horaApertura.split(':').map(Number);
    const [horaFin, minFin] = horaCierre.split(':').map(Number);

    let hora = horaIni;
    let minuto = minIni;

    while (hora < horaFin || (hora === horaFin && minuto <= minFin)) {
      horarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
      
      minuto += 30;
      if (minuto >= 60) {
        minuto = 0;
        hora++;
      }
    }

    console.log(`✅ [HORARIOS-TRABAJO] Enviando ${horarios.length} horarios configurados`);

    res.json({
      success: true,
      horarios: horarios,
      configuracion: {
        hora_apertura: horaApertura,
        hora_cierre: horaCierre,
        total_horarios: horarios.length
      },
      message: `${horarios.length} horarios disponibles desde ${horaApertura} hasta ${horaCierre}`
    });

  } catch (error) {
    console.error('❌ [HORARIOS-TRABAJO] Error:', error);
    
    // Fallback con horarios extendidos
    const horariosFallback = [
      '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
      '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
      '19:00', '19:30', '20:00'
    ];
    
    res.json({
      success: true,
      horarios: horariosFallback,
      configuracion: {
        hora_apertura: '08:30',
        hora_cierre: '20:00',
        total_horarios: horariosFallback.length
      },
      message: 'Horarios fallback cargados',
      fallback: true
    });
  }
});

console.log('✅ [CITAS] Endpoints de reagendar y horarios agregados correctamente');
module.exports = router;