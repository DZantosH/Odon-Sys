// pages/HorarioBloqueo.js - CON SISTEMA DE MODALES INTEGRADO
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { verificarHorarioAcceso, esAdministrador } from '../utils/horarioUtils';
import { ConfirmModal, useModal } from '../components/modals/ModalSystem'; // 🆕 IMPORTAR SISTEMA DE MODALES
import '../css/HorarioAcceso.css';

const HorarioBloqueo = () => {
  const [estadoHorario, setEstadoHorario] = useState({
    bloqueado: false,
    horaActual: '',
    proximaApertura: '08:00'
  });
  const [esAdmin, setEsAdmin] = useState(false);
  const [tiempoActual, setTiempoActual] = useState(new Date());
  const [contadorRegresivo, setContadorRegresivo] = useState('');
  const navigate = useNavigate();
  
  // 🆕 USAR EL HOOK DE MODALES PARA CERRAR SESIÓN
  const logoutModal = useModal();

  useEffect(() => {
    // Verificar horario al cargar
    verificarEstadoHorario();
    setEsAdmin(esAdministrador());
    
    // ✅ LÓGICA CON CONTADOR REGRESIVO RESTAURADO
    const intervalo = setInterval(() => {
      const nuevoEstado = verificarHorarioAcceso();
      setEstadoHorario(nuevoEstado);
      
      const ahora = new Date();
      setTiempoActual(ahora);
      
      // Si ya no está bloqueado y no es admin, redirigir
      if (!nuevoEstado.bloqueado && !esAdministrador()) {
        console.log('✅ Horario desbloqueado, redirigiendo al dashboard...');
        navigate('/', { replace: true });
        return;
      }
      
      // 🔄 CALCULAR CONTADOR REGRESIVO HASTA 08:00 AM
      const proximaApertura = new Date(ahora);
      proximaApertura.setHours(8, 0, 0, 0); // 8:00 AM de hoy
      
      // Si ya pasamos las 8:00 AM, la próxima apertura es mañana
      if (ahora >= proximaApertura) {
        proximaApertura.setDate(proximaApertura.getDate() + 1);
      }
      
      const diferencia = proximaApertura.getTime() - ahora.getTime();
      const horas = Math.floor(diferencia / (1000 * 60 * 60));
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60));
      const segundos = Math.floor((diferencia % (1000 * 60)) / 1000);
      
      setContadorRegresivo(`${horas.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`);
    }, 1000);
    
    return () => clearInterval(intervalo);
  }, [navigate]);

  const verificarEstadoHorario = () => {
    const estado = verificarHorarioAcceso();
    setEstadoHorario(estado);
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const esHorarioBloqueado = () => {
    const hora = tiempoActual.getHours();
    return hora >= 0 && hora < 8;
  };

  const handleReintentar = () => {
    console.log('🔄 Verificando acceso nuevamente...');
    const nuevoEstado = verificarHorarioAcceso();
    setEstadoHorario(nuevoEstado);
    
    // Si ya no está bloqueado, redirigir
    if (!nuevoEstado.bloqueado) {
      navigate('/', { replace: true });
    }
  };

  // 🆕 FUNCIÓN MEJORADA PARA CERRAR SESIÓN CON MODAL
  const handleCerrarSesion = () => {
    // Abrir modal de confirmación personalizado desde esquina superior izquierda
    logoutModal.openModal({
      message: 'Se cerrará tu sesión actual durante el horario restringido.',
      userType: esAdmin ? 'Administrador' : 'Usuario',
      currentTime: formatearFecha(tiempoActual)
    });
  };

  // 🆕 CONFIRMAR LOGOUT CON LÓGICA MEJORADA
  const confirmarLogout = () => {
    try {
      console.log('🔓 Cerrando sesión desde horario bloqueado...');
      
      // Limpiar todos los datos de sesión
      const keysToRemove = [
        'token', 'userData', 'user', 'authToken', 'accessToken',
        'refreshToken', 'userSession', 'loginData'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      // Limpiar completamente
      localStorage.clear();
      sessionStorage.clear();
      
      console.log('✅ Sesión cerrada exitosamente desde horario bloqueado');
      
      // 🔧 USAR window.location.replace EN LUGAR DE navigate PARA EVITAR REDIRECCION
      // Esto fuerza una navegación completa que evita la verificación de horario
      window.location.replace('/login');
      
    } catch (error) {
      console.error('❌ Error durante el logout en horario bloqueado:', error);
      
      // Fallback de emergencia
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = '/login';
    }
  };

  const handleContinuarComoAdmin = () => {
    if (esAdmin) {
      console.log('👑 Administrador continuando durante horario restringido');
      navigate('/', { replace: true });
    }
  };

  return (
    <>
      <div className="sistema-bloqueado-overlay">
        <div className="sistema-bloqueado-container">
          {/* Icono principal */}
          <div className="sistema-bloqueado-icon">
            {esAdmin ? '👑' : '🔒'}
          </div>

          {/* Título */}
          <h1 className="sistema-bloqueado-title">
            {esAdmin ? 'Acceso de Administrador' : 'Sistema Temporalmente Cerrado'}
          </h1>

          {/* Mensaje principal */}
          <div className="sistema-bloqueado-message">
            {esAdmin 
              ? 'Como administrador, puedes acceder durante horario restringido.'
              : 'El sistema está disponible de 08:00 a 23:59 horas.'
            }
          </div>

          <div className="sistema-bloqueado-estado estado-info">
            📅 {formatearFecha(tiempoActual)}
          </div>

          {/* Información de horario */}
          <div className="sistema-bloqueado-horario">
            <div className="horario-info-row">
              <span className="horario-label">🕐 Estado Actual:</span>
              <span className={`horario-valor ${esHorarioBloqueado() ? 'bloqueado' : 'permitido'}`}>
                {esHorarioBloqueado() ? 'CERRADO' : 'ABIERTO'}
              </span>
            </div>
            
            <div className="horario-info-row">
              <span className="horario-label">⏰ Horario Normal:</span>
              <span className="horario-valor">08:00 - 23:59</span>
            </div>
            
            <div className="horario-info-row">
              <span className="horario-label">🚫 Horario Restringido:</span>
              <span className="horario-valor">00:00 - 07:59</span>
            </div>
            
            <div className="horario-info-row">
              <span className="horario-label">🔓 Próxima Apertura:</span>
              <span className="horario-valor permitido">{estadoHorario.proximaApertura}</span>
            </div>
          </div>

          {/* 🔄 CONTADOR REGRESIVO */}
          {esHorarioBloqueado() && !esAdmin && (
            <div className="sistema-bloqueado-countdown">
              <div className="countdown-title">
                ⏳ Tiempo hasta la apertura del sistema:
              </div>
              <div className="countdown-timer">
                {contadorRegresivo}
              </div>
            </div>
          )}

          {/* Estados específicos */}
          {esAdmin && esHorarioBloqueado() && (
            <div className="sistema-bloqueado-estado estado-exito">
              ✅ Como administrador, tienes acceso completo las 24 horas
            </div>
          )}

          {!esAdmin && esHorarioBloqueado() && (
            <div className="sistema-bloqueado-estado estado-advertencia">
              ⚠️ Solo los administradores pueden acceder durante este horario
            </div>
          )}

          {/* Botones */}
          <div className="sistema-bloqueado-acciones">
            {esAdmin ? (
              <button 
                className="btn-reintentar"
                onClick={handleContinuarComoAdmin}
              >
                👑 Continuar como Administrador
              </button>
            ) : (
              <button 
                className="btn-reintentar"
                onClick={handleReintentar}
              >
                🔄 Verificar Acceso Nuevamente
              </button>
            )}
            
            <button 
              onClick={handleCerrarSesion}
              className="btn-cerrar-sesion"
            >
              👋 Cerrar Sesión
            </button>
          </div>

          {/* Información adicional */}
          <div className="info-adicional">
            <strong>ℹ️ Información importante:</strong>
            <ul>
              <li>Sistema disponible de <strong>08:00 a 23:59</strong></li>
              <li>Solo administradores acceden de 00:00-07:59</li>
              <li>Mantenimiento automático durante la madrugada</li>
              <li>Contacta al admin para acceso urgente</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 🆕 MODAL DE CONFIRMACIÓN DE LOGOUT DESDE ESQUINA SUPERIOR IZQUIERDA */}
      <ConfirmModal
        isOpen={logoutModal.isOpen}
        onClose={logoutModal.closeModal}
        onConfirm={confirmarLogout}
        title="Cerrar Sesión"
        message={`${logoutModal.modalData.message}\n\n¿Estás seguro de que deseas continuar?`}
        confirmText="Sí, cerrar sesión"
        cancelText="Permanecer en el sistema"
        type="warning"
        icon="🚪"
      />
    </>
  );
};

export default HorarioBloqueo;