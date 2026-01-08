import React, { useEffect, useState } from 'react';
import { DateTime } from 'luxon';
import { FaTooth, FaBell, FaQuestionCircle, FaUserCircle, FaCog, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';
import { MdDashboard } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import BaseModal from '../components/modals/ModalSystem';
import '../css/PanelPrincipal.css';

const Navbar = () => {
  const [horaActual, setHoraActual] = useState('');
  const [fechaActual, setFechaActual] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  // ✅ ESTADO PARA DATOS DEL USUARIO AUTENTICADO
  const [userData, setUserData] = useState({
    nombre: '',
    email: '',
    rol: '',
    iniciales: '',
    nombreCompleto: ''
  });
  
  const navigate = useNavigate();

  // ✅ FUNCIÓN PARA OBTENER EL TÍTULO DE PÁGINA ADAPTATIVO
  const getPageTitle = () => {
    if (windowWidth < 480) {
      return null; // No mostrar en móviles muy pequeños
    } else if (windowWidth < 600) {
      return "Dashboard";
    } else if (windowWidth < 900) {
      return "Panel";
    } else {
      return "Panel de Control";
    }
  };

  // ✅ FUNCIÓN PARA MANEJAR EL RESIZE DE VENTANA
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ FUNCIÓN PARA CARGAR DATOS DEL USUARIO
  const cargarDatosUsuario = () => {
    try {
      const userDataFromStorage = localStorage.getItem('userData');
      const userFromStorage = localStorage.getItem('user');
      
      let datosUsuario = null;
      
      if (userDataFromStorage) {
        datosUsuario = JSON.parse(userDataFromStorage);
      } else if (userFromStorage) {
        datosUsuario = JSON.parse(userFromStorage);
      }
      
      if (datosUsuario) {
        console.log('📋 Datos del usuario encontrados:', datosUsuario);
        
        const nombre = datosUsuario.nombre || datosUsuario.first_name || datosUsuario.firstName || '';
        const apellido = datosUsuario.apellido || datosUsuario.last_name || datosUsuario.lastName || '';
        const email = datosUsuario.email || datosUsuario.correo || datosUsuario.correo_electronico || '';
        const rol = datosUsuario.rol || datosUsuario.role || datosUsuario.tipo_usuario || 'Usuario';
        
        const nombreCompleto = `${nombre} ${apellido}`.trim() || email.split('@')[0] || 'Usuario';
        const iniciales = crearIniciales(nombre, apellido, email);
        const rolFormateado = formatearRol(rol);
        
        setUserData({
          nombre: nombreCompleto,
          email: email,
          rol: rolFormateado,
          iniciales: iniciales,
          nombreCompleto: nombreCompleto
        });
        
      } else {
        console.warn('⚠️ No se encontraron datos del usuario en localStorage');
        setUserData({
          nombre: 'Usuario',
          email: 'usuario@sistema.com',
          rol: 'USUARIO',
          iniciales: 'U',
          nombreCompleto: 'Usuario'
        });
      }
      
    } catch (error) {
      console.error('❌ Error al cargar datos del usuario:', error);
      setUserData({
        nombre: 'Usuario',
        email: 'usuario@sistema.com',
        rol: 'USUARIO',
        iniciales: 'U',
        nombreCompleto: 'Usuario'
      });
    }
  };

  // ✅ FUNCIÓN PARA CREAR INICIALES
  const crearIniciales = (nombre, apellido, email) => {
    if (nombre && apellido) {
      return `${nombre.charAt(0).toUpperCase()}${apellido.charAt(0).toUpperCase()}`;
    } else if (nombre) {
      return nombre.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // ✅ FUNCIÓN PARA FORMATEAR ROL
  const formatearRol = (rol) => {
    if (!rol) return 'USUARIO';
    
    const rolFormateado = rol.toString().toUpperCase().replace(/_/g, ' ');
    
    const mapeoRoles = {
      'ADMIN': 'ADMINISTRADOR',
      'ADMINISTRATOR': 'ADMINISTRADOR',
      'DOCTOR': 'DOCTOR',
      'DENTIST': 'DENTISTA',
      'ODONTOLOGO': 'ODONTÓLOGO',
      'ASSISTANT': 'ASISTENTE',
      'SECRETARY': 'SECRETARIO/A',
      'RECEPCIONISTA': 'RECEPCIONISTA',
      'USER': 'USUARIO'
    };
    
    return mapeoRoles[rolFormateado] || rolFormateado;
  };

  // ✅ CARGAR DATOS DEL USUARIO AL MONTAR EL COMPONENTE
  useEffect(() => {
    cargarDatosUsuario();
  }, []);

  useEffect(() => {
    const actualizarHora = () => {
      const cdmxNow = DateTime.now().setZone('America/Mexico_City');
      const hora = cdmxNow.toFormat('HH:mm');
      const fecha = cdmxNow.setLocale('es').toFormat("cccc, dd 'de' LLLL 'de' yyyy");
      setHoraActual(hora);
      setFechaActual(capitalizeWords(fecha));
    };

    actualizarHora();
    const intervalo = setInterval(actualizarHora, 1000);
    return () => clearInterval(intervalo);
  }, []);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.user-menu-container')) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, (c) => c.toUpperCase());

  const handleAbrirManualUsuario = () => {
    navigate('/ManualUsuario');
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
  };

  const handleProfile = () => {
    console.log('Abrir perfil de usuario');
    setShowUserMenu(false);
    navigate('/perfil');
  };

  const handleSettings = () => {
    console.log('Abrir configuración');
    setShowUserMenu(false);
    navigate('/configuracion');
  };

  const handleLogoutClick = () => {
    setShowUserMenu(false);
    setShowLogoutModal(true);
  };

  const confirmarLogout = () => {
    try {
      console.log('🔓 Iniciando proceso de logout...');
      
      const keysToRemove = [
        'token', 'userData', 'user', 'authToken', 'accessToken',
        'refreshToken', 'userSession', 'loginData'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      
      try {
        localStorage.clear();
        sessionStorage.clear();
      } catch (storageError) {
        console.warn('⚠️ No se pudo limpiar completamente el storage:', storageError);
      }
      
      console.log('✅ Datos de sesión limpiados exitosamente');
      console.log('🔄 Redirigiendo al login...');
      
      const loginUrl = window.location.origin + '/';
      window.location.replace(loginUrl);
      
    } catch (error) {
      console.error('❌ Error durante el logout:', error);
      try {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = '/';
      } catch (fallbackError) {
        console.error('❌ Error en fallback:', fallbackError);
        window.location.reload();
      }
    }
  };

  const pageTitle = getPageTitle();

  return (
    <>
      <div className="navbar">
        <div className="navbar-left">
          <div className="navbar-brand">
            <span className="brand-icon">🦷</span>
            <div className="brand-info">
              <div className="brand-name">
                {windowWidth < 600 ? 'Odont-SIS' : 'Odont-SISTEMA'}
              </div>
              {windowWidth > 768 && (
                <div className="brand-subtitle">Sistema Odontológico</div>
              )}
            </div>
          </div>
          
          {pageTitle && (
            <>
              <div className="navbar-divider"></div>
              <div className="navbar-page">
                <span className="page-icon">📊</span>
                <span className="page-title">{pageTitle}</span>
              </div>
            </>
          )}
        </div>

        {/* ✅ SOLO MOSTRAR CENTRO EN PANTALLAS GRANDES */}
        {windowWidth > 768 && (
          <div className="navbar-center">
            <div className="datetime-info">
              <div className="time-display">
                <span className="time-icon">🕐</span>
                <span className="time-text">{horaActual}</span>
              </div>
              <div className="date-display">{fechaActual}</div>
            </div>
          </div>
        )}

        <div className="navbar-right">
          <div className="navbar-actions">
            <button className="action-btn notifications-btn" title="Notificaciones">
              <span>🔔</span>
              <div className="notification-badge">3</div>
            </button>
            {windowWidth > 480 && (
              <button 
                className="action-btn help-btn" 
                onClick={handleAbrirManualUsuario}
                title="Manual de Usuario - Ayuda"
              >
                <span>❓</span>
              </button>
            )}
          </div>

          {/* ✅ MENÚ DE USUARIO ADAPTATIVO */}
          <div className="user-menu-container">
            <div 
              className={`user-menu-trigger ${showUserMenu ? 'active' : ''}`}
              onClick={toggleUserMenu}
            >
              <div className="user-avatar">{userData.iniciales}</div>
              {windowWidth > 768 && (
                <div className="user-info">
                  <span className="user-name">{userData.nombre}</span>
                  <span className="user-role">{userData.rol}</span>
                </div>
              )}
              <FaChevronDown className={`dropdown-arrow ${showUserMenu ? 'rotated' : ''}`} />
            </div>

            {/* ✅ DROPDOWN MENU */}
            {showUserMenu && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-info">
                    <div className="dropdown-avatar">{userData.iniciales}</div>
                    <div className="dropdown-details">
                      <span className="dropdown-name">{userData.nombreCompleto}</span>
                      <span className="dropdown-email">{userData.email}</span>
                      <span className="dropdown-role">{userData.rol}</span>
                    </div>
                  </div>
                </div>
                
                <div className="dropdown-items">
                  <button className="dropdown-item" onClick={handleProfile}>
                    <FaUserCircle className="dropdown-icon" />
                    <span className="dropdown-text">Mi Perfil</span>
                  </button>
                  
                  <button className="dropdown-item" onClick={handleSettings}>
                    <FaCog className="dropdown-icon" />
                    <span className="dropdown-text">Configuración</span>
                  </button>
                  
                  <button className="dropdown-item logout-item" onClick={handleLogoutClick}>
                    <FaSignOutAlt className="dropdown-icon" />
                    <span className="dropdown-text">Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✅ MODAL DE CONFIRMACIÓN DE LOGOUT */}
      <BaseModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        title="¿Estás seguro que deseas cerrar sesión?"
        icon="🚪"
        position="top-left"
        size="medium"
      >
        <div className="modern-confirm-content" style={{ padding: '0' }}>
          <p className="modern-confirm-message" style={{ 
            margin: '0 0 24px 0',
            fontSize: '1rem',
            color: '#6b7280',
            lineHeight: '1.5'
          }}>
            Se cerrará tu sesión actual y tendrás que volver a iniciar sesión para acceder al sistema.
          </p>
          
          <div className="modern-confirm-actions" style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center'
          }}>
            <button 
              className="modern-btn-confirm modern-btn-warning"
              onClick={confirmarLogout}
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                minWidth: '120px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}
            >
              🚪 Sí, cerrar sesión
            </button>
            <button 
              className="modern-btn-cancel"
              onClick={() => setShowLogoutModal(false)}
              style={{
                background: 'white',
                color: '#6b7280',
                border: '2px solid #e5e7eb',
                padding: '10px 24px',
                borderRadius: '8px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                fontSize: '0.95rem',
                minWidth: '100px'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      </BaseModal>
    </>
  );
};

export default Navbar;