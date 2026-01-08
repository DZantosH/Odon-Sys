// components/ConfiguracionUsuario/ConfiguracionTema.js - Configuración de tema oscuro/claro
import React, { useState, useEffect } from 'react';

const ConfiguracionTema = ({ isDarkMode, onToggleTheme }) => {
  const [previewMode, setPreviewMode] = useState(null);
  const [systemTheme, setSystemTheme] = useState('light');

  // Detectar tema del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');

    const handleSystemChange = (e) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addListener(handleSystemChange);
    return () => mediaQuery.removeListener(handleSystemChange);
  }, []);

  // Manejar preview de tema
  const handlePreview = (theme) => {
    setPreviewMode(theme);
    // Aplicar preview temporalmente
    const body = document.body;
    if (theme === 'dark') {
      body.classList.add('preview-dark');
      body.classList.remove('preview-light');
    } else {
      body.classList.add('preview-light');
      body.classList.remove('preview-dark');
    }
  };

  // Limpiar preview
  const clearPreview = () => {
    setPreviewMode(null);
    const body = document.body;
    body.classList.remove('preview-dark', 'preview-light');
  };

  // Aplicar tema seleccionado
  const applyTheme = (theme) => {
    clearPreview();
    if (theme !== (isDarkMode ? 'dark' : 'light')) {
      onToggleTheme();
    }
  };

  const currentTheme = previewMode || (isDarkMode ? 'dark' : 'light');

  return (
    <div className="configuracion-tema-container">
      {/* Header */}
      <div className="seccion-header">
        <div className="header-info">
          <h2 className="seccion-title">
            <span className="title-icon">🌙</span>
            Apariencia
          </h2>
          <p className="seccion-descripcion">
            Personaliza el tema visual de la aplicación
          </p>
        </div>
      </div>

      {/* Selector de tema */}
      <div className="tema-content">
        <div className="tema-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🎨</span>
              Seleccionar Tema
            </h3>
          </div>
          
          <div className="card-content">
            <div className="tema-options">
              {/* Tema Claro */}
              <div 
                className={`tema-option ${currentTheme === 'light' ? 'active' : ''}`}
                onMouseEnter={() => handlePreview('light')}
                onMouseLeave={clearPreview}
                onClick={() => applyTheme('light')}
              >
                <div className="tema-preview light-preview">
                  <div className="preview-header">
                    <div className="preview-logo"></div>
                    <div className="preview-nav"></div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-sidebar">
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item active"></div>
                    </div>
                    <div className="preview-main">
                      <div className="main-card"></div>
                      <div className="main-card"></div>
                    </div>
                  </div>
                </div>
                
                <div className="tema-info">
                  <h4 className="tema-name">
                    <span className="tema-icon">☀️</span>
                    Tema Claro
                  </h4>
                  <p className="tema-description">
                    Diseño limpio y brillante, ideal para usar durante el día
                  </p>
                  {currentTheme === 'light' && (
                    <div className="tema-status">
                      <span className="status-indicator active"></span>
                      <span>Activo</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tema Oscuro */}
              <div 
                className={`tema-option ${currentTheme === 'dark' ? 'active' : ''}`}
                onMouseEnter={() => handlePreview('dark')}
                onMouseLeave={clearPreview}
                onClick={() => applyTheme('dark')}
              >
                <div className="tema-preview dark-preview">
                  <div className="preview-header">
                    <div className="preview-logo"></div>
                    <div className="preview-nav"></div>
                  </div>
                  <div className="preview-content">
                    <div className="preview-sidebar">
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item"></div>
                      <div className="sidebar-item active"></div>
                    </div>
                    <div className="preview-main">
                      <div className="main-card"></div>
                      <div className="main-card"></div>
                    </div>
                  </div>
                </div>
                
                <div className="tema-info">
                  <h4 className="tema-name">
                    <span className="tema-icon">🌙</span>
                    Tema Oscuro
                  </h4>
                  <p className="tema-description">
                    Reduce la fatiga visual y ahorra batería en dispositivos OLED
                  </p>
                  {currentTheme === 'dark' && (
                    <div className="tema-status">
                      <span className="status-indicator active"></span>
                      <span>Activo</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Toggle rápido */}
            <div className="tema-toggle-section">
              <div className="toggle-header">
                <h4>Cambio Rápido</h4>
                <p>Alterna entre tema claro y oscuro</p>
              </div>
              
              <button
                className="tema-toggle-btn"
                onClick={onToggleTheme}
              >
                <div className={`toggle-switch ${isDarkMode ? 'dark' : 'light'}`}>
                  <div className="toggle-slider">
                    <span className="toggle-icon">
                      {isDarkMode ? '🌙' : '☀️'}
                    </span>
                  </div>
                </div>
                <span className="toggle-label">
                  {isDarkMode ? 'Modo Oscuro' : 'Modo Claro'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Información del sistema */}
        <div className="tema-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🖥️</span>
              Información del Sistema
            </h3>
          </div>
          
          <div className="card-content">
            <div className="sistema-info">
              <div className="info-row">
                <span className="info-label">Tema del Sistema:</span>
                <span className="info-value">
                  <span className={`theme-badge ${systemTheme}`}>
                    {systemTheme === 'dark' ? '🌙' : '☀️'} 
                    {systemTheme === 'dark' ? 'Oscuro' : 'Claro'}
                  </span>
                </span>
              </div>
              
              <div className="info-row">
                <span className="info-label">Tema Actual:</span>
                <span className="info-value">
                  <span className={`theme-badge ${isDarkMode ? 'dark' : 'light'}`}>
                    {isDarkMode ? '🌙' : '☀️'} 
                    {isDarkMode ? 'Oscuro' : 'Claro'}
                  </span>
                </span>
              </div>

              <div className="info-row">
                <span className="info-label">Sincronizado con Sistema:</span>
                <span className="info-value">
                  <span className={`sync-status ${(isDarkMode && systemTheme === 'dark') || (!isDarkMode && systemTheme === 'light') ? 'synced' : 'not-synced'}`}>
                    {(isDarkMode && systemTheme === 'dark') || (!isDarkMode && systemTheme === 'light') ? '✅ Sí' : '❌ No'}
                  </span>
                </span>
              </div>
            </div>

            <div className="sistema-actions">
              <button
                className="btn-sync-sistema"
                onClick={() => {
                  if (systemTheme !== (isDarkMode ? 'dark' : 'light')) {
                    onToggleTheme();
                  }
                }}
                disabled={(isDarkMode && systemTheme === 'dark') || (!isDarkMode && systemTheme === 'light')}
              >
                <span>🔄</span>
                <span>Sincronizar con Sistema</span>
              </button>
            </div>
          </div>
        </div>

        {/* Beneficios del tema oscuro */}
        <div className="tema-card info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">💡</span>
              Beneficios del Tema Oscuro
            </h3>
          </div>
          
          <div className="card-content">
            <div className="beneficios-grid">
              <div className="beneficio-item">
                <div className="beneficio-icon">👁️</div>
                <div className="beneficio-content">
                  <h4>Menos Fatiga Visual</h4>
                  <p>Reduce el estrés ocular durante largas sesiones de trabajo</p>
                </div>
              </div>

              <div className="beneficio-item">
                <div className="beneficio-icon">🔋</div>
                <div className="beneficio-content">
                  <h4>Ahorro de Batería</h4>
                  <p>Consume menos energía en pantallas OLED y AMOLED</p>
                </div>
              </div>

              <div className="beneficio-item">
                <div className="beneficio-icon">🌃</div>
                <div className="beneficio-content">
                  <h4>Trabajo Nocturno</h4>
                  <p>Ideal para trabajar en ambientes con poca luz</p>
                </div>
              </div>

              <div className="beneficio-item">
                <div className="beneficio-icon">🎨</div>
                <div className="beneficio-content">
                  <h4>Aspecto Moderno</h4>
                  <p>Diseño elegante y profesional</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración avanzada */}
        <div className="tema-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">⚙️</span>
              Configuración Avanzada
            </h3>
          </div>
          
          <div className="card-content">
            <div className="configuracion-avanzada">
              <div className="config-option">
                <div className="config-info">
                  <h4>Cambio Automático</h4>
                  <p>Cambiar tema automáticamente según la hora del día</p>
                </div>
                <div className="config-control">
                  <label className="toggle-switch small">
                    <input type="checkbox" disabled />
                    <span className="slider">
                      <span className="slider-icon">🕐</span>
                    </span>
                  </label>
                  <span className="coming-soon">Próximamente</span>
                </div>
              </div>

              <div className="config-option">
                <div className="config-info">
                  <h4>Seguir Sistema</h4>
                  <p>Cambiar automáticamente cuando el sistema cambie de tema</p>
                </div>
                <div className="config-control">
                  <label className="toggle-switch small">
                    <input type="checkbox" disabled />
                    <span className="slider">
                      <span className="slider-icon">🖥️</span>
                    </span>
                  </label>
                  <span className="coming-soon">Próximamente</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preview overlay */}
      {previewMode && (
        <div className="preview-overlay">
          <div className="preview-info">
            <h4>Vista Previa: Tema {previewMode === 'dark' ? 'Oscuro' : 'Claro'}</h4>
            <p>Haz clic para aplicar este tema</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfiguracionTema;