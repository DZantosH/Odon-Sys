// middleware/auth.js
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Middleware de verificación de token
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token no proporcionado',
        needsAuth: true 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado', 
          needsRefresh: true,
          expiredAt: error.expiredAt
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          needsAuth: true 
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error en verificación de token:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar roles (Doctor o Secretaria)
const verifyDoctorOrSecretaria = async (req, res, next) => {
  try {
    // El token ya fue verificado por verifyToken
    const userRole = req.user.rol;
    
    if (userRole !== 'Doctor' && userRole !== 'Secretaria') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Doctor o Secretaria' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error en verificación de rol:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar solo Doctor
const verifyDoctor = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    
    if (userRole !== 'Doctor') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Doctor' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error en verificación de rol de doctor:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware para verificar solo Administrador
const verifyAdmin = async (req, res, next) => {
  try {
    const userRole = req.user.rol;
    
    if (userRole !== 'Administrador') {
      return res.status(403).json({ 
        error: 'Acceso denegado. Se requiere rol de Administrador' 
      });
    }
    
    next();
  } catch (error) {
    console.error('Error en verificación de rol de admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

// Middleware combinado para verificar token Y que sea administrador
const verifyAdminAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        error: 'Token no proporcionado',
        needsAuth: true 
      });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave-secreta-temporal');
      
      // Verificar que sea administrador
      if (decoded.rol !== 'Administrador') {
        return res.status(403).json({ 
          error: 'Acceso denegado. Se requiere rol de Administrador' 
        });
      }
      
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          error: 'Token expirado', 
          needsRefresh: true,
          expiredAt: error.expiredAt
        });
      } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          error: 'Token inválido',
          needsAuth: true 
        });
      } else {
        throw error;
      }
    }
  } catch (error) {
    console.error('Error en verificación de admin:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

module.exports = {
  verifyToken,
  verifyDoctorOrSecretaria,
  verifyDoctor,
  verifyAdmin,
  verifyAdminAuth  // ← Agregar esta línea
};