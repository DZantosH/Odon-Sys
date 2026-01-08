const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { pool } = require('../config/database');

const router = express.Router();

// 🔧 FUNCIÓN PARA DETECTAR TIPO DE CONTRASEÑA
const isHashedPassword = (password) => {
  return password && password.startsWith('$2') && password.length >= 50;
};

// Login con soporte para contraseñas mixtas
router.post('/login', [
    body('email').isEmail().withMessage('Email válido requerido'),
    body('password').isLength({ min: 1 }).withMessage('Contraseña requerida')
], async (req, res) => {
    console.log('=== LOGIN REQUEST ===');
    console.log('Body:', req.body);
    
    try {
        // Validar entrada
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;
        console.log('Email:', email);
        console.log('Password received:', password);
        
        // Buscar usuario
        const query = 'SELECT * FROM usuarios WHERE email = ? AND activo = 1';
        const [results] = await pool.execute(query, [email]);

        console.log('Users found:', results.length);

        if (results.length === 0) {
            console.log('No user found');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = results[0];
        console.log('User found:', user.email);
        console.log('Password in DB:', user.password);
        
        // 🔧 VERIFICACIÓN INTELIGENTE DE CONTRASEÑA
        const dbPassword = user.password ? user.password.toString().trim() : '';
        const receivedPassword = password ? password.toString().trim() : '';
        
        let isValidPassword = false;
        
        if (isHashedPassword(dbPassword)) {
            // Contraseña hasheada - usar bcrypt
            console.log('🔒 Verificando contraseña hasheada con bcrypt...');
            isValidPassword = await bcrypt.compare(receivedPassword, dbPassword);
            console.log('Bcrypt comparison result:', isValidPassword);
        } else {
            // Contraseña en texto plano - comparación directa
            console.log('⚠️  Verificando contraseña en texto plano...');
            console.log('DB Password:', `"${dbPassword}"`);
            console.log('Received Password:', `"${receivedPassword}"`);
            isValidPassword = (dbPassword === receivedPassword);
            console.log('Plain text comparison result:', isValidPassword);
            
            // 🚀 AUTO-MIGRACIÓN: Si el login es exitoso, hashear la contraseña
            if (isValidPassword) {
                console.log('🔄 Auto-migrando contraseña a bcrypt...');
                try {
                    const hashedPassword = await bcrypt.hash(receivedPassword, 10);
                    await pool.execute(
                        'UPDATE usuarios SET password = ? WHERE id = ?',
                        [hashedPassword, user.id]
                    );
                    console.log('✅ Contraseña migrada automáticamente');
                } catch (error) {
                    console.error('❌ Error auto-migrando contraseña:', error);
                    // No fallar el login por esto
                }
            }
        }
        
        console.log('Final password match:', isValidPassword);
        
        if (!isValidPassword) {
            console.log('Invalid password - sending 401');
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        console.log('Password is valid, generating token...');

        // Generar token JWT
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                rol: user.rol,
                nombre: user.nombre
            },
            process.env.JWT_SECRET || 'clave-secreta-temporal',
            { expiresIn: '8h' }
        );

        console.log('Token generated successfully');
        console.log('Sending successful response...');

        // Responder con token y datos del usuario
        res.json({
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre,
                apellido_paterno: user.apellido_paterno,
                apellido_materno: user.apellido_materno,
                email: user.email,
                rol: user.rol,
                telefono: user.telefono
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 🔒 LOGOUT
router.post('/logout', async (req, res) => {
    try {
        const { action = 'manual', timestamp } = req.body;
        const authHeader = req.headers.authorization;
        
        let userId = null;

        // Intentar extraer información del token si está presente
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.substring(7);
                const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');
                userId = decoded.id;
            } catch (jwtError) {
                console.log('Token inválido en logout:', jwtError.message);
            }
        }

        console.log(`🔐 Logout ${action} - Usuario ID: ${userId}`);

        res.json({
            success: true,
            message: 'Logout registrado exitosamente',
            action,
            timestamp: timestamp || new Date().toISOString()
        });

    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({
            success: false,
            message: 'Error al procesar logout'
        });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');
        
        const query = 'SELECT id, nombre, apellido_paterno, apellido_materno, email, rol, telefono FROM usuarios WHERE id = ? AND activo = 1';
        const [results] = await pool.execute(query, [decoded.id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            valid: true,
            user: results[0]
        });

    } catch (error) {
        console.error('Error verificando token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
});

// 🔒 Verificar sesión
router.get('/verify-session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');

        // Verificar que el usuario sigue activo
        const [usuarios] = await pool.execute(
            'SELECT * FROM usuarios WHERE id = ? AND activo = 1',
            [decoded.id]
        );

        if (usuarios.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Usuario no encontrado o inactivo'
            });
        }

        const usuario = usuarios[0];
        const { password: _, ...usuarioSeguro } = usuario;

        res.json({
            success: true,
            message: 'Sesión válida',
            user: usuarioSeguro,
            tokenExpiry: decoded.exp * 1000
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado'
            });
        }

        console.error('Error verificando sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// 🔒 Extender sesión
router.post('/extend-session', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado'
            });
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');

        // Generar nuevo token con tiempo extendido
        const newToken = jwt.sign(
            { 
                id: decoded.id, 
                email: decoded.email,
                rol: decoded.rol,
                nombre: decoded.nombre
            },
            process.env.JWT_SECRET || 'clave-secreta-temporal',
            { expiresIn: '8h' }
        );

        console.log(`🔄 Sesión extendida para usuario ID: ${decoded.id}`);

        res.json({
            success: true,
            message: 'Sesión extendida exitosamente',
            token: newToken,
            expiresAt: (jwt.decode(newToken).exp) * 1000
        });

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado, inicie sesión nuevamente'
            });
        }

        console.error('Error extendiendo sesión:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

// 🔧 CAMBIAR CONTRASEÑA CON BCRYPT
router.put('/change-password', [
    body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
    body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Token no proporcionado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');
        const { currentPassword, newPassword } = req.body;

        // Obtener usuario actual
        const query = 'SELECT password FROM usuarios WHERE id = ?';
        const [results] = await pool.execute(query, [decoded.id]);

        if (results.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const user = results[0];
        const dbPassword = user.password;
        
        // Verificar contraseña actual (soporte para ambos tipos)
        let isValidPassword = false;
        
        if (isHashedPassword(dbPassword)) {
            isValidPassword = await bcrypt.compare(currentPassword, dbPassword);
        } else {
            isValidPassword = (currentPassword === dbPassword);
        }
        
        if (!isValidPassword) {
            return res.status(401).json({ error: 'Contraseña actual incorrecta' });
        }

        // Hashear nueva contraseña
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        
        // Actualizar contraseña
        const updateQuery = 'UPDATE usuarios SET password = ? WHERE id = ?';
        await pool.execute(updateQuery, [hashedPassword, decoded.id]);

        console.log(`🔑 Contraseña actualizada para usuario ID: ${decoded.id}`);
        res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
        console.error('Error al cambiar contraseña:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 🔒 Endpoint de prueba para el sistema de sesiones
router.get('/session-test', (req, res) => {
    res.json({
        message: 'Sistema de sesiones funcionando',
        timestamp: new Date().toISOString(),
        features: {
            bcrypt_support: true,
            auto_migration: true,
            mixed_passwords: true,
            jwt_tokens: true,
            session_tracking: true
        },
        endpoints: {
            login: 'POST /api/auth/login',
            logout: 'POST /api/auth/logout',
            verify: 'GET /api/auth/verify',
            verify_session: 'GET /api/auth/verify-session',
            extend_session: 'POST /api/auth/extend-session',
            change_password: 'PUT /api/auth/change-password'
        }
    });
});

module.exports = router;