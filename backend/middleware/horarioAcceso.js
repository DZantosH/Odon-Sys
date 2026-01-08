const jwt = require('jsonwebtoken');

const verificarHorarioAcceso = (req, res, next) => {
  try {
    // Obtener la hora actual en tu zona horaria (México)
    const ahora = new Date();
    const horaActual = ahora.getHours();
    const minutoActual = ahora.getMinutes();
    
    // Convertir a minutos desde medianoche para comparación fácil
    const minutosTotales = horaActual * 60 + minutoActual;
    const inicioBloqueo = 0; // 00:00 (medianoche)
    const finBloqueo = 8 * 60; // 08:00 (8 AM)
    
    // Verificar si estamos en horario bloqueado (00:00 - 08:00)
    const enHorarioBloqueado = minutosTotales >= inicioBloqueo && minutosTotales < finBloqueo;
    
    console.log(`⏰ Verificación horario - Hora: ${horaActual}:${minutoActual.toString().padStart(2, '0')}, Bloqueado: ${enHorarioBloqueado}`);
    
    if (enHorarioBloqueado) {
      // Obtener información del usuario del token
      const token = req.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Sistema cerrado de 00:00 a 08:00. Solo administradores pueden acceder.',
          horario_bloqueado: true,
          hora_actual: `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`,
          proxima_apertura: '08:00'
        });
      }
      
      // Verificar el rol del usuario
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        console.log(`👤 Usuario verificado: ${decoded.email}, Rol: ${decoded.rol}`);
        
        // Solo permitir administradores durante horario bloqueado
        if (decoded.rol !== 'Administrador' && decoded.tipo_usuario !== 'Administrador') {
          return res.status(403).json({
            success: false,
            message: 'Acceso restringido. El sistema está disponible de 08:00 a 23:59 para doctores.',
            horario_bloqueado: true,
            hora_actual: `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`,
            proxima_apertura: '08:00',
            rol_usuario: decoded.rol
          });
        }
        
        console.log('✅ Administrador verificado - Acceso permitido durante horario bloqueado');
      } catch (jwtError) {
        console.error('❌ Error verificando JWT:', jwtError.message);
        return res.status(401).json({
          success: false,
          message: 'Token inválido durante horario restringido.',
          horario_bloqueado: true
        });
      }
    }
    
    // Si no está en horario bloqueado o es administrador, continuar
    next();
  } catch (error) {
    console.error('❌ Error en verificación de horario:', error);
    // En caso de error, permitir acceso para no bloquear sistema completamente
    next();
  }
};

module.exports = { verificarHorarioAcceso };