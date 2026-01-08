// historial.js - VERSIÓN FINAL CORREGIDA

const express = require('express');
const { verifyToken } = require('../middleware/auth');
const { pool } = require('../config/database');

const router = express.Router();

// ✅ MIDDLEWARE DE AUTENTICACIÓN
router.use(verifyToken);

// ✅ RUTA DE GUARDADO CORREGIDA - POST
router.post('/historiales-clinicos', async (req, res) => {
  try {
    console.log('💾 === INICIANDO GUARDADO DE HISTORIAL ===');
    console.log('📋 Datos recibidos:', JSON.stringify(req.body, null, 2));

    const {
      paciente_id,
      pacienteId, // Verificar ambos nombres
      doctor_id = 8, // ✅ CORREGIDO: usar doctor_id = 8 como en tu BD
      cita_id,
      fecha_consulta,
      estado = 'completado',
      version = '1.0',
      datos_personales,
      ficha_identificacion,
      motivo_consulta,
      antecedentes_heredo_familiares,
      antecedentes_personales_no_patologicos,
      antecedentes_personales_patologicos,
      examen_extrabucal,
      examen_intrabucal,
      diagnostico,
      tratamiento,
      plan_tratamiento,
      // Nuevos campos que podrían venir del frontend
      datos,
      metadatos
    } = req.body;

    // ✅ DETERMINAR EL ID DEL PACIENTE CORRECTO
    const finalPacienteId = paciente_id || pacienteId || (datos?.informacionPersonal?.id);
    
    if (!finalPacienteId) {
      console.error('❌ No se encontró ID del paciente en:', {
        paciente_id,
        pacienteId,
        datos_personal: datos?.informacionPersonal
      });
      
      return res.status(400).json({
        success: false,
        error: 'ID del paciente es requerido',
        debug: {
          received_paciente_id: paciente_id,
          received_pacienteId: pacienteId,
          received_datos: datos ? 'presente' : 'ausente'
        }
      });
    }

    // ✅ VERIFICAR QUE EL PACIENTE EXISTE
    const [pacienteExiste] = await pool.execute(
      'SELECT id, nombre, apellido_paterno FROM pacientes WHERE id = ? AND activo = 1',
      [finalPacienteId]
    );

    if (pacienteExiste.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Paciente no encontrado o inactivo',
        paciente_id: finalPacienteId
      });
    }

    console.log('✅ Paciente encontrado:', pacienteExiste[0]);

    // ✅ PREPARAR DATOS PARA INSERCIÓN
    const prepararDatos = (data) => {
      if (!data) return null;
      if (typeof data === 'string') return data;
      return JSON.stringify(data);
    };

    // ✅ EXTRAER DATOS DE DIFERENTES ESTRUCTURAS POSIBLES
    let finalMotivoConsulta = motivo_consulta;
    let finalDiagnostico = diagnostico;
    let finalTratamiento = tratamiento;

    // Si vienen en la estructura de "datos"
    if (datos && datos.secciones) {
      finalMotivoConsulta = finalMotivoConsulta || datos.secciones.motivoConsulta;
      finalDiagnostico = finalDiagnostico || datos.diagnostico || 'Diagnóstico registrado en sistema';
      finalTratamiento = finalTratamiento || datos.tratamiento || 'Tratamiento documentado en historial';
    }

    const fechaConsulta = fecha_consulta || new Date().toISOString().split('T')[0];

    // ✅ INSERTAR EN LA BASE DE DATOS
    const insertQuery = `
      INSERT INTO historial_clinico (
        paciente_id, 
        doctor_id, 
        cita_id, 
        fecha_consulta, 
        estado, 
        version,
        motivo_consulta, 
        antecedentes_heredo_familiares, 
        antecedentes_personales_no_patologicos,
        antecedentes_personales_patologicos, 
        examen_extrabucal, 
        examen_intrabucal,
        diagnostico, 
        tratamiento, 
        plan_tratamiento,
        datos_personales,
        ficha_identificacion,
        creado_por,
        actualizado_por,
        created_at, 
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(insertQuery, [
      finalPacienteId,
      doctor_id,
      cita_id || null,
      fechaConsulta,
      estado,
      version,
      prepararDatos(finalMotivoConsulta) || 'Consulta registrada',
      prepararDatos(antecedentes_heredo_familiares),
      prepararDatos(antecedentes_personales_no_patologicos),
      prepararDatos(antecedentes_personales_patologicos),
      prepararDatos(examen_extrabucal),
      prepararDatos(examen_intrabucal),
      finalDiagnostico || 'Diagnóstico en proceso',
      finalTratamiento || 'Plan de tratamiento por definir',
      prepararDatos(plan_tratamiento),
      prepararDatos(datos_personales || datos?.informacionPersonal),
      prepararDatos(ficha_identificacion || datos?.secciones?.fichaIdentificacion),
      doctor_id,
      doctor_id
    ]);

    const historialId = result.insertId;
    console.log('✅ HISTORIAL GUARDADO EXITOSAMENTE:', historialId);

    // ✅ VERIFICAR QUE SE GUARDÓ CORRECTAMENTE
    const [verificacion] = await pool.execute(
      'SELECT id, paciente_id, diagnostico, tratamiento, created_at FROM historial_clinico WHERE id = ?',
      [historialId]
    );

    console.log('✅ Verificación guardado:', verificacion[0]);

    // ✅ RESPUESTA EXITOSA
    res.status(200).json({
      success: true,
      message: 'Historial clínico guardado exitosamente',
      data: {
        id: historialId,
        historialId: historialId,
        paciente_id: finalPacienteId,
        fecha: fechaConsulta,
        estado: estado,
        tabla_usada: 'historial_clinico',
        verificacion: verificacion[0]
      }
    });

  } catch (error) {
    console.error('❌ ERROR AL GUARDAR HISTORIAL:', error);
    
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo guardar el historial clínico',
      details: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
});

// ✅ RUTA DE LECTURA CORREGIDA - GET
router.get('/pacientes/:pacienteId/historial', async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log('📋 === BUSCANDO HISTORIAL PARA PACIENTE:', pacienteId, '===');
    
    // ✅ PRIMERO VERIFICAR SI EL PACIENTE EXISTE
    const [pacienteExiste] = await pool.execute(
      'SELECT id, nombre, apellido_paterno FROM pacientes WHERE id = ?',
      [pacienteId]
    );

    if (pacienteExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado',
        data: [],
        error: 'PATIENT_NOT_FOUND'
      });
    }
    
    // ✅ CONSULTA MEJORADA
    const query = `
      SELECT 
        hc.id,
        hc.paciente_id,
        hc.doctor_id,
        hc.cita_id,
        hc.fecha_consulta,
        hc.estado,
        hc.version,
        hc.motivo_consulta,
        hc.antecedentes_heredo_familiares,
        hc.antecedentes_personales_no_patologicos,
        hc.antecedentes_personales_patologicos,
        hc.examen_extrabucal,
        hc.examen_intrabucal,
        hc.diagnostico,
        hc.tratamiento,
        hc.plan_tratamiento,
        hc.datos_personales,
        hc.ficha_identificacion,
        hc.created_at,
        hc.updated_at,
        CONCAT(u.nombre, ' ', u.apellido_paterno) as doctor_nombre,
        p.nombre as paciente_nombre,
        p.apellido_paterno as paciente_apellido
      FROM historial_clinico hc
      LEFT JOIN usuarios u ON hc.doctor_id = u.id  
      LEFT JOIN pacientes p ON hc.paciente_id = p.id
      WHERE hc.paciente_id = ?
      ORDER BY hc.fecha_consulta DESC, hc.created_at DESC
    `;
    
    const [historiales] = await pool.execute(query, [pacienteId]);
    
    console.log(`📊 HISTORIALES ENCONTRADOS: ${historiales.length}`);
    
    if (historiales.length > 0) {
      console.log('📋 Primer historial:', {
        id: historiales[0].id,
        fecha: historiales[0].fecha_consulta,
        diagnostico: historiales[0].diagnostico?.substring(0, 50),
        estado: historiales[0].estado
      });
    }
    
    if (historiales.length === 0) {
      return res.status(200).json({  // ✅ CAMBIO: 200 en lugar de 404 cuando no hay historiales
        success: true,
        message: 'No se encontraron historiales para este paciente',
        data: [],
        count: 0,
        paciente: pacienteExiste[0],
        debug: {
          paciente_id: pacienteId,
          paciente_existe: true,
          historiales_count: 0
        }
      });
    }
    
    // ✅ FORMATEAR DATOS PARA EL FRONTEND
    const historialesFormateados = historiales.map(historial => {
  // ✅ FUNCIÓN MEJORADA PARA PARSEAR MOTIVO DE CONSULTA
  const parsearMotivoConsulta = (motivoRaw) => {
    try {
      if (!motivoRaw) return 'No especificado';
      
      // Si es string que parece JSON, parsearlo
      if (typeof motivoRaw === 'string') {
        // Verificar si parece JSON
        if (motivoRaw.trim().startsWith('{')) {
          const parsed = JSON.parse(motivoRaw);
          
          // Extraer el texto más relevante del JSON
          if (parsed.motivo_principal) {
            let resultado = parsed.motivo_principal;
            
            // Agregar información adicional si existe
            if (parsed.padecimiento_actual) {
              resultado += `. ${parsed.padecimiento_actual}`;
            }
            
            if (parsed.inicio_sintomas) {
              resultado += ` (Inicio: ${parsed.inicio_sintomas})`;
            }
            
            if (parsed.intensidad_dolor) {
              resultado += ` - Intensidad: ${parsed.intensidad_dolor}/10`;
            }
            
            return resultado;
          }
          
          // Si no tiene motivo_principal, buscar otros campos
          if (parsed.descripcion) return parsed.descripcion;
          if (parsed.motivo) return parsed.motivo;
          if (parsed.padecimiento_actual) return parsed.padecimiento_actual;
          
          // Como último recurso, mostrar el motivo_principal o el primer valor string
          const primeraString = Object.values(parsed).find(val => 
            typeof val === 'string' && val.length > 0
          );
          return primeraString || 'Consulta registrada';
        }
        
        // Si es string simple, devolverlo
        return motivoRaw;
      }
      
      // Si ya es objeto
      if (typeof motivoRaw === 'object' && motivoRaw !== null) {
        if (motivoRaw.motivo_principal) return motivoRaw.motivo_principal;
        if (motivoRaw.descripcion) return motivoRaw.descripcion;
        if (motivoRaw.motivo) return motivoRaw.motivo;
        return 'Consulta registrada';
      }
      
      return 'No especificado';
      
    } catch (error) {
      console.warn('Error parseando motivo de consulta:', error);
      // Si hay error, intentar mostrar al menos parte del string original
      if (typeof motivoRaw === 'string' && motivoRaw.length > 0) {
        return motivoRaw.substring(0, 100) + (motivoRaw.length > 100 ? '...' : '');
      }
      return 'Error al procesar motivo de consulta';
    }
  };

  return {
    id: historial.id,
    paciente_id: historial.paciente_id,
    doctor_id: historial.doctor_id,
    cita_id: historial.cita_id,
    fecha_consulta: historial.fecha_consulta,
    estado: historial.estado || 'completado',
    version: historial.version,
    
    // ✅ MOTIVO DE CONSULTA MEJORADO
    motivo_consulta_texto: parsearMotivoConsulta(historial.motivo_consulta),
    motivo_consulta: historial.motivo_consulta, // Mantener el original para el frontend
    
    // Antecedentes
    antecedentes_heredo_familiares: historial.antecedentes_heredo_familiares,
    antecedentes_personales_no_patologicos: historial.antecedentes_personales_no_patologicos,
    antecedentes_personales_patologicos: historial.antecedentes_personales_patologicos,
    
    // Exámenes
    examen_extrabucal: historial.examen_extrabucal,
    examen_intrabucal: historial.examen_intrabucal,
    
    // Diagnóstico y tratamiento
    diagnostico: historial.diagnostico || 'Sin diagnóstico',
    diagnostico_presuntivo: historial.diagnostico || 'Sin diagnóstico',
    tratamiento: historial.tratamiento || 'Sin tratamiento',
    plan_tratamiento: historial.plan_tratamiento,
    
    // Datos adicionales
    datos_personales: historial.datos_personales,
    ficha_identificacion: historial.ficha_identificacion,
    
    // Metadata
    doctor_nombre: historial.doctor_nombre || 'Dr. No especificado',
    paciente_nombre: historial.paciente_nombre,
    paciente_apellido: historial.paciente_apellido,
    tipo_cita: 'Consulta General',
    created_at: historial.created_at,
    updated_at: historial.updated_at
  };
});
    
    console.log('✅ ENVIANDO RESPUESTA CON', historialesFormateados.length, 'HISTORIALES');
    
    res.status(200).json({
      success: true,
      message: `${historiales.length} historial(es) encontrado(s)`,
      data: historialesFormateados,
      count: historiales.length,
      paciente: pacienteExiste[0]
    });
    
  } catch (error) {
    console.error('❌ ERROR AL OBTENER HISTORIAL:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: error.message,
      debug: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        paciente_id: req.params.pacienteId
      } : undefined
    });
  }
});

// ✅ RUTA DE DEBUG MEJORADA
router.get('/debug/paciente/:pacienteId', async (req, res) => {
  try {
    const { pacienteId } = req.params;
    
    console.log('🔍 === DEBUGGING HISTORIAL PARA PACIENTE:', pacienteId, '===');
    
    // Verificar paciente
    const [paciente] = await pool.execute(
      'SELECT id, nombre, apellido_paterno, activo FROM pacientes WHERE id = ?',
      [pacienteId]
    );

    // Verificar historiales
    const [historiales] = await pool.execute(
      `SELECT 
        id, paciente_id, doctor_id, fecha_consulta, estado, created_at,
        CASE WHEN motivo_consulta IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_motivo_consulta,
        CASE WHEN diagnostico IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_diagnostico,
        SUBSTRING(motivo_consulta, 1, 100) as motivo_preview,
        SUBSTRING(diagnostico, 1, 100) as diagnostico_preview
       FROM historial_clinico 
       WHERE paciente_id = ?
       ORDER BY created_at DESC`,
      [pacienteId]
    );

    // Verificar última inserción
    const [ultimaInsercion] = await pool.execute(
      'SELECT * FROM historial_clinico ORDER BY created_at DESC LIMIT 5'
    );

    // ✅ VERIFICAR ESTRUCTURA DE TABLA
    const [estructura] = await pool.execute(
      'DESCRIBE historial_clinico'
    );

    const debug = {
      paciente_id: pacienteId,
      timestamp: new Date().toISOString(),
      
      paciente: {
        existe: paciente.length > 0,
        data: paciente[0] || null
      },
      
      historial_clinico: {
        count: historiales.length,
        data: historiales,
        estructura_tabla: estructura
      },
      
      ultimas_inserciones: {
        count: ultimaInsercion.length,
        data: ultimaInsercion
      },
      
      endpoints_disponibles: {
        guardar: 'POST /api/historial/historiales-clinicos',
        obtener: `GET /api/historial/pacientes/${pacienteId}/historial`,
        debug: `GET /api/historial/debug/paciente/${pacienteId}`
      },
      
      diagnostico: {
        problema: historiales.length === 0 ? 'No hay datos en la tabla historial_clinico' : 'Datos encontrados ✅',
        solucion: historiales.length === 0 ? 'Verificar que el guardado funcione correctamente' : 'Frontend debe mostrar estos datos',
        tabla_correcta: 'historial_clinico',
        estructura_esperada: 'paciente_id, doctor_id, fecha_consulta, estado, motivo_consulta, diagnostico, tratamiento'
      }
    };

    console.log('🔍 DEBUG COMPLETO:', JSON.stringify(debug, null, 2));
    res.json(debug);

  } catch (error) {
    console.error('❌ ERROR EN DEBUG:', error);
    res.status(500).json({ 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// ✅ RUTA ADICIONAL PARA VERIFICAR QUE EL BACKEND FUNCIONA
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Backend de historial funcionando correctamente',
    timestamp: new Date().toISOString(),
    endpoints: [
      'POST /api/historial/historiales-clinicos',
      'GET /api/historial/pacientes/:id/historial',
      'GET /api/historial/debug/paciente/:id',
      'GET /api/historial/test'
    ]
  });
});

module.exports = router;