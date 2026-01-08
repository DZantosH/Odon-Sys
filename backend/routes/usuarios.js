const express = require("express");
const router = express.Router();
const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');


// Obtener todos los usuarios
router.get("/", async (req, res) => {
  try {
    console.log("🔍 [BACKEND] Obteniendo todos los usuarios...");
    const [rows] = await pool.query("SELECT * FROM usuarios");
    console.log("✅ [BACKEND] Usuarios obtenidos:", rows.length);
    res.json(rows);
  } catch (error) {
    console.error("❌ [BACKEND] Error al obtener usuarios:", error);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});

// Obtener solo los doctores - CON DEBUG DETALLADO
router.get("/doctores", async (req, res) => {
  try {
    console.log("🔍 [BACKEND] =================================");
    console.log("🔍 [BACKEND] Iniciando obtención de doctores...");
    console.log("🔍 [BACKEND] Pool disponible:", !!pool);
    console.log("🔍 [BACKEND] Tipo de pool:", typeof pool);
    
    const query = "SELECT id, nombre, apellido_paterno, apellido_materno FROM usuarios WHERE rol = 'Doctor' AND activo = 1";
    console.log("🔍 [BACKEND] Query a ejecutar:", query);
    
    console.log("🔍 [BACKEND] Ejecutando query...");
    const [rows] = await pool.query(query);
    
    console.log("✅ [BACKEND] Query ejecutada exitosamente");
    console.log("✅ [BACKEND] Doctores obtenidos:", rows);
    console.log("✅ [BACKEND] Cantidad de doctores:", rows.length);
    console.log("✅ [BACKEND] Primer doctor:", rows[0] || 'Ninguno');
    console.log("🔍 [BACKEND] =================================");
    
    res.json(rows);
  } catch (error) {
    console.error("❌ [BACKEND] =================================");
    console.error("❌ [BACKEND] ERROR DETALLADO:");
    console.error("❌ [BACKEND] Error completo:", error);
    console.error("❌ [BACKEND] Error message:", error.message);
    console.error("❌ [BACKEND] Error code:", error.code);
    console.error("❌ [BACKEND] Error errno:", error.errno);
    console.error("❌ [BACKEND] Error sqlState:", error.sqlState);
    console.error("❌ [BACKEND] Error sqlMessage:", error.sqlMessage);
    console.error("❌ [BACKEND] Error stack:", error.stack);
    console.error("❌ [BACKEND] =================================");
    
    res.status(500).json({ 
      error: "Error al obtener doctores",
      details: error.message,
      code: error.code
    });
  }
});

// Crear nuevo usuario
router.post("/", async (req, res) => {
  try {
    console.log("🔍 [BACKEND] Creando nuevo usuario...");
    const {
      nombre,
      apellido_paterno,
      apellido_materno,
      email,
      password,
      rol,
      telefono,
    } = req.body;

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, apellido_paterno, apellido_materno, email, password, rol, telefono) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [nombre, apellido_paterno, apellido_materno, email, password, rol, telefono]
    );

    console.log("✅ [BACKEND] Usuario creado con ID:", result.insertId);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    console.error("❌ [BACKEND] Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear usuario" });
  }
});


// Agregar al final del archivo, antes de module.exports
router.get('/list-all', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, nombre, email, rol FROM usuarios WHERE activo = 1");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// En routes/usuarios.js, agrega esta ruta temporal:
router.get('/list-passwords', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT email, password FROM usuarios WHERE activo = 1");
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;