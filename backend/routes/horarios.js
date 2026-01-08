// routes/horarios.js - Endpoint para obtener horarios disponibles

const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');

// Horarios de trabajo actualizados (11:00 AM - 7:30 PM)
const HORARIOS_TRABAJO = [
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '18:30', '19:00', '19:30'
];

/**
 * GET /horarios/disponibles
 * Obtiene los horarios disponibles para una fecha específica
 */
router.get('/disponibles', async (req, res) => {
  try {
    const { fecha, doctor_id = null } = req.query;
    
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

    console.log(`🔍 Buscando horarios disponibles para: ${fecha}`);

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

    const [horariosOcupados] = await req.db.execute(query, params);
    
    console.log(`📅 Horarios ocupados encontrados:`, horariosOcupados);

    // Extraer solo las horas ocupadas
    const horasOcupadas = horariosOcupados.map(row => {
      if (row.hora_cita) {
        // Asegurar formato HH:MM
        return row.hora_cita.length === 8 ? row.hora_cita.slice(0, 5) : row.hora_cita;
      }
      return null;
    }).filter(Boolean);

    console.log(`⏰ Horas ocupadas procesadas:`, horasOcupadas);

    // Filtrar horarios disponibles
    const horariosDisponibles = HORARIOS_TRABAJO.filter(horario => 
      !horasOcupadas.includes(horario)
    );

    console.log(`✅ Horarios disponibles:`, horariosDisponibles);

    // Si es hoy, filtrar horarios que ya pasaron
    let horariosFinales = horariosDisponibles;
    const ahora = new Date();
    const fechaConsulta = new Date(fecha + 'T00:00:00');
    
    if (fechaConsulta.toDateString() === ahora.toDateString()) {
      const horaActual = ahora.getHours();
      const minutoActual = ahora.getMinutes();
      const horaActualString = `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`;
      
      horariosFinales = horariosDisponibles.filter(horario => {
        const [hora, minuto] = horario.split(':').map(Number);
        const horarioMinutos = hora * 60 + minuto;
        const actualMinutos = horaActual * 60 + minutoActual + 30; // 30 min de anticipación
        
        return horarioMinutos >= actualMinutos;
      });
      
      console.log(`🕐 Filtrado por hora actual (${horaActualString}):`, horariosFinales);
    }

    res.json({
      success: true,
      fecha: fecha,
      total_disponibles: horariosFinales.length,
      horarios: horariosFinales,
      horarios_ocupados: horasOcupadas,
      message: horariosFinales.length > 0 
        ? `${horariosFinales.length} horarios disponibles`
        : 'No hay horarios disponibles para esta fecha'
    });

  } catch (error) {
    console.error('❌ Error al obtener horarios disponibles:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

/**
 * GET /horarios/configuracion
 * Obtiene la configuración de horarios de trabajo
 */
router.get('/configuracion', async (req, res) => {
  try {
    // Obtener configuración de la base de datos
    const [config] = await req.db.execute(`
      SELECT clave, valor 
      FROM configuracion_admin 
      WHERE seccion = 'horarios' 
      AND clave IN ('hora_apertura', 'hora_cierre')
    `);

    const horaApertura = config.find(c => c.clave === 'hora_apertura')?.valor || '08:00';
    const horaCierre = config.find(c => c.clave === 'hora_cierre')?.valor || '20:00';

    // Generar horarios cada 30 minutos
    const horarios = [];
    const [horaIni, minIni] = horaApertura.split(':').map(Number);
    const [horaFin, minFin] = horaCierre.split(':').map(Number);

    let hora = horaIni;
    let minuto = minIni;

    while (hora < horaFin || (hora === horaFin && minuto < minFin)) {
      horarios.push(`${hora.toString().padStart(2, '0')}:${minuto.toString().padStart(2, '0')}`);
      
      minuto += 30;
      if (minuto >= 60) {
        minuto = 0;
        hora++;
      }
    }

    res.json({
      success: true,
      hora_apertura: horaApertura,
      hora_cierre: horaCierre,
      horarios_disponibles: horarios
    });

  } catch (error) {
    console.error('❌ Error al obtener configuración de horarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración',
      horarios_disponibles: HORARIOS_TRABAJO
    });
  }
});

module.exports = router;