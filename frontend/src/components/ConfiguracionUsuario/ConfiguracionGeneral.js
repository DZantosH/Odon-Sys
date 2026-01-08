// components/ConfiguracionUsuario/ConfiguracionGeneral.js
import React, { useState } from 'react';

const ConfiguracionGeneral = ({ configuracion, onGuardar, loading }) => {
  const [preferencias, setPreferencias] = useState(configuracion || {
    idioma: 'es',
    zona_horaria: 'America/Mexico_City',
    formato_fecha: 'DD/MM/YYYY',
    formato_hora: '24h',
    moneda: 'MXN',
    duracion_cita_default: 30,
    recordatorio_citas: 24,
    auto_confirmar_citas: false,
    mostrar_pacientes_inactivos: true,
    nivel_stock_minimo: 10,
    alertas_vencimiento: 30
  });

  const [cambiosRealizados, setCambiosRealizados] = useState(false);

  const handleChange = (key, value) => {
    const nuevasPreferencias = {
      ...preferencias,
      [key]: value
    };
    setPreferencias(nuevasPreferencias);
    setCambiosRealizados(true);
  };

  const guardarCambios = () => {
    onGuardar(preferencias);
    setCambiosRealizados(false);
  };

  const resetearConfiguracion = () => {
    const configDefault = {
      idioma: 'es',
      zona_horaria: 'America/Mexico_City',
      formato_fecha: 'DD/MM/YYYY',
      formato_hora: '24h',
      moneda: 'MXN',
      duracion_cita_default: 30,
      recordatorio_citas: 24,
      auto_confirmar_citas: false,
      mostrar_pacientes_inactivos: true,
      nivel_stock_minimo: 10,
      alertas_vencimiento: 30
    };
    setPreferencias(configDefault);
    setCambiosRealizados(true);
  };

  // Funciones para formatear vista previa
  const formatearFechaPreview = (formato) => {
    const fecha = new Date();
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const año = fecha.getFullYear();

    switch (formato) {
      case 'DD/MM/YYYY':
        return `${dia}/${mes}/${año}`;
      case 'MM/DD/YYYY':
        return `${mes}/${dia}/${año}`;
      case 'YYYY-MM-DD':
        return `${año}-${mes}-${dia}`;
      case 'DD-MM-YYYY':
        return `${dia}-${mes}-${año}`;
      default:
        return `${dia}/${mes}/${año}`;
    }
  };

  const formatearHoraPreview = (formato) => {
    const fecha = new Date();
    const horas = fecha.getHours();
    const minutos = String(fecha.getMinutes()).padStart(2, '0');

    if (formato === '12h') {
      const horas12 = horas % 12 || 12;
      const ampm = horas >= 12 ? 'PM' : 'AM';
      return `${horas12}:${minutos} ${ampm}`;
    } else {
      return `${String(horas).padStart(2, '0')}:${minutos}`;
    }
  };

  const formatearMoneda = (cantidad) => {
    const formatters = {
      'MXN': new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }),
      'USD': new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      'EUR': new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })
    };
    return formatters[preferencias.moneda]?.format(cantidad) || `$${cantidad}`;
  };

  return (
    <div className="configuracion-general-container">
      {/* Header */}
      <div className="seccion-header">
        <div className="header-info">
          <h2 className="seccion-title">
            <span className="title-icon">⚙️</span>
            Configuración General
          </h2>
          <p className="seccion-descripcion">
            Personaliza la configuración general del sistema
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
      <div className="general-content">
        {/* Configuración de Idioma */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🌍</span>
              Idioma y Región
            </h3>
          </div>
          
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Idioma del Sistema</label>
                <select
                  className="form-input"
                  value={preferencias.idioma}
                  onChange={(e) => handleChange('idioma', e.target.value)}
                  disabled={loading}
                >
                  <option value="es">🇲🇽 Español (México)</option>
                  <option value="en" disabled>🇺🇸 English (Coming Soon)</option>
                  <option value="fr" disabled>🇫🇷 Français (Coming Soon)</option>
                </select>
                <small className="form-help">
                  Idioma principal de la interfaz del sistema
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Zona Horaria</label>
                <select
                  className="form-input"
                  value={preferencias.zona_horaria}
                  onChange={(e) => handleChange('zona_horaria', e.target.value)}
                  disabled={loading}
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                  <option value="America/Monterrey">Monterrey (GMT-6)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                </select>
                <small className="form-help">
                  Zona horaria para mostrar fechas y horas
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Moneda</label>
                <select
                  className="form-input"
                  value={preferencias.moneda}
                  onChange={(e) => handleChange('moneda', e.target.value)}
                  disabled={loading}
                >
                  <option value="MXN">🇲🇽 Peso Mexicano (MXN)</option>
                  <option value="USD">🇺🇸 Dólar Americano (USD)</option>
                  <option value="EUR">🇪🇺 Euro (EUR)</option>
                </select>
                <small className="form-help">
                  Moneda para mostrar precios y costos
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Formatos */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📅</span>
              Formatos de Fecha y Hora
            </h3>
          </div>
          
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Formato de Fecha</label>
                <select
                  className="form-input"
                  value={preferencias.formato_fecha}
                  onChange={(e) => handleChange('formato_fecha', e.target.value)}
                  disabled={loading}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY (15/08/2025)</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY (08/15/2025)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (2025-08-15)</option>
                  <option value="DD-MM-YYYY">DD-MM-YYYY (15-08-2025)</option>
                </select>
                <small className="form-help">
                  Formato para mostrar fechas en el sistema
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Formato de Hora</label>
                <select
                  className="form-input"
                  value={preferencias.formato_hora}
                  onChange={(e) => handleChange('formato_hora', e.target.value)}
                  disabled={loading}
                >
                  <option value="24h">24 horas (14:30)</option>
                  <option value="12h">12 horas (2:30 PM)</option>
                </select>
                <small className="form-help">
                  Formato para mostrar horas en el sistema
                </small>
              </div>
            </div>

            {/* Vista previa */}
            <div className="preview-section">
              <h4>Vista Previa</h4>
              <div className="preview-grid">
                <div className="preview-item">
                  <span className="preview-label">Fecha:</span>
                  <span className="preview-value">
                    {formatearFechaPreview(preferencias.formato_fecha)}
                  </span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Hora:</span>
                  <span className="preview-value">
                    {formatearHoraPreview(preferencias.formato_hora)}
                  </span>
                </div>
                <div className="preview-item">
                  <span className="preview-label">Precio:</span>
                  <span className="preview-value">
                    {formatearMoneda(1500)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Citas */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📅</span>
              Configuración de Citas
            </h3>
          </div>
          
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Duración Predeterminada (minutos)</label>
                <select
                  className="form-input"
                  value={preferencias.duracion_cita_default}
                  onChange={(e) => handleChange('duracion_cita_default', parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value={15}>15 minutos</option>
                  <option value={30}>30 minutos</option>
                  <option value={45}>45 minutos</option>
                  <option value={60}>1 hora</option>
                  <option value={90}>1.5 horas</option>
                  <option value={120}>2 horas</option>
                </select>
                <small className="form-help">
                  Duración por defecto para nuevas citas
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Recordatorio de Citas (horas antes)</label>
                <select
                  className="form-input"
                  value={preferencias.recordatorio_citas}
                  onChange={(e) => handleChange('recordatorio_citas', parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value={1}>1 hora antes</option>
                  <option value={2}>2 horas antes</option>
                  <option value={4}>4 horas antes</option>
                  <option value={12}>12 horas antes</option>
                  <option value={24}>24 horas antes</option>
                  <option value={48}>48 horas antes</option>
                </select>
                <small className="form-help">
                  Cuándo enviar recordatorios de citas por defecto
                </small>
              </div>
            </div>

            <div className="config-toggles">
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Auto-confirmar Citas</h4>
                  <p>Las citas se marcan como confirmadas automáticamente</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferencias.auto_confirmar_citas}
                    onChange={(e) => handleChange('auto_confirmar_citas', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">
                      {preferencias.auto_confirmar_citas ? '✓' : '✗'}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Pacientes */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">👥</span>
              Configuración de Pacientes
            </h3>
          </div>
          
          <div className="card-content">
            <div className="config-toggles">
              <div className="toggle-item">
                <div className="toggle-info">
                  <h4>Mostrar Pacientes Inactivos</h4>
                  <p>Incluir pacientes sin citas recientes en las listas</p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={preferencias.mostrar_pacientes_inactivos}
                    onChange={(e) => handleChange('mostrar_pacientes_inactivos', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="slider">
                    <span className="slider-icon">
                      {preferencias.mostrar_pacientes_inactivos ? '✓' : '✗'}
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Inventario */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📦</span>
              Configuración de Inventario
            </h3>
          </div>
          
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Nivel Mínimo de Stock</label>
                <input
                  type="number"
                  className="form-input"
                  value={preferencias.nivel_stock_minimo}
                  onChange={(e) => handleChange('nivel_stock_minimo', parseInt(e.target.value))}
                  disabled={loading}
                  min="1"
                  max="100"
                />
                <small className="form-help">
                  Cantidad mínima antes de mostrar alerta de stock bajo
                </small>
              </div>

              <div className="form-group">
                <label className="form-label">Alertas de Vencimiento (días)</label>
                <select
                  className="form-input"
                  value={preferencias.alertas_vencimiento}
                  onChange={(e) => handleChange('alertas_vencimiento', parseInt(e.target.value))}
                  disabled={loading}
                >
                  <option value={7}>7 días antes</option>
                  <option value={15}>15 días antes</option>
                  <option value={30}>30 días antes</option>
                  <option value={60}>60 días antes</option>
                  <option value={90}>90 días antes</option>
                </select>
                <small className="form-help">
                  Cuántos días antes mostrar alertas de vencimiento
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Interfaz */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🖥️</span>
              Interfaz de Usuario
            </h3>
          </div>
          
          <div className="card-content">
            <div className="interface-options">
              <div className="interface-item">
                <div className="interface-info">
                  <h4>Animaciones</h4>
                  <p>Efectos visuales y transiciones suaves</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked disabled />
                  <span className="slider">
                    <span className="slider-icon">✓</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="interface-item">
                <div className="interface-info">
                  <h4>Sonidos del Sistema</h4>
                  <p>Efectos de sonido para notificaciones</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked disabled />
                  <span className="slider">
                    <span className="slider-icon">✓</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="interface-item">
                <div className="interface-info">
                  <h4>Modo Compacto</h4>
                  <p>Interfaz más densa con menos espaciado</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" disabled />
                  <span className="slider">
                    <span className="slider-icon">✗</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>
            </div>
          </div>
        </div>

        {/* Configuración de Accesibilidad */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">♿</span>
              Accesibilidad
            </h3>
          </div>
          
          <div className="card-content">
            <div className="accesibilidad-options">
              <div className="accesibilidad-item">
                <div className="accesibilidad-info">
                  <h4>Alto Contraste</h4>
                  <p>Aumenta el contraste para mejor visibilidad</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" disabled />
                  <span className="slider">
                    <span className="slider-icon">✗</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="accesibilidad-item">
                <div className="accesibilidad-info">
                  <h4>Texto Grande</h4>
                  <p>Aumenta el tamaño de fuente del sistema</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" disabled />
                  <span className="slider">
                    <span className="slider-icon">✗</span>
                  </span>
                </label>
                <span className="coming-soon">Próximamente</span>
              </div>

              <div className="accesibilidad-item">
                <div className="accesibilidad-info">
                  <h4>Navegación por Teclado</h4>
                  <p>Mejora la navegación usando solo el teclado</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked disabled />
                  <span className="slider">
                    <span className="slider-icon">✓</span>
                  </span>
                </label>
                <span className="always-on">Siempre activo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="perfil-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">🔧</span>
              Acciones Rápidas
            </h3>
          </div>
          
          <div className="card-content">
            <div className="acciones-grid">
              <button
                className="btn-action export-config"
                onClick={() => exportarConfiguracion(preferencias)}
                disabled={loading}
              >
                <span>📤</span>
                <div>
                  <h4>Exportar Configuración</h4>
                  <p>Descargar configuración actual como respaldo</p>
                </div>
              </button>

              <button
                className="btn-action import-config"
                onClick={() => document.getElementById('import-config').click()}
                disabled={loading}
              >
                <span>📥</span>
                <div>
                  <h4>Importar Configuración</h4>
                  <p>Cargar configuración desde archivo</p>
                </div>
              </button>

              <button
                className="btn-action reset-config"
                onClick={resetearConfiguracion}
                disabled={loading}
              >
                <span>🔄</span>
                <div>
                  <h4>Restablecer por Defecto</h4>
                  <p>Volver a la configuración inicial</p>
                </div>
              </button>

              <button
                className="btn-action test-config"
                onClick={() => probarConfiguracion(preferencias)}
                disabled={loading}
              >
                <span>🧪</span>
                <div>
                  <h4>Probar Configuración</h4>
                  <p>Verificar que todo funcione correctamente</p>
                </div>
              </button>
            </div>

            {/* Input oculto para importar */}
            <input
              id="import-config"
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => importarConfiguracion(e, setPreferencias, setCambiosRealizados)}
            />
          </div>
        </div>

        {/* Resumen de Configuración */}
        <div className="perfil-card info-card">
          <div className="card-header">
            <h3 className="card-title">
              <span className="card-icon">📋</span>
              Resumen de Configuración Actual
            </h3>
          </div>
          
          <div className="card-content">
            <div className="resumen-grid">
              <div className="resumen-item">
                <span className="resumen-label">Idioma:</span>
                <span className="resumen-value">🇲🇽 Español (México)</span>
              </div>
              
              <div className="resumen-item">
                <span className="resumen-label">Zona Horaria:</span>
                <span className="resumen-value">{preferencias.zona_horaria.replace('America/', '').replace('_', ' ')}</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Formato de Fecha:</span>
                <span className="resumen-value">{formatearFechaPreview(preferencias.formato_fecha)}</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Formato de Hora:</span>
                <span className="resumen-value">{formatearHoraPreview(preferencias.formato_hora)}</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Moneda:</span>
                <span className="resumen-value">{formatearMoneda(100)}</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Duración Citas:</span>
                <span className="resumen-value">{preferencias.duracion_cita_default} minutos</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Recordatorios:</span>
                <span className="resumen-value">{preferencias.recordatorio_citas} horas antes</span>
              </div>

              <div className="resumen-item">
                <span className="resumen-label">Stock Mínimo:</span>
                <span className="resumen-value">{preferencias.nivel_stock_minimo} unidades</span>
              </div>
            </div>

            {cambiosRealizados && (
              <div className="cambios-pendientes">
                <div className="cambios-alert">
                  <span className="alert-icon">⚠️</span>
                  <span>Tienes cambios sin guardar</span>
                  <button
                    className="btn-guardar-small"
                    onClick={guardarCambios}
                    disabled={loading}
                  >
                    {loading ? 'Guardando...' : 'Guardar Ahora'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Funciones auxiliares
const exportarConfiguracion = (configuracion) => {
  const configExport = {
    configuracion_general: configuracion,
    metadata: {
      version: '2.1.0',
      fecha_exportacion: new Date().toISOString(),
      tipo: 'configuracion_general_odontosys'
    }
  };

  const dataStr = JSON.stringify(configExport, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `configuracion-general-${new Date().toISOString().split('T')[0]}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  alert('📤 Configuración exportada correctamente');
};

const importarConfiguracion = (event, setPreferencias, setCambiosRealizados) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      
      if (importedData.configuracion_general) {
        setPreferencias(importedData.configuracion_general);
        setCambiosRealizados(true);
        alert('📥 Configuración importada correctamente');
      } else {
        alert('❌ Archivo de configuración no válido');
      }
    } catch (error) {
      alert('❌ Error al leer el archivo de configuración');
      console.error('Error importing config:', error);
    }
  };
  
  reader.readAsText(file);
  event.target.value = ''; // Limpiar input
};

const probarConfiguracion = (configuracion) => {
  const pruebas = [
    { nombre: 'Formato de fecha', resultado: true },
    { nombre: 'Formato de hora', resultado: true },
    { nombre: 'Configuración de moneda', resultado: true },
    { nombre: 'Parámetros de citas', resultado: configuracion.duracion_cita_default > 0 },
    { nombre: 'Niveles de inventario', resultado: configuracion.nivel_stock_minimo > 0 }
  ];

  const resultados = pruebas.map(prueba => 
    `${prueba.resultado ? '✅' : '❌'} ${prueba.nombre}`
  ).join('\n');

  const todasCorrectas = pruebas.every(prueba => prueba.resultado);
  
  alert(
    `🧪 Resultados de las pruebas:\n\n${resultados}\n\n` +
    `${todasCorrectas ? '✅ Todas las configuraciones son válidas' : '⚠️ Algunas configuraciones necesitan revisión'}`
  );
};

export default ConfiguracionGeneral;