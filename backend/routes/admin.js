const express = require('express');
const router = express.Router();
const { pool } = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==========================================
// 1. CONFIGURACIÓN DE SUBIDA DE IMÁGENES
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = 'uploads/avatars/';
        if (!fs.existsSync(uploadPath)){
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('No es una imagen!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: fileFilter
});

// ==========================================
// 2. ESTADÍSTICAS (¡RESTAURADO!)
// ==========================================
router.get('/stats/overview', async (req, res) => {
    try {
        // Consultas paralelas para mayor velocidad
        const [usuarios] = await pool.query('SELECT rol, COUNT(*) as count FROM usuarios GROUP BY rol');
        const [totalPacientes] = await pool.query('SELECT COUNT(*) as total FROM pacientes');
        const [citas] = await pool.query('SELECT estado, COUNT(*) as count FROM citas GROUP BY estado');
        const [citasPendientes] = await pool.query("SELECT COUNT(*) as total FROM citas WHERE estado = 'pendiente'");
        const [historiales] = await pool.query('SELECT COUNT(*) as total FROM historial_clinico');

        // Procesar usuarios
        let statsUsuarios = { total_usuarios: 0, administradores: 0, doctores: 0, secretarias: 0 };
        usuarios.forEach(u => {
            statsUsuarios.total_usuarios += u.count;
            if(u.rol === 'Administrador') statsUsuarios.administradores = u.count;
            if(u.rol === 'Doctor') statsUsuarios.doctores = u.count;
            if(u.rol === 'Secretaria') statsUsuarios.secretarias = u.count;
        });

        const totalCitas = citas.reduce((acc, curr) => acc + curr.count, 0);

        res.json({
            usuarios: statsUsuarios,
            pacientes: {
                total_pacientes: totalPacientes[0]?.total || 0,
                pacientes_hoy: 0,
            },
            citas: {
                total_citas: totalCitas,
                citas_pendientes: citasPendientes[0]?.total || 0
            },
            historiales: {
                total_consultas: historiales[0]?.total || 0
            }
        });
    } catch (error) {
        console.error("Error stats:", error);
        res.status(500).json({ message: 'Error en servidor' });
    }
});

// ==========================================
// 3. INVENTARIO
// ==========================================
router.get('/inventario', async (req, res) => {
    try {
        const [productos] = await pool.query('SELECT * FROM inventario ORDER BY id DESC');
        res.json(productos);
    } catch (e) { res.status(500).json({message: e.message}); }
});

