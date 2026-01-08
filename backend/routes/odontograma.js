const express = require('express');
const router = express.Router();
const pool = require('../config/database').pool;

// 📌 GET piezas dentales por paciente
router.get('/:pacienteId', async (req, res) => {
  const pacienteId = parseInt(req.params.pacienteId, 10);
  if (!pacienteId) {
    return res.status(400).json({ success: false, error: 'ID inválido' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM odontograma WHERE paciente_id = ? ORDER BY pieza_dental`,
      [pacienteId]
    );
    res.json(rows);
  } catch (err) {
    console.error('❌ Error al obtener odontograma:', err);
    res.status(500).json({ success: false, error: 'Error al consultar odontograma' });
  }
});

// 📌 POST para actualizar o crear pieza
router.post('/', async (req, res) => {
  const { paciente_id, pieza_dental, estado } = req.body;

  if (!paciente_id || !pieza_dental || !estado) {
    return res.status(400).json({ success: false, error: 'Datos incompletos' });
  }

  try {
    const [existente] = await pool.execute(
      `SELECT id FROM odontograma WHERE paciente_id = ? AND pieza_dental = ?`,
      [paciente_id, pieza_dental]
    );

    if (existente.length > 0) {
      // actualizar
      await pool.execute(
        `UPDATE odontograma SET estado = ?, fecha_actualizacion = NOW() 
         WHERE paciente_id = ? AND pieza_dental = ?`,
        [estado, paciente_id, pieza_dental]
      );
    } else {
      // insertar nuevo
      await pool.execute(
        `INSERT INTO odontograma (paciente_id, pieza_dental, estado) 
         VALUES (?, ?, ?)`,
        [paciente_id, pieza_dental, estado]
      );
    }

    res.json({ success: true, mensaje: 'Pieza actualizada correctamente' });
  } catch (err) {
    console.error('❌ Error al guardar odontograma:', err);
    res.status(500).json({ success: false, error: 'Error al guardar pieza' });
  }
});

module.exports = router;
