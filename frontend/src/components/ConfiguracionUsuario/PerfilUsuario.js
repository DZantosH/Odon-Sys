// components/ConfiguracionUsuario/PerfilUsuario.js - Gestión de perfil de usuario - COMPLETO
import React, { useState, useEffect } from 'react';

const PerfilUsuario = ({ 
  perfilData, 
  onActualizarPerfil, 
  onCambiarContrasena, 
  loading, 
  isAdmin 
}) => {
  // Estados para el formulario de perfil
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    email: '',
    telefono: '',
    especialidad: '',
    cedula: ''
  });

  // Estados para cambio de contraseña
  const [passwordData, setPasswordData] = useState({
    passwordActual: '',
    passwordNuevo: '',
    confirmarPassword: ''
  });

  // Estados de UI
  const [editando, setEditando] = useState(false);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [errores, setErrores] = useState({});
  const [cambiosRealizados, setCambiosRealizados] = useState(false);

  // Cargar datos del perfil cuando cambien
  useEffect(() => {
    if (perfilData) {
      setFormData({
        nombre: perfilData.nombre || '',
        apellido_paterno: perfilData.apellido_paterno || '',
        apellido_materno: perfilData.apellido_materno || '',
        email: perfilData.email || '',
        telefono: perfilData.telefono || '',
        especialidad: perfilData.especialidad || '',
        cedula: perfilData.cedula || ''
      });
    }
  }, [perfilData]);

  // Manejar cambios en el formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setCambiosRealizados(true);
    
    // Limpiar error específico cuando el usuario empiece a escribir
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Manejar cambios en formulario de contraseña
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error específico
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Validar formulario de perfil
  const validarPerfil = () => {
    const nuevosErrores = {};

    // Validaciones básicas
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }

    if (!formData.apellido_paterno.trim()) {
      nuevosErrores.apellido_paterno = 'El apellido paterno es obligatorio';
    }

    if (!formData.email.trim()) {
      nuevosErrores.email = 'El email es obligatorio';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      nuevosErrores.email = 'El formato del email no es válido';
    }

    if (formData.telefono && !/^\d{10}$/.test(formData.telefono.replace(/\s+/g, ''))) {
      nuevosErrores.telefono = 'El teléfono debe tener 10 dígitos';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Validar formulario de contraseña
  const validarPassword = () => {
    const nuevosErrores = {};

    if (!passwordData.passwordActual) {
      nuevosErrores.passwordActual = 'La contraseña actual es obligatoria';
    }

    if (!passwordData.passwordNuevo) {
      nuevosErrores.passwordNuevo = 'La nueva contraseña es obligatoria';
    } else if (passwordData.passwordNuevo.length < 6) {
      nuevosErrores.passwordNuevo = 'La contraseña debe tener al menos 6 caracteres';
    }

    if (passwordData.passwordNuevo !== passwordData.confirmarPassword) {
      nuevosErrores.confirmarPassword = 'Las contraseñas no coinciden';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  };

  // Guardar cambios en el perfil
  const guardarPerfil = async () => {
    if (!validarPerfil()) return;

    try {
      await onActualizarPerfil(formData);
      setEditando(false);
      setCambiosRealizados(false);
    } catch (error) {
      console.error('Error al guardar perfil:', error);
    }
  };

  // Cambiar contraseña
  const cambiarPassword = async () => {
    if (!validarPassword()) return;

    try {
      await onCambiarContrasena({
        passwordActual: passwordData.passwordActual,
        passwordNuevo: passwordData.passwordNuevo
      });
      
      // Limpiar formulario
      setPasswordData({
        passwordActual: '',
        passwordNuevo: '',
        confirmarPassword: ''
      });
      setMostrarPassword(false);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
    }
  };

  // Cancelar edición
  const cancelarEdicion = () => {
    setFormData({
      nombre: perfilData.nombre || '',
      apellido_paterno: perfilData.apellido_paterno || '',
      apellido_materno: perfilData.apellido_materno || '',
      email: perfilData.email || '',
      telefono: perfilData.telefono || '',
      especialidad: perfilData.especialidad || '',
      cedula: perfilData.cedula || ''
    });
    setEditando(false);
    setCambiosRealizados(false);
    setErrores({});
  };

  // Función auxiliar para mostrar alertas de manera segura
  const mostrarAlerta = (mensaje) => {
    if (window.alert) {
      window.alert(mensaje);
    } else {
      console.log(mensaje);
    }
  };

  // Función auxiliar para mostrar confirmaciones de manera segura
  const mostrarConfirmacion = (mensaje) => {
    if (window.confirm) {
      return window.confirm(mensaje);
    } else {
      console.log(mensaje);
      return true; // Por defecto aceptar si no hay confirm disponible
    }
  };

  return (
    <div className="perfil-usuario-container">
      {/* Header de la sección */}
      <div className="seccion-header">
        <div className="header-info">
          <h2 className="seccion-title">
            <span className="title-icon">👤</span>
            Mi Perfil
          </h2>
          <p className="seccion-descripcion">
            Gestiona tu información personal y credenciales
          </p>
        </div>
        
        <div className="header-actions">
          {!editando ? (
            <button
              className="btn-editar"
              onClick={() => setEditando(true)}
              disabled={loading}
            >
              <span>✏️</span>
              <span>Editar Perfil</span>
            </button>
          ) : (
            <div className="edicion-actions">
              <button
                className="btn-cancelar"
                onClick={cancelarEdicion}
                disabled={loading}
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
              <button
                className="btn-guardar"
                onClick={guardarPerfil}
                disabled={loading || !cambiosRealizados}
              >
                <span>💾</span>
                <span>{loading ? 'Guardando...' : 'Guardar'}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Información del perfil */}
      <div className="perfil-content">
        {/* Datos personales */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📋</span>
              Información Personal
            </h3>
          </div>
          
          <div className="card-content">
            <div className="form-grid">
              {/* Nombre */}
              <div className="form-group">
                <label className="form-label">
                  Nombre *
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  disabled={!editando || loading}
                  className={`form-input ${errores.nombre ? 'error' : ''}`}
                  placeholder="Ingresa tu nombre"
                />
                {errores.nombre && (
                  <span className="error-message">{errores.nombre}</span>
                )}
              </div>

              {/* Apellido Paterno */}
              <div className="form-group">
                <label className="form-label">
                  Apellido Paterno *
                </label>
                <input
                  type="text"
                  name="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={handleInputChange}
                  disabled={!editando || loading}
                  className={`form-input ${errores.apellido_paterno ? 'error' : ''}`}
                  placeholder="Ingresa tu apellido paterno"
                />
                {errores.apellido_paterno && (
                  <span className="error-message">{errores.apellido_paterno}</span>
                )}
              </div>

              {/* Apellido Materno */}
              <div className="form-group">
                <label className="form-label">
                  Apellido Materno
                </label>
                <input
                  type="text"
                  name="apellido_materno"
                  value={formData.apellido_materno}
                  onChange={handleInputChange}
                  disabled={!editando || loading}
                  className="form-input"
                  placeholder="Ingresa tu apellido materno"
                />
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!editando || loading}
                  className={`form-input ${errores.email ? 'error' : ''}`}
                  placeholder="tu@email.com"
                />
                {errores.email && (
                  <span className="error-message">{errores.email}</span>
                )}
              </div>

              {/* Teléfono */}
              <div className="form-group">
                <label className="form-label">
                  Teléfono
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  disabled={!editando || loading}
                  className={`form-input ${errores.telefono ? 'error' : ''}`}
                  placeholder="55 1234 5678"
                />
                {errores.telefono && (
                  <span className="error-message">{errores.telefono}</span>
                )}
              </div>

              {/* Rol (solo lectura) */}
              <div className="form-group">
                <label className="form-label">
                  Rol
                </label>
                <input
                  type="text"
                  value={perfilData.rol}
                  disabled
                  className="form-input readonly"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Información profesional (solo para doctores) */}
        {(perfilData.rol === 'Doctor' || perfilData.rol === 'Administrador') && (
          <div className="perfil-card">
            <div className="card-header">
              <h3 className="card-title">
                <span className="card-icon">🩺</span>
                Información Profesional
              </h3>
            </div>
            
            <div className="card-content">
              <div className="form-grid">
                {/* Especialidad */}
                <div className="form-group">
                  <label className="form-label">
                    Especialidad
                  </label>
                  <input
                    type="text"
                    name="especialidad"
                    value={formData.especialidad}
                    onChange={handleInputChange}
                    disabled={!editando || loading}
                    className="form-input"
                    placeholder="Ej: Endodoncia, Ortodoncia"
                  />
                </div>

                {/* Cédula */}
                <div className="form-group">
                  <label className="form-label">
                    Cédula Profesional
                  </label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    disabled={!editando || loading}
                    className="form-input"
                    placeholder="Número de cédula"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cambio de contraseña */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🔐</span>
              Seguridad
            </h3>
            <button
              className="btn-toggle-password"
              onClick={() => setMostrarPassword(!mostrarPassword)}
              disabled={loading}
            >
              <span>{mostrarPassword ? '👁️‍🗨️' : '🔒'}</span>
              <span>{mostrarPassword ? 'Ocultar' : 'Cambiar Contraseña'}</span>
            </button>
          </div>
          
          {mostrarPassword && (
            <div className="card-content">
              <div className="password-form">
                <div className="form-group">
                  <label className="form-label">
                    Contraseña Actual *
                  </label>
                  <input
                    type="password"
                    name="passwordActual"
                    value={passwordData.passwordActual}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={`form-input ${errores.passwordActual ? 'error' : ''}`}
                    placeholder="Tu contraseña actual"
                  />
                  {errores.passwordActual && (
                    <span className="error-message">{errores.passwordActual}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="passwordNuevo"
                    value={passwordData.passwordNuevo}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={`form-input ${errores.passwordNuevo ? 'error' : ''}`}
                    placeholder="Mínimo 6 caracteres"
                  />
                  {errores.passwordNuevo && (
                    <span className="error-message">{errores.passwordNuevo}</span>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Confirmar Nueva Contraseña *
                  </label>
                  <input
                    type="password"
                    name="confirmarPassword"
                    value={passwordData.confirmarPassword}
                    onChange={handlePasswordChange}
                    disabled={loading}
                    className={`form-input ${errores.confirmarPassword ? 'error' : ''}`}
                    placeholder="Repite la nueva contraseña"
                  />
                  {errores.confirmarPassword && (
                    <span className="error-message">{errores.confirmarPassword}</span>
                  )}
                </div>

                <div className="password-actions">
                  <button
                    className="btn-cambiar-password"
                    onClick={cambiarPassword}
                    disabled={loading}
                  >
                    <span>🔐</span>
                    <span>{loading ? 'Cambiando...' : 'Cambiar Contraseña'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Información adicional */}
        <div className="perfil-card info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">ℹ️</span>
              Información de la Cuenta
            </h3>
          </div>
          
          <div className="card-content">
            <div className="info-grid">
              <div className="info-item">
                <span className="info-label">Tipo de Usuario:</span>
                <span className="info-value">{perfilData.rol}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Estado:</span>
                <span className="info-value status-active">
                  <span className="status-dot"></span>
                  Activo
                </span>
              </div>
              {isAdmin && (
                <div className="info-item">
                  <span className="info-label">Permisos:</span>
                  <span className="info-value admin-badge">
                    <span>👑</span>
                    Administrador
                  </span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Última Conexión:</span>
                <span className="info-value">
                  {new Date().toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Fecha de Registro:</span>
                <span className="info-value">
                  {perfilData.fecha_creacion ? 
                    new Date(perfilData.fecha_creacion).toLocaleDateString('es-MX', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) : 'No disponible'
                  }
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">ID de Usuario:</span>
                <span className="info-value">#{perfilData.id || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de privacidad */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🔒</span>
              Privacidad y Seguridad
            </h3>
          </div>
          
          <div className="card-content">
            <div className="privacidad-opciones">
              <div className="privacidad-item">
                <div className="privacidad-info">
                  <h4>Mostrar mi perfil a otros usuarios</h4>
                  <p>Permite que otros usuarios del sistema vean tu información básica</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked disabled />
                  <span className="slider">
                    <span className="slider-icon">✓</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="privacidad-item">
                <div className="privacidad-info">
                  <h4>Permitir notificaciones por email</h4>
                  <p>Recibir notificaciones importantes del sistema por correo</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked disabled />
                  <span className="slider">
                    <span className="slider-icon">✓</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="privacidad-item">
                <div className="privacidad-info">
                  <h4>Sesiones activas</h4>
                  <p>Gestionar dispositivos con sesión activa</p>
                </div>
                <button 
                  className="btn-manage-sessions"
                  disabled
                >
                  <span>📱</span>
                  <span>Gestionar Sesiones</span>
                </button>
                <span className="coming-soon">Próximamente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones de cuenta */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">⚙️</span>
              Acciones de Cuenta
            </h3>
          </div>
          
          <div className="card-content">
            <div className="cuenta-acciones">
              <div className="accion-item">
                <div className="accion-info">
                  <h4>Exportar mis datos</h4>
                  <p>Descargar una copia de toda tu información personal</p>
                </div>
                <button 
                  className="btn-accion-secundaria"
                  onClick={() => exportarDatosPersonales(perfilData)}
                  disabled={loading}
                >
                  <span>📤</span>
                  <span>Exportar</span>
                </button>
              </div>

              <div className="accion-item">
                <div className="accion-info">
                  <h4>Limpiar caché personal</h4>
                  <p>Eliminar datos temporales y configuraciones locales</p>
                </div>
                <button 
                  className="btn-accion-secundaria"
                  onClick={() => limpiarCachePersonal()}
                  disabled={loading}
                >
                  <span>🧹</span>
                  <span>Limpiar</span>
                </button>
              </div>

              {!isAdmin && (
                <div className="accion-item peligrosa">
                  <div className="accion-info">
                    <h4>Solicitar eliminación de cuenta</h4>
                    <p>Enviar solicitud para eliminar permanentemente tu cuenta</p>
                  </div>
                  <button 
                    className="btn-accion-peligrosa"
                    onClick={() => solicitarEliminacionCuenta(mostrarConfirmacion, mostrarAlerta)}
                    disabled={loading}
                  >
                    <span>⚠️</span>
                    <span>Solicitar</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
const exportarDatosPersonales = (datos) => {
  const datosExportar = {
    informacion_personal: {
      nombre: datos.nombre,
      apellido_paterno: datos.apellido_paterno,
      apellido_materno: datos.apellido_materno,
      email: datos.email,
      telefono: datos.telefono,
      rol: datos.rol
    },
    informacion_profesional: {
      especialidad: datos.especialidad,
      cedula: datos.cedula
    },
    metadatos: {
      fecha_exportacion: new Date().toISOString(),
      version_sistema: '2.1.0'
    }
  };

  const dataStr = JSON.stringify(datosExportar, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `mi-perfil-odontosys-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  if (window.alert) {
    window.alert('📤 Tus datos personales han sido exportados correctamente');
  }
};

const limpiarCachePersonal = () => {
  // Limpiar configuraciones personales del localStorage (mantener sesión)
  const keysToKeep = ['token', 'userData', 'sessionActive', 'browserOpen'];
  const allKeys = Object.keys(localStorage);
  
  let keysRemoved = 0;
  allKeys.forEach(key => {
    if (!keysToKeep.includes(key)) {
      localStorage.removeItem(key);
      keysRemoved++;
    }
  });
  
  // Limpiar sessionStorage excepto datos críticos
  const sessionKeysToKeep = ['sessionActive', 'browserOpen', 'lastActivity'];
  const allSessionKeys = Object.keys(sessionStorage);
  
  allSessionKeys.forEach(key => {
    if (!sessionKeysToKeep.includes(key)) {
      sessionStorage.removeItem(key);
      keysRemoved++;
    }
  });
  
  if (window.alert) {
    window.alert(`🧹 Cache personal limpiado. Se eliminaron ${keysRemoved} elementos.`);
  }
};

const solicitarEliminacionCuenta = (mostrarConfirmacion, mostrarAlerta) => {
  const confirmacion = mostrarConfirmacion(
    '⚠️ ADVERTENCIA: Esta acción enviará una solicitud para eliminar permanentemente tu cuenta.\n\n' +
    'Una vez procesada, no podrás recuperar tu información.\n\n' +
    '¿Estás seguro de que deseas continuar?'
  );
  
  if (confirmacion) {
    const segundaConfirmacion = window.prompt ? window.prompt(
      'Para confirmar, escribe "ELIMINAR MI CUENTA" exactamente como aparece:'
    ) : 'ELIMINAR MI CUENTA';
    
    if (segundaConfirmacion === 'ELIMINAR MI CUENTA') {
      mostrarAlerta('📧 Solicitud de eliminación enviada. Un administrador revisará tu solicitud en las próximas 48 horas.');
      // Aquí se implementaría la lógica para enviar la solicitud
    } else {
      mostrarAlerta('❌ Confirmación incorrecta. Solicitud cancelada.');
    }
  }
};

export default PerfilUsuario;