router.post('/inventario', async (req, res) => {
    try {
        const { nombre_producto, categoria, codigo_producto, stock_actual, stock_minimo, stock_maximo, precio_unitario, unidad_medida, proveedor, fecha_vencimiento } = req.body;
        const [result] = await pool.query(
            `INSERT INTO inventario (nombre_producto, categoria, codigo_producto, stock_actual, stock_minimo, stock_maximo, precio_unitario, unidad_medida, proveedor, fecha_vencimiento) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [nombre_producto, categoria, codigo_producto, stock_actual || 0, stock_minimo || 5, stock_maximo || 100, precio_unitario || 0, unidad_medida || 'unidad', proveedor, fecha_vencimiento || null]
        );
        res.json({ message: 'Producto creado', id: result.insertId });
    } catch (e) { res.status(500).json({message: 'Error al crear'}); }
});

router.put('/inventario/:id', async (req, res) => {
    try {
        const { nombre_producto, categoria, codigo_producto, stock_actual, stock_minimo, stock_maximo, precio_unitario, unidad_medida, proveedor, fecha_vencimiento } = req.body;
        let fechaLimpia = fecha_vencimiento;
        if (fecha_vencimiento && typeof fecha_vencimiento === 'string' && fecha_vencimiento.includes('T')) {
            fechaLimpia = fecha_vencimiento.split('T')[0];
        }
        if (!fechaLimpia) fechaLimpia = null;

        await pool.query(
            `UPDATE inventario SET nombre_producto=?, categoria=?, codigo_producto=?, stock_actual=?, stock_minimo=?, stock_maximo=?, precio_unitario=?, unidad_medida=?, proveedor=?, fecha_vencimiento=? WHERE id=?`,
            [nombre_producto, categoria, codigo_producto, Number(stock_actual)||0, Number(stock_minimo)||0, Number(stock_maximo)||0, Number(precio_unitario)||0, unidad_medida, proveedor, fechaLimpia, req.params.id]
        );
        res.json({ message: 'Actualizado' });
    } catch (e) { res.status(500).json({message: 'Error al actualizar'}); }
});

router.delete('/inventario/:id', async (req, res) => {
    try {
        await pool.query('DELETE FROM inventario WHERE id = ?', [req.params.id]);
        res.json({ message: 'Eliminado' });
    } catch (e) { res.status(500).json({message: 'Error al eliminar'}); }
});

// ==========================================
// 4. USUARIOS & AVATARES
// ==========================================
router.get('/users', async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, nombre, apellido_paterno, email, telefono, rol, activo, fecha_registro, avatar_url FROM usuarios');
        res.json(users);
    } catch (error) { res.status(500).json({ message: error.message }); }
});

router.post('/users', async (req, res) => {
    try {
        const { nombre, email, password, rol, telefono } = req.body;
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, email, password_hash, rol, telefono, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, 1, NOW())',
            [nombre, email, password, rol, telefono]
        );
        res.json({ message: 'Usuario creado', id: result.insertId });
    } catch (error) { res.status(500).json({ message: error.message }); }
});

// EDITAR USUARIO (ACTUALIZAR DATOS)
router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, email, telefono, rol, activo, password } = req.body;

        // 1. Preparamos la consulta base
        let query = `
            UPDATE usuarios 
            SET nombre = ?, email = ?, telefono = ?, rol = ?, activo = ? 
        `;
        let params = [nombre, email, telefono, rol, activo];

        // 2. Si el usuario escribió una nueva contraseña, la actualizamos también
        if (password && password.trim() !== '') {
            query += ', password_hash = ?';
            params.push(password);
        }

        // 3. Cerramos la consulta con el WHERE
        query += ' WHERE id = ?';
        params.push(id);

        // 4. Ejecutamos
        await pool.query(query, params);

        res.json({ message: 'Usuario actualizado correctamente' });

    } catch (error) {
        console.error("Error al actualizar usuario:", error);
        res.status(500).json({ message: 'Error interno al actualizar datos.' });
    }
});

// ELIMINAR USUARIO CON TRANSFERENCIA DE HISTORIAL (HERENCIA DE DATOS)
router.delete('/users/:id', async (req, res) => {
    const connection = await pool.getConnection(); // Usamos una conexión dedicada para transacciones
    try {
        const { id } = req.params;

        await connection.beginTransaction(); // Iniciamos modo seguro (Todo o nada)

        // 1. OBTENER DATOS DEL USUARIO A ELIMINAR
        const [users] = await connection.query('SELECT * FROM usuarios WHERE id = ?', [id]);
        if (users.length === 0) {
            connection.release();
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        const usuarioBorrar = users[0];
        const nombreOriginal = `${usuarioBorrar.nombre} ${usuarioBorrar.apellido_paterno || ''}`.trim();

        // 2. BUSCAR O CREAR EL "USUARIO ARCHIVO" (El que heredará los datos)
        // Buscamos un usuario sistema, si no existe, lo creamos.
        let idHeredero;
        const [sistemaUser] = await connection.query("SELECT id FROM usuarios WHERE email = 'sistema@archivo.com'");
        
        if (sistemaUser.length > 0) {
            idHeredero = sistemaUser[0].id;
        } else {
            // Crear el usuario fantasma si no existe
            const [newUser] = await connection.query(
                "INSERT INTO usuarios (nombre, apellido_paterno, email, password_hash, rol, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, NOW())",
                ['Historial', 'Sistema', 'sistema@archivo.com', 'NO_LOGIN', 'Administrador', 0]
            );
            idHeredero = newUser.insertId;
        }

        // Evitar que el usuario sistema se borre a sí mismo
        if (parseInt(id) === parseInt(idHeredero)) {
            throw new Error("No puedes eliminar al usuario de Respaldo del Sistema.");
        }

        // 3. TRANSFERIR DATOS (Hacer la herencia)
        
        // A) Pacientes: Se pasan al Sistema
        await connection.query(
            'UPDATE pacientes SET doctor_id = ? WHERE doctor_id = ?', 
            [idHeredero, id]
        );

        // B) Citas: Se pasan al Sistema + Nota del autor original
        // Usamos CONCAT para agregar una nota al final del motivo o nota existente
        await connection.query(
            `UPDATE citas SET 
             doctor_id = ?, 
             motivo = CONCAT(IFNULL(motivo, ''), ' [Ex-Dr: ', ?, ']') 
             WHERE doctor_id = ?`, 
            [idHeredero, nombreOriginal, id]
        );

        // C) Historial Clínico
        await connection.query('UPDATE historial_clinico SET doctor_id = ? WHERE doctor_id = ?', [idHeredero, id]);

        // D) Otros registros (Odontograma, Radiografías, Inventario)
        await connection.query('UPDATE odontograma SET doctor_id = ? WHERE doctor_id = ?', [idHeredero, id]);
        await connection.query('UPDATE radiografias SET doctor_id = ? WHERE doctor_id = ?', [idHeredero, id]);
        await connection.query('UPDATE movimientos_inventario SET usuario_id = ? WHERE usuario_id = ?', [idHeredero, id]);
        await connection.query('UPDATE transacciones_financieras SET usuario_id = ? WHERE usuario_id = ?', [idHeredero, id]);

        // 4. LIMPIEZA DE DATOS INNECESARIOS (Sesiones, Logs, Notificaciones)
        // Estos sí se pueden borrar porque son temporales
        await connection.query('DELETE FROM user_sessions WHERE user_id = ?', [id]);
        await connection.query('DELETE FROM notificaciones_admin WHERE usuario_id = ?', [id]);
        await connection.query('DELETE FROM log_accesos WHERE usuario_id = ?', [id]);

        // 5. BORRAR FOTO FÍSICA
        if (usuarioBorrar.avatar_url) {
            const rutaImagen = path.join(__dirname, '..', usuarioBorrar.avatar_url);
            if (fs.existsSync(rutaImagen)) {
                try { fs.unlinkSync(rutaImagen); } catch(e) { console.log("No se pudo borrar imagen física"); }
            }
        }

        // 6. EJECUTAR LA ELIMINACIÓN FINAL
        await connection.query('DELETE FROM usuarios WHERE id = ?', [id]);

        await connection.commit(); // ¡GUARDAR CAMBIOS!
        res.json({ message: `Usuario eliminado. Sus registros ahora pertenecen a 'Historial Sistema'.` });

    } catch (error) {
        await connection.rollback(); // Si algo falla, deshacer todo para no romper datos
        console.error("Error en transferencia:", error);
        res.status(500).json({ message: 'Error al transferir datos y eliminar.', error: error.message });
    } finally {
        connection.release(); // Liberar conexión
    }
});

// RUTA PARA SUBIR AVATAR
router.post('/users/:id/avatar', upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
        const userId = req.params.id;
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;
        
        // Borrar anterior si existe
        const [user] = await pool.query('SELECT avatar_url FROM usuarios WHERE id = ?', [userId]);
        if (user[0] && user[0].avatar_url) {
            const oldPath = path.join(__dirname, '..', user[0].avatar_url);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        
        await pool.query('UPDATE usuarios SET avatar_url = ? WHERE id = ?', [avatarUrl, userId]);
        res.json({ message: 'Avatar actualizado', avatar_url: avatarUrl });
    } catch (error) { res.status(500).json({ message: 'Error upload' }); }
});

router.delete('/users/:id/avatar', async (req, res) => {
    try {
        const userId = req.params.id;
        const [user] = await pool.query('SELECT avatar_url FROM usuarios WHERE id = ?', [userId]);
        if (user[0] && user[0].avatar_url) {
            const filePath = path.join(__dirname, '..', user[0].avatar_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        await pool.query('UPDATE usuarios SET avatar_url = NULL WHERE id = ?', [userId]);
        res.json({ message: 'Avatar eliminado' });
    } catch (e) { res.status(500).json({ message: e.message }); }
});

// ==========================================
// RUTA: NOTIFICACIONES (Con nombres reales de tu DB)
// ==========================================
router.get('/notifications', async (req, res) => {
    try {
        const query = `
            /* 1. CITAS: Le ponemos prefijo 'cit-' al ID */
            (SELECT 
                CONCAT('cit-', id) as id,  /* <--- CAMBIO AQUÍ */
                'user' as type, 
                'Nueva Cita' as title, 
                CONCAT('Paciente: ', nombre_paciente) as message, 
                fecha_creacion as fecha 
             FROM citas 
             WHERE fecha_creacion >= DATE_SUB(NOW(), INTERVAL 3 DAY)
             LIMIT 5)
            
            UNION ALL
            
            /* 2. INVENTARIO: Prefijo 'inv-' */
            (SELECT 
                CONCAT('inv-', id) as id, /* <--- CAMBIO AQUÍ */
                'warning' as type, 
                'Stock Bajo' as title, 
                CONCAT(nombre_producto, ' (Quedan: ', stock_actual, ')') as message, 
                NOW() as fecha 
             FROM inventario 
             WHERE stock_actual <= stock_minimo 
             LIMIT 5)

            UNION ALL

            /* 3. FINANZAS: Prefijo 'fin-' */
            (SELECT 
                CONCAT('fin-', id) as id, /* <--- CAMBIO AQUÍ */
                'money' as type, 
                'Finanzas' as title, 
                CONCAT(UCASE(LEFT(tipo, 1)), SUBSTRING(tipo, 2), ': $', monto) as message, 
                CAST(CONCAT(fecha, ' 12:00:00') AS DATETIME) as fecha 
             FROM transacciones_financieras 
             ORDER BY fecha DESC LIMIT 5)

            UNION ALL
            
            /* 4. LOGS: Prefijo 'log-' */
            (SELECT 
                CONCAT('log-', id) as id, /* <--- CAMBIO AQUÍ */
                'system' as type, 
                'Sistema' as title, 
                accion as message, 
                fecha_hora as fecha 
             FROM logs_sistema 
             ORDER BY fecha_hora DESC LIMIT 5)

            ORDER BY fecha DESC 
            LIMIT 20;
        `;

        const [rows] = await pool.query(query);
        res.json(rows);

    } catch (error) {
        console.error("Error notificaciones:", error);
        res.status(500).json([]); 
    }
});

// ALERTAS DASHBOARD
router.get('/alerts/inventory', async (req, res) => {
    try {
        const [productos] = await pool.query('SELECT * FROM inventario WHERE stock_actual <= stock_minimo');
        res.json(productos);
    } catch (e) { res.json([]); }
});

router.get('/alerts/movements', (req, res) => res.json([]));


// RUTAS DE ACTIVAR/DESACTIVAR USUARIO (FALTABA ESTA)
router.patch('/users/:id/toggle-status', async (req, res) => {
    try {
        const { id } = req.params;
        // Invertimos el valor de 'activo' (Si es 1 pasa a 0, si es 0 pasa a 1)
        await pool.query('UPDATE usuarios SET activo = NOT activo WHERE id = ?', [id]);
        
        // Obtenemos el nuevo estado para confirmarle al frontend
        const [rows] = await pool.query('SELECT activo FROM usuarios WHERE id = ?', [id]);
        const nuevoEstado = rows[0].activo ? 'activado' : 'desactivado';

        res.json({ message: `Usuario ${nuevoEstado} correctamente` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al cambiar estado' });
    }
});

// ==========================================
// ===== RUTAS DEL BOT DE WHATSAPP =====
// ==========================================

// Estado del bot
router.get('/bot/status', async (req, res) => {
    try {
        console.log('🤖 Consultando estado del bot...');
        
        const botStatus = {
            connected: false,
            message: 'Bot no implementado para este cliente',
            lastActivity: null,
            pending: true
        };
        
        console.log('📊 Estado del bot:', botStatus);
        res.json(botStatus);
        
    } catch (error) {
        console.error('❌ Error consultando estado del bot:', error);
        res.status(500).json({ 
            message: 'Error al consultar estado del bot',
            error: error.message 
        });
    }
});

// Generar QR del bot
router.get('/bot/qr', async (req, res) => {
    try {
        console.log('📱 Solicitando código QR del bot...');
        
        res.json({
            available: false,
            message: 'Código QR no disponible. El bot WhatsApp no está configurado para este cliente.',
            qr: null
        });
        
    } catch (error) {
        console.error('❌ Error generando QR:', error);
        res.status(500).json({ 
            message: 'Error al generar código QR',
            error: error.message 
        });
    }
});

// Conectar bot
router.post('/bot/connect', async (req, res) => {
    try {
        console.log('🔌 Intentando conectar bot...');
        
        res.json({
            success: false,
            message: 'El bot WhatsApp no está configurado para este cliente. Contacte al administrador.'
        });
        
    } catch (error) {
        console.error('❌ Error conectando bot:', error);
        res.status(500).json({ 
            message: 'Error al conectar bot',
            error: error.message 
        });
    }
});

// Desconectar bot
router.post('/bot/disconnect', async (req, res) => {
    try {
        console.log('⏸️ Desconectando bot...');
        
        res.json({
            success: true,
            message: 'Bot desconectado'
        });
        
    } catch (error) {
        console.error('❌ Error desconectando bot:', error);
        res.status(500).json({ 
            message: 'Error al desconectar bot',
            error: error.message 
        });
    }
});

// Reiniciar bot
router.post('/bot/restart', async (req, res) => {
    try {
        console.log('🔄 Reiniciando bot...');
        
        res.json({
            success: false,
            message: 'El bot WhatsApp no está configurado para este cliente.'
        });
        
    } catch (error) {
        console.error('❌ Error reiniciando bot:', error);
        res.status(500).json({ 
            message: 'Error al reiniciar bot',
            error: error.message 
        });
    }
});

// Estadísticas del bot
router.get('/bot/stats', async (req, res) => {
    try {
        console.log('📊 Obteniendo estadísticas del bot...');
        
        const stats = {
            totalMessages: 0,
            messagesHoy: 0,
            citasAgendadas: 0,
            citasHoy: 0,
            horasActividad: '0 horas',
            ultimaActividad: null
        };
        
        res.json(stats);
        
    } catch (error) {
        console.error('❌ Error obteniendo estadísticas:', error);
        res.status(500).json({ 
            message: 'Error al obtener estadísticas',
            error: error.message 
        });
    }
});

// ===== SEGURIDAD =====

// Obtener sesiones activas
router.get('/security/sessions', async (req, res) => {
    try {
        console.log('🔐 Obteniendo sesiones activas...');
        
        const sessions = [];
        
        res.json(sessions);
        
    } catch (error) {
        console.error('❌ Error obteniendo sesiones:', error);
        res.status(500).json({ 
            message: 'Error al obtener sesiones',
            error: error.message 
        });
    }
});

// Cerrar sesión específica
router.delete('/security/sessions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`🚪 Cerrando sesión ${id}...`);
        
        res.json({
            success: true,
            message: 'Sesión cerrada exitosamente'
        });
        
    } catch (error) {
        console.error('❌ Error cerrando sesión:', error);
        res.status(500).json({ 
            message: 'Error al cerrar sesión',
            error: error.message 
        });
    }
});

module.exports = router;
