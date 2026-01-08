// En lugar de crear una conexión nueva, importamos la existente
// Usamos '..' para subir un nivel y entrar a 'config'
const { pool } = require('../config/database'); 

// ✅ Obtener información completa del paciente
async function obtenerInfoPaciente(telefono) {
    try {
        const telefonoLimpio = telefono.replace('@c.us', '').replace(/[^0-9]/g, '');
        
        const [rows] = await pool.query( // Cambiado execute por query para compatibilidad
            `SELECT id, nombre, apellido_paterno, apellido_materno, telefono 
             FROM pacientes 
             WHERE telefono LIKE ? 
             LIMIT 1`,
            [`%${telefonoLimpio.slice(-10)}`]
        );

        if (rows.length > 0) {
            const paciente = rows[0];
            return {
                existe: true,
                id: paciente.id,
                nombre: paciente.nombre,
                nombreCompleto: `${paciente.nombre} ${paciente.apellido_paterno || ''}`.trim()
            };
        }
        
        return { existe: false };
    } catch (error) {
        console.error('Error obteniendo info del paciente:', error);
        return { existe: false };
    }
}

// ✅ Obtener historial de citas del paciente
async function obtenerHistorialCitas(pacienteId, limite = 5) {
    try {
        const [rows] = await pool.query(
            `SELECT fecha_cita, hora_cita, tipo_cita, estado 
             FROM citas 
             WHERE paciente_id = ? 
             ORDER BY fecha_cita DESC, hora_cita DESC 
             LIMIT ?`,
            [pacienteId, limite]
        );
        
        return rows;
    } catch (error) {
        console.error('Error obteniendo historial:', error);
        return [];
    }
}

// ✅ Buscar o Crear Paciente
async function buscarOCrearPaciente(telefono, nombre) {
    try {
        const telefonoLimpio = telefono.replace('@c.us', '').replace(/[^0-9]/g, '');
        
        const [rows] = await pool.query(
            'SELECT id, nombre FROM pacientes WHERE telefono LIKE ? LIMIT 1',
            [`%${telefonoLimpio.slice(-10)}`]
        );

        if (rows.length > 0) {
            console.log(`✅ Paciente encontrado: ${rows[0].nombre} (ID: ${rows[0].id})`);
            return rows[0].id;
        }

        console.log(`🆕 Creando paciente nuevo: ${nombre}`);
        
        const [result] = await pool.query(
            `INSERT INTO pacientes (nombre, apellido_paterno, telefono, sexo, fecha_nacimiento, activo, tipo_paciente) 
             VALUES (?, '', ?, 'M', '2000-01-01', 1, 'Activo')`,
            [nombre || 'Paciente', telefonoLimpio]
        );
        
        return result.insertId;
    } catch (error) {
        console.error('Error gestionando paciente:', error);
        return 1; // Fallback ID
    }
}

// ✅ Consultar Horarios Ocupados
async function obtenerHorasOcupadas(fecha) {
    try {
        const [rows] = await pool.query(
            'SELECT hora_cita FROM citas WHERE fecha_cita = ? AND estado != "Cancelada"',
            [fecha]
        );
        // Asegurar que devuelva array de strings HH:MM:SS
        return rows.map(r => r.hora_cita);
    } catch (error) {
        console.error('Error consultando horarios:', error);
        return [];
    }
}

// ✅ Agendar Cita
async function agendarCitaEnBaseDatos(datos) {
    const { nombre, telefono, fecha, hora, motivo } = datos;
    console.log("📝 Intentando agendar:", datos);
    
    try {
        const pacienteId = await buscarOCrearPaciente(telefono, nombre);
        const doctorId = 7; // ID por defecto o buscar uno disponible
        
        const [result] = await pool.query(
            `INSERT INTO citas (
                paciente_id, 
                doctor_id, 
                fecha_cita, 
                hora_cita, 
                tipo_cita, 
                observaciones, 
                estado
            ) VALUES (?, ?, ?, ?, ?, ?, 'Programada')`,
            [
                pacienteId, 
                doctorId, 
                fecha,
                hora,
                motivo || 'Consulta',
                'Agendado por Bot WhatsApp'
            ]
        );
        
        console.log(`✅ Cita guardada con ID: ${result.insertId}`);
        return true;
    } catch (error) {
        console.error('❌ Error fatal guardando cita:', error);
        console.error('Detalles:', error.message);
        return false;
    }
}

