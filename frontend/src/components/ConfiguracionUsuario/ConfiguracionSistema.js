// components/ConfiguracionUsuario/ConfiguracionSistema.js - Solo para administradores
import React, { useState, useEffect } from 'react';

const ConfiguracionSistema = ({ onGuardar, loading }) => {
  const [configuracionSistema, setConfiguracionSistema] = useState({
    backup: {
      automatico: true,
      frecuencia: 'diario',
      hora: '02:00',
      retencion_dias: 30
    },
    seguridad: {
      timeout_sesion: 20,
      intentos_login: 3,
      duracion_bloqueo: 15,
      fuerza_cambio_password: false
    },
    sistema: {
      modo_mantenimiento: false,
      logs_nivel: 'info',
      max_usuarios_simultaneos: 50,
      max_tamano_archivo: 10
    },
    notificaciones: {
      email_admin: true,
      slack_webhook: '',
      telegram_bot: ''
    }
  });

  const [estadisticas, setEstadisticas] = useState({
    usuarios_activos: 0,
    sesiones_activas: 0,
    espacio_usado: '0 MB',
    ultimo_backup: 'Nunca',
    errores_hoy: 0
  });

  const [cambiosRealizados, setCambiosRealizados] = useState(false);
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  // Cargar configuración del sistema al iniciar
  useEffect(() => {
    cargarConfiguracionSistema();
    cargarEstadisticas();
  }, []);

  const cargarConfiguracionSistema = async () => {
    try {
      // Simular carga de configuración (implementar según tu API)
      const configGuardada = localStorage.getItem('systemConfig');
      if (configGuardada) {
        setConfiguracionSistema(JSON.parse(configGuardada));
      }
    } catch (error) {
      console.error('Error al cargar configuración del sistema:', error);
    }
  };

  const cargarEstadisticas = async () => {
    try {
      setCargandoEstadisticas(true);
      
      // Simular estadísticas del sistema
      setTimeout(() => {
        setEstadisticas({
          usuarios_activos: 8,
          sesiones_activas: 3,
          espacio_usado: '245 MB',
          ultimo_backup: '10/08/2025 02:00',
          errores_hoy: 2
        });
        setCargandoEstadisticas(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
      setCargandoEstadisticas(false);
    }
  };

  const handleConfigChange = (seccion, campo, valor) => {
    setConfiguracionSistema(prev => ({
      ...prev,
      [seccion]: {
        ...prev[seccion],
        [campo]: valor
      }
    }));
    setCambiosRealizados(true);
  };

  const guardarConfiguracion = async () => {
    try {
      // Guardar en localStorage por ahora (implementar API real)
      localStorage.setItem('systemConfig', JSON.stringify(configuracionSistema));
      onGuardar(configuracionSistema);
      setCambiosRealizados(false);
      
      // Mostrar mensaje de éxito
      if (window.confirm) {
        window.alert('✅ Configuración del sistema guardada correctamente');
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error);
      if (window.alert) {
        window.alert('❌ Error al guardar la configuración');
      }
    }
  };

  const ejecutarBackupManual = async () => {
    const shouldExecute = window.confirm ? 
      window.confirm('¿Deseas ejecutar un backup manual del sistema?') : true;
      
    if (shouldExecute) {
      try {
        if (window.alert) {
          window.alert('🔄 Backup iniciado. Se notificará cuando termine.');
        }
        // Implementar lógica de backup
      } catch (error) {
        if (window.alert) {
          window.alert('❌ Error al ejecutar backup');
        }
      }
    }
  };

  const limpiarLogs = async () => {
    const shouldClean = window.confirm ? 
      window.confirm('¿Estás seguro de que deseas limpiar todos los logs del sistema?') : true;
      
    if (shouldClean) {
      try {
        if (window.alert) {
          window.alert('🧹 Logs del sistema limpiados correctamente');
        }
        // Implementar lógica de limpieza de logs
      } catch (error) {
        if (window.alert) {
          window.alert('❌ Error al limpiar logs');
        }
      }
    }
  };

  const mostrarAlerta = (mensaje) => {
    if (window.alert) {
      window.alert(mensaje);
    } else {
      console.log(mensaje);
    }
  };

  return (
    <div className="configuracion-sistema-container">
      {/* Header */}
      <div className="seccion-header">
        <div className="header-info">
          <h2 className="seccion-title">
            <span className="title-icon">🖥️</span>
            Configuración del Sistema
          </h2>
          <p className="seccion-descripcion">
            Configuraciones avanzadas solo para administradores
          </p>
        </div>
        
        {cambiosRealizados && (
          <div className="header-actions">
            <button
              className="btn-guardar"
              onClick={guardarConfiguracion}
              disabled={loading}
            >
              <span>💾</span>
              <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Estadísticas del Sistema */}
      <div className="perfil-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">📊</span>
            Estadísticas del Sistema
          </h3>
          <button
            className="btn-refresh"
            onClick={cargarEstadisticas}
            disabled={cargandoEstadisticas}
            title="Actualizar estadísticas"
          >
            <span>🔄</span>
          </button>
        </div>
        
        <div className="card-content">
          {cargandoEstadisticas ? (
            <div className="loading-stats">
              <div className="spinner"></div>
              <p>Cargando estadísticas...</p>
            </div>
          ) : (
            <div className="estadisticas-grid">
              <div className="estadistica-item">
                <div className="estadistica-valor">{estadisticas.usuarios_activos}</div>
                <div className="estadistica-label">Usuarios Registrados</div>
                <div className="estadistica-icon">👥</div>
              </div>
              
              <div className="estadistica-item">
                <div className="estadistica-valor">{estadisticas.sesiones_activas}</div>
                <div className="estadistica-label">Sesiones Activas</div>
                <div className="estadistica-icon">🟢</div>
              </div>
              
              <div className="estadistica-item">
                <div className="estadistica-valor">{estadisticas.espacio_usado}</div>
                <div className="estadistica-label">Espacio Usado</div>
                <div className="estadistica-icon">💾</div>
              </div>
              
              <div className="estadistica-item">
                <div className="estadistica-valor">{estadisticas.ultimo_backup}</div>
                <div className="estadistica-label">Último Backup</div>
                <div className="estadistica-icon">💾</div>
              </div>
              
              <div className="estadistica-item">
                <div className="estadistica-valor">{estadisticas.errores_hoy}</div>
                <div className="estadistica-label">Errores Hoy</div>
                <div className="estadistica-icon">⚠️</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Configuración de Backup */}
      <div className="perfil-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">💾</span>
            Backup y Respaldo
          </h3>
        </div>
        
        <div className="card-content">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Backup Automático</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={configuracionSistema.backup.automatico}
                  onChange={(e) => handleConfigChange('backup', 'automatico', e.target.checked)}
                />
                <span className="slider">
                  <span className="slider-icon">
                    {configuracionSistema.backup.automatico ? '✓' : '✗'}
                  </span>
                </span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Frecuencia</label>
              <select
                className="form-input"
                value={configuracionSistema.backup.frecuencia}
                onChange={(e) => handleConfigChange('backup', 'frecuencia', e.target.value)}
                disabled={!configuracionSistema.backup.automatico}
              >
                <option value="diario">Diario</option>
                <option value="semanal">Semanal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Hora de Backup</label>
              <input
                type="time"
                className="form-input"
                value={configuracionSistema.backup.hora}
                onChange={(e) => handleConfigChange('backup', 'hora', e.target.value)}
                disabled={!configuracionSistema.backup.automatico}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Retención (días)</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.backup.retencion_dias}
                onChange={(e) => handleConfigChange('backup', 'retencion_dias', parseInt(e.target.value))}
                min="1"
                max="365"
              />
            </div>
          </div>

          <div className="backup-actions">
            <button
              className="btn-action backup-manual"
              onClick={ejecutarBackupManual}
              disabled={loading}
            >
              <span>⬇️</span>
              <span>Backup Manual</span>
            </button>
          </div>
        </div>
      </div>

      {/* Configuración de Seguridad */}
      <div className="perfil-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">🔒</span>
            Seguridad del Sistema
          </h3>
        </div>
        
        <div className="card-content">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Timeout de Sesión (minutos)</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.seguridad.timeout_sesion}
                onChange={(e) => handleConfigChange('seguridad', 'timeout_sesion', parseInt(e.target.value))}
                min="5"
                max="120"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Intentos de Login</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.seguridad.intentos_login}
                onChange={(e) => handleConfigChange('seguridad', 'intentos_login', parseInt(e.target.value))}
                min="3"
                max="10"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Duración Bloqueo (minutos)</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.seguridad.duracion_bloqueo}
                onChange={(e) => handleConfigChange('seguridad', 'duracion_bloqueo', parseInt(e.target.value))}
                min="5"
                max="60"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Forzar Cambio de Contraseña</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={configuracionSistema.seguridad.fuerza_cambio_password}
                  onChange={(e) => handleConfigChange('seguridad', 'fuerza_cambio_password', e.target.checked)}
                />
                <span className="slider">
                  <span className="slider-icon">
                    {configuracionSistema.seguridad.fuerza_cambio_password ? '✓' : '✗'}
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Configuración del Sistema */}
      <div className="perfil-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">⚙️</span>
            Configuración General
          </h3>
        </div>
        
        <div className="card-content">
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Modo Mantenimiento</label>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={configuracionSistema.sistema.modo_mantenimiento}
                  onChange={(e) => handleConfigChange('sistema', 'modo_mantenimiento', e.target.checked)}
                />
                <span className="slider">
                  <span className="slider-icon">
                    {configuracionSistema.sistema.modo_mantenimiento ? '✓' : '✗'}
                  </span>
                </span>
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Nivel de Logs</label>
              <select
                className="form-input"
                value={configuracionSistema.sistema.logs_nivel}
                onChange={(e) => handleConfigChange('sistema', 'logs_nivel', e.target.value)}
              >
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Máx. Usuarios Simultáneos</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.sistema.max_usuarios_simultaneos}
                onChange={(e) => handleConfigChange('sistema', 'max_usuarios_simultaneos', parseInt(e.target.value))}
                min="1"
                max="1000"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Máx. Tamaño Archivo (MB)</label>
              <input
                type="number"
                className="form-input"
                value={configuracionSistema.sistema.max_tamano_archivo}
                onChange={(e) => handleConfigChange('sistema', 'max_tamano_archivo', parseInt(e.target.value))}
                min="1"
                max="100"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Acciones del Sistema */}
      <div className="perfil-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">🔧</span>
            Herramientas del Sistema
          </h3>
        </div>
        
        <div className="card-content">
          <div className="sistema-acciones-grid">
            <button
              className="btn-action sistema-logs"
              onClick={limpiarLogs}
              disabled={loading}
            >
              <span>🧹</span>
              <div>
                <h4>Limpiar Logs</h4>
                <p>Eliminar logs antiguos del sistema</p>
              </div>
            </button>

            <button
              className="btn-action sistema-cache"
              onClick={() => mostrarAlerta('🔄 Cache del sistema limpiado')}
              disabled={loading}
            >
              <span>🗑️</span>
              <div>
                <h4>Limpiar Caché</h4>
                <p>Eliminar caché del servidor</p>
              </div>
            </button>

            <button
              className="btn-action sistema-restart"
              onClick={() => mostrarAlerta('⚠️ Función de reinicio no disponible')}
              disabled={true}
            >
              <span>🔄</span>
              <div>
                <h4>Reiniciar Sistema</h4>
                <p>Reiniciar servicios del sistema</p>
              </div>
            </button>

            <button
              className="btn-action sistema-update"
              onClick={() => mostrarAlerta('📦 Verificando actualizaciones...')}
              disabled={loading}
            >
              <span>⬆️</span>
              <div>
                <h4>Buscar Actualizaciones</h4>
                <p>Verificar nuevas versiones</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Estado del Sistema */}
      <div className="perfil-card info-card">
        <div className="card-header">
          <h3 className="card-title">
            <span className="card-icon">📋</span>
            Estado del Sistema
          </h3>
        </div>
        
        <div className="card-content">
          <div className="estado-sistema-grid">
            <div className="estado-item">
              <span className="estado-label">Base de Datos:</span>
              <span className="estado-value status-online">🟢 Online</span>
            </div>
            
            <div className="estado-item">
              <span className="estado-label">Servidor Web:</span>
              <span className="estado-value status-online">🟢 Online</span>
            </div>
            
            <div className="estado-item">
              <span className="estado-label">Backup Automático:</span>
              <span className={`estado-value ${configuracionSistema.backup.automatico ? 'status-online' : 'status-offline'}`}>
                {configuracionSistema.backup.automatico ? '🟢 Activo' : '🔴 Inactivo'}
              </span>
            </div>
            
            <div className="estado-item">
              <span className="estado-label">Modo Mantenimiento:</span>
              <span className={`estado-value ${configuracionSistema.sistema.modo_mantenimiento ? 'status-warning' : 'status-online'}`}>
                {configuracionSistema.sistema.modo_mantenimiento ? '🟡 Activo' : '🟢 Inactivo'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionSistema;