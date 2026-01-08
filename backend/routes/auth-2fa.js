const express = require('express');
const bcrypt = require('bcrypt');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');
const { verifyAdminAuth } = require('../middleware/auth');

const router = express.Router();

// Configurar 2FA - Generar QR y secret
router.post('/setup-2fa', verifyAdminAuth, async (req, res) => {
  try {
    const { pin } = req.body;
    const userId = req.user.id;

    console.log('Setup 2FA - PIN recibido:', pin);
    console.log('Setup 2FA - User ID:', userId);

    // Validar PIN
    if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      return res.status(400).json({ 
        message: 'El PIN debe ser exactamente 6 dígitos numéricos' 
      });
    }

    // Verificar que el usuario sea administrador
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ? AND rol = "Administrador"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(403).json({ 
        message: 'Solo administradores pueden configurar 2FA' 
      });
    }

    const user = users[0];

    // Generar secret para TOTP
    const secret = speakeasy.generateSecret({
      name: `OdontoSys Admin (${user.email})`,
      issuer: 'OdontoSys',
      length: 32
    });

    // Generar código QR
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

    // Hash del PIN usando bcrypt - DECLARAR ANTES DE USAR
    const hashedPin = await bcrypt.hash(pin, 10);
    console.log('PIN original:', pin);
    console.log('PIN hasheado completo:', hashedPin);
    console.log('Longitud del hash:', hashedPin.length);

    // Guardar temporalmente (no activar hasta verificación)
    await pool.execute(
      'UPDATE usuarios SET admin_pin = ?, totp_secret = ?, two_factor_enabled = FALSE WHERE id = ?',
      [hashedPin, secret.base32, userId]
    );

    console.log('Datos guardados en BD para user:', userId);

    res.json({
      qrCode: qrCodeUrl,
      secret: secret.base32,
      manualKey: secret.base32.match(/.{1,4}/g).join(' '),
      message: 'QR generado. Completa la verificación para activar 2FA.'
    });

  } catch (error) {
    console.error('Error en setup-2fa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar configuración de 2FA
router.post('/verify-2fa-setup', verifyAdminAuth, async (req, res) => {
  try {
    const { pin, totpCode } = req.body;
    const userId = req.user.id;

    console.log('=== VERIFY 2FA SETUP ===');
    console.log('PIN recibido:', pin);
    console.log('TOTP recibido:', totpCode);
    console.log('User ID:', userId);

    // Validar datos recibidos
    if (!pin || !totpCode) {
      return res.status(400).json({ message: 'PIN y código TOTP son requeridos' });
    }

    // Obtener datos del usuario
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE id = ? AND rol = "Administrador"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: 'Usuario no autorizado' });
    }

    const user = users[0];
    console.log('PIN leído de BD completo:', user.admin_pin);
    console.log('Longitud PIN en BD:', user.admin_pin ? user.admin_pin.length : 'NULL');
    console.log('TOTP secret en BD:', user.totp_secret);

    // Verificar PIN usando bcrypt
    console.log('Comparando PIN con bcrypt...');
    const validPin = await bcrypt.compare(pin, user.admin_pin);
    console.log('Resultado comparación PIN:', validPin);

    if (!validPin) {
      return res.status(400).json({ message: 'PIN incorrecto' });
    }

    // Verificar código TOTP
    console.log('Verificando código TOTP...');
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2
    });
    console.log('Resultado verificación TOTP:', verified);

    if (!verified) {
      return res.status(400).json({ message: 'Código de autenticación incorrecto' });
    }

    // Activar 2FA
    await pool.execute(
      'UPDATE usuarios SET two_factor_enabled = TRUE WHERE id = ?',
      [userId]
    );

    console.log('2FA activado para usuario:', userId);

    res.json({ message: '2FA configurado exitosamente' });

  } catch (error) {
    console.error('Error en verify-2fa-setup:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Login con 2FA
router.post('/verify-2fa', async (req, res) => {
  try {
    const { email, pin, totpCode } = req.body;

    console.log('=== LOGIN 2FA ===');
    console.log('Email:', email);
    console.log('PIN:', pin);
    console.log('TOTP:', totpCode);

    // Buscar usuario
    const [users] = await pool.execute(
      'SELECT * FROM usuarios WHERE email = ? AND rol = "Administrador" AND activo = TRUE',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: 'Usuario no encontrado o no autorizado' });
    }

    const user = users[0];

    // Verificar que tenga 2FA habilitado
    if (!user.two_factor_enabled || !user.admin_pin || !user.totp_secret) {
      return res.status(400).json({ message: 'Usuario no tiene 2FA configurado' });
    }

    // Verificar PIN usando bcrypt
    const validPin = await bcrypt.compare(pin, user.admin_pin);
    if (!validPin) {
      return res.status(401).json({ message: 'PIN incorrecto' });
    }

    // Verificar código TOTP
    const verified = speakeasy.totp.verify({
      secret: user.totp_secret,
      encoding: 'base32',
      token: totpCode,
      window: 2
    });

    if (!verified) {
      return res.status(401).json({ message: 'Código de autenticación incorrecto' });
    }

    // Generar JWT token
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email, 
        rol: user.rol,
        two_factor_verified: true
      },
      process.env.JWT_SECRET || 'clave-secreta-temporal',
      { expiresIn: '8h' }
    );

    // Registrar login exitoso
    await pool.execute(
      'INSERT INTO logs_sistema (usuario_id, accion, detalles, ip_address) VALUES (?, ?, ?, ?)',
      [user.id, 'LOGIN_2FA', 'Login exitoso con 2FA', req.ip]
    );

    res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });

  } catch (error) {
    console.error('Error en verify-2fa:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

// Verificar estado de 2FA del usuario
router.get('/2fa-status', verifyAdminAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await pool.execute(
      'SELECT two_factor_enabled, admin_pin IS NOT NULL as has_pin, totp_secret IS NOT NULL as has_totp FROM usuarios WHERE id = ? AND rol = "Administrador"',
      [userId]
    );

    if (users.length === 0) {
      return res.status(403).json({ message: 'Usuario no autorizado' });
    }

    const user = users[0];

    res.json({
      twoFactorEnabled: user.two_factor_enabled,
      hasPin: user.has_pin,
      hasTotp: user.has_totp,
      isFullyConfigured: user.two_factor_enabled && user.has_pin && user.has_totp
    });

  } catch (error) {
    console.error('Error en 2fa-status:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

module.exports = router;