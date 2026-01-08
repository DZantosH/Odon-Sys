const express = require('express');
const router = express.Router(); // 🆕 Esta línea faltaba
const { verifyToken, verifyDoctorOrSecretaria } = require('../middleware/auth');

router.get('/paciente/:pacienteId/estudios', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const pool = req.app.locals.db;

        // Obtener estudios de laboratorio del paciente
        const [estudios] = await pool.execute(`
            SELECT 
                id,
                tipo_estudio,
                fecha_solicitud,
                fecha_resultados,
                estado,
                resultados,
                observaciones,
                created_at
            FROM estudios_laboratorio 
            WHERE paciente_id = ?
            ORDER BY fecha_solicitud DESC
        `, [pacienteId]);

        res.json({
            success: true,
            estudios
        });

    } catch (error) {
        console.error('Error al obtener estudios del paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener estudios del paciente',
            error: error.message
        });
    }
});

// Crear nueva consulta
router.post('/', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const {
            paciente_id,
            tipo_consulta_id,
            motivo_consulta,
            diagnostico_previo,
            examen_fisico,
            diagnostico_actual,
            tratamiento,
            observaciones
        } = req.body;

        const pool = req.app.locals.db;

        // Verificar si ya existe una consulta activa para este paciente
        const [consultaExistente] = await pool.execute(
            'SELECT id FROM consultas_actuales WHERE paciente_id = ? AND estado IN ("en_proceso", "pausada")',
            [paciente_id]
        );

        if (consultaExistente.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El paciente ya tiene una consulta activa'
            });
        }

        // Crear nueva consulta
        const [result] = await pool.execute(`
            INSERT INTO consultas_actuales (
                paciente_id, 
                doctor_id, 
                tipo_consulta_id,
                motivo_consulta,
                diagnostico_previo,
                examen_fisico,
                diagnostico_actual,
                tratamiento,
                observaciones,
                estado,
                fecha_inicio
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'en_proceso', NOW())
        `, [
            paciente_id,
            req.user.id,
            tipo_consulta_id,
            motivo_consulta,
            diagnostico_previo,
            examen_fisico,
            diagnostico_actual,
            tratamiento,
            observaciones
        ]);

        res.status(201).json({
            success: true,
            message: 'Consulta creada exitosamente',
            consulta_id: result.insertId
        });

    } catch (error) {
        console.error('Error al crear consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al crear la consulta',
            error: error.message
        });
    }
});

// Obtener consulta actual del paciente
router.get('/paciente/:pacienteId/actual', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const pool = req.app.locals.db;

        const [consultas] = await pool.execute(`
            SELECT 
                ca.*,
                p.nombre as paciente_nombre,
                p.apellido as paciente_apellido,
                u.nombre as doctor_nombre,
                u.apellido as doctor_apellido,
                tc.nombre as tipo_consulta_nombre
            FROM consultas_actuales ca
            LEFT JOIN pacientes p ON ca.paciente_id = p.id
            LEFT JOIN usuarios u ON ca.doctor_id = u.id
            LEFT JOIN tipos_consulta tc ON ca.tipo_consulta_id = tc.id
            WHERE ca.paciente_id = ? AND ca.estado IN ('en_proceso', 'pausada')
            ORDER BY ca.fecha_inicio DESC
            LIMIT 1
        `, [pacienteId]);

        if (consultas.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'No hay consulta activa para este paciente'
            });
        }

        res.json({
            success: true,
            consulta: consultas[0]
        });

    } catch (error) {
        console.error('Error al obtener consulta actual:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener la consulta actual',
            error: error.message
        });
    }
});

// Actualizar consulta
router.put('/:consultaId', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { consultaId } = req.params;
        const {
            motivo_consulta,
            diagnostico_previo,
            examen_fisico,
            diagnostico_actual,
            tratamiento,
            observaciones,
            estado
        } = req.body;

        const pool = req.app.locals.db;

        const [result] = await pool.execute(`
            UPDATE consultas_actuales 
            SET 
                motivo_consulta = ?,
                diagnostico_previo = ?,
                examen_fisico = ?,
                diagnostico_actual = ?,
                tratamiento = ?,
                observaciones = ?,
                estado = ?,
                updated_at = NOW()
            WHERE id = ?
        `, [
            motivo_consulta,
            diagnostico_previo,
            examen_fisico,
            diagnostico_actual,
            tratamiento,
            observaciones,
            estado,
            consultaId
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Consulta actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la consulta',
            error: error.message
        });
    }
});

// Terminar consulta (mover al historial)
router.put('/:consultaId/terminar', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { consultaId } = req.params;
        const pool = req.app.locals.db;

        // Obtener la consulta actual
        const [consulta] = await pool.execute(
            'SELECT * FROM consultas_actuales WHERE id = ?',
            [consultaId]
        );

        if (consulta.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        const consultaData = consulta[0];

        // Insertar en historial clínico
        await pool.execute(`
            INSERT INTO historial_clinico (
                paciente_id,
                doctor_id,
                tipo_consulta_id,
                motivo_consulta,
                diagnostico_previo,
                examen_fisico,
                diagnostico_actual,
                tratamiento,
                observaciones,
                fecha_consulta
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            consultaData.paciente_id,
            consultaData.doctor_id,
            consultaData.tipo_consulta_id,
            consultaData.motivo_consulta,
            consultaData.diagnostico_previo,
            consultaData.examen_fisico,
            consultaData.diagnostico_actual,
            consultaData.tratamiento,
            consultaData.observaciones,
            consultaData.fecha_inicio
        ]);

        // Eliminar de consultas actuales
        await pool.execute('DELETE FROM consultas_actuales WHERE id = ?', [consultaId]);

        res.json({
            success: true,
            message: 'Consulta terminada y guardada en el historial'
        });

    } catch (error) {
        console.error('Error al terminar consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al terminar la consulta',
            error: error.message
        });
    }
});

// Obtener historial de consultas del paciente
router.get('/paciente/:pacienteId/historial', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { pacienteId } = req.params;
        const pool = req.app.locals.db;

        const [historial] = await pool.execute(`
            SELECT 
                hc.*,
                u.nombre as doctor_nombre,
                u.apellido as doctor_apellido,
                tc.nombre as tipo_consulta_nombre
            FROM historial_clinico hc
            LEFT JOIN usuarios u ON hc.doctor_id = u.id
            LEFT JOIN tipos_consulta tc ON hc.tipo_consulta_id = tc.id
            WHERE hc.paciente_id = ?
            ORDER BY hc.fecha_consulta DESC
        `, [pacienteId]);

        res.json({
            success: true,
            historial
        });

    } catch (error) {
        console.error('Error al obtener historial:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener el historial clínico',
            error: error.message
        });
    }
});

// Eliminar consulta
router.delete('/:consultaId', verifyToken, verifyDoctorOrSecretaria, async (req, res) => {
    try {
        const { consultaId } = req.params;
        const pool = req.app.locals.db;

        const [result] = await pool.execute(
            'DELETE FROM consultas_actuales WHERE id = ?',
            [consultaId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consulta no encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Consulta eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar consulta:', error);
        res.status(500).json({
            success: false,
            message: 'Error al eliminar la consulta',
            error: error.message
        });
    }
});

module.exports = router;