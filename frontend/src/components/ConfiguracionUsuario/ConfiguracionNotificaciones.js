// components/ConfiguracionUsuario/ConfiguracionNotificaciones.js
import React, { useState } from 'react';

const ConfiguracionNotificaciones = ({ configuracion, onGuardar, loading }) => {
  const [notificaciones, setNotificaciones] = useState(configuracion || {
    email: true,
    push: true,
    citas: true,
    inventario: true,
    reportes: false
  });

  const [cambiosRealizados, setCambiosRealizados] = useState(false);

  const handleToggle = (key) => {
    const nuevasNotificaciones = {
      ...notificaciones,
      [key]: !notificaciones[key]
    };
    setNotificaciones(nuevasNotificaciones);
    setCambiosRealizados(true);
  };

  const guardarCambios = () => {
    onGuardar(notificaciones);
    setCambiosRealizados(false);
  };

  const resetearConfiguracion = () => {
    const configDefault = {
      email: true,
      push: true,
      citas: true,
      inventario: true,
      reportes: false
    };
    setNotificaciones(configDefault);
    setCambiosRealizados(true);
  };

  return (
    <div className="configuracion-notificaciones-container">
      {/* Header */}
      <div className="seccion-header">
        <div className="header-info">
          <h2 className="seccion-title">
            <span className="title-icon">🔔</span>
            Notificaciones
          </h2>
          <p className="seccion-descripcion">
            Configura qué notificaciones deseas recibir
          </p>
        </div>
        
        {cambiosRealizados && (
          <div className="header-actions">
            <button
              className="btn-guardar"
              onClick={guardarCambios}
              disabled={loading}
            >
              <span>💾</span>
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="notificaciones-content">
        {/* Notificaciones por tipo */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📧</span>
              Tipos de Notificación
            </h3>
          </div>
          
          <div className="card-content">
            <div className="notificaciones-grid">
              {/* Email */}
              <div className="notificacion-item">
                <div className="notificacion-info">
                  <div className="notificacion-icon">📧</div>
                  <div className="notificacion-content">
                    <h4>Notificaciones por Email</h4>
                    <p>Recibe notificaciones importantes en tu correo electrónico</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificaciones.email}
                    onChange={() => handleToggle('email')}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">{notificaciones.email ? '✓' : '✗'}</span>
                  </span>
                </label>
              </div>

              {/* Push */}
              <div className="notificacion-item">
                <div className="notificacion-info">
                  <div className="notificacion-icon">🔔</div>
                  <div className="notificacion-content">
                    <h4>Notificaciones Push</h4>
                    <p>Notificaciones instantáneas en el navegador</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificaciones.push}
                    onChange={() => handleToggle('push')}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">{notificaciones.push ? '✓' : '✗'}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Notificaciones por categoría */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📂</span>
              Categorías de Notificación
            </h3>
          </div>
          
          <div className="card-content">
            <div className="notificaciones-grid">
              {/* Citas */}
              <div className="notificacion-item">
                <div className="notificacion-info">
                  <div className="notificacion-icon">📅</div>
                  <div className="notificacion-content">
                    <h4>Citas Médicas</h4>
                    <p>Recordatorios de citas, cancelaciones y confirmaciones</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificaciones.citas}
                    onChange={() => handleToggle('citas')}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">{notificaciones.citas ? '✓' : '✗'}</span>
                  </span>
                </label>
              </div>

              {/* Inventario */}
              <div className="notificacion-item">
                <div className="notificacion-info">
                  <div className="notificacion-icon">📦</div>
                  <div className="notificacion-content">
                    <h4>Inventario</h4>
                    <p>Alertas de stock bajo y vencimientos de productos</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificaciones.inventario}
                    onChange={() => handleToggle('inventario')}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">{notificaciones.inventario ? '✓' : '✗'}</span>
                  </span>
                </label>
              </div>

              {/* Reportes */}
              <div className="notificacion-item">
                <div className="notificacion-info">
                  <div className="notificacion-icon">📊</div>
                  <div className="notificacion-content">
                    <h4>Reportes</h4>
                    <p>Reportes semanales y mensuales del sistema</p>
                  </div>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={notificaciones.reportes}
                    onChange={() => handleToggle('reportes')}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">{notificaciones.reportes ? '✓' : '✗'}</span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración avanzada */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">⚙️</span>
              Configuración Avanzada
            </h3>
          </div>
          
          <div className="card-content">
            <div className="config-avanzada">
              <div className="config-item">
                <h4>Horarios de Notificación</h4>
                <p>Solo recibir notificaciones durante horario laboral</p>
                <div className="config-control">
                  <select className="form-input" disabled>
                    <option>8:00 AM - 6:00 PM</option>
                  </select>
                  <span className="coming-soon">Próximamente</span>
                </div>
              </div>

              <div className="config-item">
                <h4>Frecuencia de Recordatorios</h4>
                <p>Cada cuánto tiempo recibir recordatorios de citas</p>
                <div className="config-control">
                  <select className="form-input" disabled>
                    <option>24 horas antes</option>
                  </select>
                  <span className="coming-soon">Próximamente</span>
                </div>
              </div>

              <div className="config-item">
                <h4>Notificaciones de Emergencia</h4>
                <p>Siempre recibir notificaciones críticas</p>
                <div className="config-control">
                  <label className="toggle-switch">
                    <input type="checkbox" checked disabled />
                    <span className="slider">
                      <span className="slider-icon">✓</span>
                    </span>
                  </label>
                  <span className="emergency-note">Siempre activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🔧</span>
              Acciones
            </h3>
          </div>
          
          <div className="card-content">
            <div className="acciones-grid">
              <button
                className="btn-action test-notification"
                onClick={() => alert('🔔 Notificación de prueba enviada')}
                disabled={loading}
              >
                <span>🧪</span>
                <div>
                  <h4>Probar Notificaciones</h4>
                  <p>Enviar una notificación de prueba</p>
                </div>
              </button>

              <button
                className="btn-action reset-config"
                onClick={resetearConfiguracion}
                disabled={loading}
              >
                <span>🔄</span>
                <div>
                  <h4>Restablecer</h4>
                  <p>Volver a configuración por defecto</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Resumen */}
        <div className="perfil-card info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📋</span>
              Resumen de Configuración
            </h3>
          </div>
          
          <div className="card-content">
            <div className="resumen-grid">
              <div className="resumen-item">
                <span className="resumen-label">Notificaciones Email:</span>
                <span className={`resumen-value ${notificaciones.email ? 'active' : 'inactive'}`}>
                  {notificaciones.email ? '✅ Activadas' : '❌ Desactivadas'}
                </span>
              </div>
              
              <div className="resumen-item">
                <span className="resumen-label">Notificaciones Push:</span>
                <span className={`resumen-value ${notificaciones.push ? 'active' : 'inactive'}`}>
                  {notificaciones.push ? '✅ Activadas' : '❌ Desactivadas'}
                </span>
              </div>
              
              <div className="resumen-item">
                <span className="resumen-label">Total Categorías Activas:</span>
                <span className="resumen-value">
                  {Object.values(notificaciones).filter(Boolean).length} de {Object.keys(notificaciones).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionNotificaciones;