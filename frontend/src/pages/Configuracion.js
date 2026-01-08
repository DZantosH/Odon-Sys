// pages/Configuracion.js - Página principal de configuración
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import Navbar from '../components/Navbar';
import PerfilUsuario from '../components/ConfiguracionUsuario/PerfilUsuario';
import ConfiguracionTema from '../components/ConfiguracionUsuario/ConfiguracionTema';
import ConfiguracionGeneral from '../components/ConfiguracionUsuario/ConfiguracionGeneral';
import ConfiguracionNotificaciones from '../components/ConfiguracionUsuario/ConfiguracionNotificaciones';
import ConfiguracionSistema from '../components/ConfiguracionUsuario/ConfiguracionSistema';
import { esAdministrador } from '../utils/horarioUtils';
import { buildApiUrl, getAuthHeaders } from '../config/config';
import '../css/Configuracion.css';

const Configuracion = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Estados principales
  const [activeTab, setActiveTab] = useState('perfil');
  const [loading, setLoading] = useState(false);
  const [mensaje, setMensaje] = useState({ tipo: '', texto: '' });
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Estados del perfil de usuario
  const [perfilData, setPerfilData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    rol: '',
    especialidad: '',
    cedula: ''
  });

  // Estados de configuración
  const [configuracion, setConfiguracion] = useState({
    notificaciones: {
      email: true,
      push: true,
      citas: true,
      inventario: true,
      reportes: false
    },
    preferencias: {
      idioma: 'es',
      zona_horaria: 'America/Mexico_City',
      formato_fecha: 'DD/MM/YYYY',
      formato_hora: '24h'
    },
    privacidad: {
      mostrar_perfil: true,
      compartir_datos: false,
      analytics: true
    }
  });

  // Verificar rol de administrador al cargar
  useEffect(() => {
    const verificarAdmin = () => {
      const esAdminUtil = esAdministrador();
      const rolUsuario = user?.rol || '';
      const esAdminContext = rolUsuario.toLowerCase() === 'administrador';
      
      setIsAdmin(esAdminUtil || esAdminContext);
    };

    verificarAdmin();
  }, [user]);

  // Cargar datos del usuario al iniciar
  useEffect(() => {
    if (user) {
      setPerfilData({
        nombre: user.nombre || '',
        apellido_paterno: user.apellido_paterno || '',
        apellido_materno: user.apellido_materno || '',
        email: user.email || '',
        telefono: user.telefono || '',
        rol: user.rol || '',
        especialidad: user.especialidad || '',
        cedula: user.cedula || ''
      });
    }
  }, [user]);

  // Función para mostrar mensajes
  const mostrarMensaje = (tipo, texto) => {
    setMensaje({ tipo, texto });
    setTimeout(() => {
      setMensaje({ tipo: '', texto: '' });
    }, 5000);
  };

  // Función para actualizar perfil
  const actualizarPerfil = async (nuevosDatos) => {
    try {
      setLoading(true);
      
      console.log('🔄 Actualizando perfil del usuario...');
      console.log('📋 Datos a actualizar:', nuevosDatos);
      
      const response = await fetch(buildApiUrl(`/usuarios/${user.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(nuevosDatos)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar perfil');
      }

      const resultado = await response.json();
      
      // Actualizar datos en el contexto de autenticación
      updateUser(resultado.usuario || nuevosDatos);
      
      // Actualizar estado local
      setPerfilData(prev => ({ ...prev, ...nuevosDatos }));
      
      mostrarMensaje('success', '✅ Perfil actualizado correctamente');
      
      console.log('✅ Perfil actualizado exitosamente');
      
    } catch (error) {
      console.error('❌ Error al actualizar perfil:', error);
      mostrarMensaje('error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para cambiar contraseña
  const cambiarContrasena = async (datos) => {
    try {
      setLoading(true);
      
      console.log('🔐 Cambiando contraseña...');
      
      const response = await fetch(buildApiUrl('/auth/cambiar-password'), {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          usuario_id: user.id,
          password_actual: datos.passwordActual,
          password_nuevo: datos.passwordNuevo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar contraseña');
      }

      mostrarMensaje('success', '🔐 Contraseña actualizada correctamente');
      console.log('✅ Contraseña cambiada exitosamente');
      
    } catch (error) {
      console.error('❌ Error al cambiar contraseña:', error);
      mostrarMensaje('error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Función para guardar configuración
  const guardarConfiguracion = async (nuevaConfiguracion) => {
    try {
      setLoading(true);
      
      console.log('⚙️ Guardando configuración...');
      
      // Simular guardado en API (implementar según tu backend)
      // const response = await fetch(buildApiUrl('/usuarios/configuracion'), {
      //   method: 'PUT',
      //   headers: getAuthHeaders(),
      //   body: JSON.stringify(nuevaConfiguracion)
      // });

      // Por ahora, guardar en localStorage
      localStorage.setItem('userConfig', JSON.stringify(nuevaConfiguracion));
      
      setConfiguracion(nuevaConfiguracion);
      mostrarMensaje('success', '⚙️ Configuración guardada correctamente');
      
    } catch (error) {
      console.error('❌ Error al guardar configuración:', error);
      mostrarMensaje('error', `❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Tabs de configuración según el rol
  const getTabs = () => {
    const tabsBase = [
      { id: 'perfil', label: 'Mi Perfil', icon: '👤' },
      { id: 'tema', label: 'Tema', icon: '🌙' },
      { id: 'notificaciones', label: 'Notificaciones', icon: '🔔' },
      { id: 'general', label: 'General', icon: '⚙️' }
    ];

    if (isAdmin) {
      tabsBase.push({ id: 'sistema', label: 'Sistema', icon: '🖥️' });
    }

    return tabsBase;
  };

  // Renderizar contenido según tab activo
  const renderContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <PerfilUsuario
            perfilData={perfilData}
            onActualizarPerfil={actualizarPerfil}
            onCambiarContrasena={cambiarContrasena}
            loading={loading}
            isAdmin={isAdmin}
          />
        );
      
      case 'tema':
        return (
          <ConfiguracionTema
            isDarkMode={isDarkMode}
            onToggleTheme={toggleTheme}
          />
        );
      
      case 'notificaciones':
        return (
          <ConfiguracionNotificaciones
            configuracion={configuracion.notificaciones}
            onGuardar={(nuevasNotificaciones) => 
              guardarConfiguracion({
                ...configuracion,
                notificaciones: nuevasNotificaciones
              })
            }
            loading={loading}
          />
        );
      
      case 'general':
        return (
          <ConfiguracionGeneral
            configuracion={configuracion.preferencias}
            onGuardar={(nuevasPreferencias) => 
              guardarConfiguracion({
                ...configuracion,
                preferencias: nuevasPreferencias
              })
            }
            loading={loading}
          />
        );
      
      case 'sistema':
        return isAdmin ? (
          <ConfiguracionSistema
            onGuardar={guardarConfiguracion}
            loading={loading}
          />
        ) : null;
      
      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div className={`configuracion-wrapper ${isDarkMode ? 'dark-mode' : ''}`}>
      <Navbar />
      
      <div className="configuracion-container">
        {/* Header */}
        <div className="configuracion-header">
          <div className="header-content">
            <button 
              className="btn-volver"
              onClick={() => navigate('/')}
              title="Volver al panel principal"
            >
              <span>←</span>
              <span>Volver</span>
            </button>
            
            <div className="header-info">
              <h1 className="configuracion-title">
                <span className="title-icon">⚙️</span>
                Configuración
              </h1>
              <p className="configuracion-subtitle">
                Personaliza tu experiencia en OdontoSys
              </p>
            </div>
            
            <div className="header-usuario">
              <div className="usuario-avatar">
                {user?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="usuario-info">
                <span className="usuario-nombre">
                  {user?.nombre} {user?.apellido_paterno}
                </span>
                <span className="usuario-rol">{user?.rol}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {mensaje.texto && (
          <div className={`mensaje-alerta ${mensaje.tipo}`}>
            <span className="mensaje-texto">{mensaje.texto}</span>
            <button 
              className="mensaje-cerrar"
              onClick={() => setMensaje({ tipo: '', texto: '' })}
            >
              ×
            </button>
          </div>
        )}

        {/* Contenido principal */}
        <div className="configuracion-main">
          {/* Sidebar de navegación */}
          <div className="configuracion-sidebar">
            <nav className="sidebar-nav">
              {getTabs().map((tab) => (
                <button
                  key={tab.id}
                  className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                  {activeTab === tab.id && <span className="tab-indicator"></span>}
                </button>
              ))}
            </nav>
            
            {/* Info adicional */}
            <div className="sidebar-info">
              <div className="info-card">
                <h4>💡 Consejo</h4>
                <p>
                  Mantén tu perfil actualizado para una mejor experiencia
                </p>
              </div>
            </div>
          </div>

          {/* Área de contenido */}
          <div className="configuracion-content">
            <div className="content-wrapper">
              {renderContent()}
            </div>
          </div>
        </div>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Procesando...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Configuracion;