// ✅ Obtener citas del paciente
async function obtenerCitasPaciente(telefono) {
    try {
        const telefonoLimpio = telefono.replace('@c.us', '').replace(/[^0-9]/g, '');
        
        const [rows] = await pool.query(
            `SELECT c.id, c.fecha_cita, c.hora_cita, c.tipo_cita, c.estado, c.observaciones
             FROM citas c
             JOIN pacientes p ON c.paciente_id = p.id
             WHERE p.telefono LIKE ? 
             AND c.estado IN ('Programada', 'Confirmada')
             AND c.fecha_cita >= CURDATE()
             ORDER BY c.fecha_cita ASC, c.hora_cita ASC`,
            [`%${telefonoLimpio.slice(-10)}`]
        );
        
        return rows;
    } catch (error) {
        console.error('Error obteniendo citas del paciente:', error);
        return [];
    }
}

// ✅ Cancelar cita
async function cancelarCita(citaId, motivo = 'Cancelado por el paciente via WhatsApp') {
    try {
        const [result] = await pool.query(
            `UPDATE citas 
             SET estado = 'Cancelada', 
                 observaciones = CONCAT(IFNULL(observaciones, ''), '\n[Cancelación] ', ?)
             WHERE id = ? AND estado != 'Cancelada'`,
            [motivo, citaId]
        );
        
        if (result.affectedRows > 0) {
            console.log(`✅ Cita ${citaId} cancelada exitosamente`);
            return true;
        }
        
        console.log(`⚠️ No se pudo cancelar la cita ${citaId}`);
        return false;
    } catch (error) {
        console.error('❌ Error cancelando cita:', error);
        return false;
    }
}

// ✅ Reagendar cita
async function reagendarCita(citaId, nuevaFecha, nuevaHora) {
    try {
        const [result] = await pool.query(
            `UPDATE citas 
             SET fecha_cita = ?, 
                 hora_cita = ?,
                 observaciones = CONCAT(IFNULL(observaciones, ''), '\n[Reagendado via WhatsApp] ')
             WHERE id = ? AND estado IN ('Programada', 'Confirmada')`,
            [nuevaFecha, nuevaHora, citaId]
        );
        
        if (result.affectedRows > 0) {
            console.log(`✅ Cita ${citaId} reagendada a ${nuevaFecha} ${nuevaHora}`);
            return true;
        }
        
        console.log(`⚠️ No se pudo reagendar la cita ${citaId}`);
        return false;
    } catch (error) {
        console.error('❌ Error reagendando cita:', error);
        return false;
    }
}

// --- NUEVAS FUNCIONES PARA EL MODO DOCTOR (GRUPO) ---

// 1. Ver Agenda del Día (Para el Doctor)
async function obtenerAgendaDia(fecha) {
    try {
        const [rows] = await pool.query(
            `SELECT 
                c.hora_cita, p.nombre, p.apellido_paterno, c.tipo_cita, c.estado 
             FROM citas c
             JOIN pacientes p ON c.paciente_id = p.id
             WHERE c.fecha_cita = ? AND c.estado != 'Cancelada'
             ORDER BY c.hora_cita ASC`,
            [fecha]
        );
        return rows;
    } catch (error) {
        console.error('Error admin agenda:', error);
        return [];
    }
}

// 2. Resumen Financiero (Opcional, si tienes tabla de pagos)
// Por ahora simularemos que cuenta citas confirmadas
async function obtenerResumenDia(fecha) {
    try {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as total, tipo_cita FROM citas 
             WHERE fecha_cita = ? AND estado != 'Cancelada' 
             GROUP BY tipo_cita`,
            [fecha]
        );
        return rows;
    } catch (e) { return []; }
}

module.exports = { 
    obtenerHorasOcupadas, 
    agendarCitaEnBaseDatos,
    obtenerInfoPaciente,
    obtenerHistorialCitas,
    obtenerCitasPaciente,
    obtenerAgendaDia,
    obtenerResumenDia,
    cancelarCita,
    reagendarCita
};