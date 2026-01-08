import React, { useState } from 'react';
import { EstadoActualizadoModal } from '../../components/modals/ModalSystem'; // 🆕 Importar el nuevo modal
import '../../css/CitasHistorialSection.css';

const CitasHistorialSection = ({ 
  citas, 
  loadingCitas, 
  formatearFecha, 
  formatearFechaHora,
  buildApiUrl,
  onActualizarEstado 
}) => {
  const [modalVerCitaOpen, setModalVerCitaOpen] = useState(false);
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [modalEstadoOpen, setModalEstadoOpen] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  
  // 🆕 Estados para el modal de confirmación de estado actualizado
  const [modalEstadoActualizadoOpen, setModalEstadoActualizadoOpen] = useState(false);
  const [estadoActualizado, setEstadoActualizado] = useState('');

  // Función para obtener el icono del estado
  const getEstadoIcono = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'programada': return '📅';
      case 'confirmada': return '✅';
      case 'en_proceso': return '🔄';
      case 'completada': return '✅';
      case 'cancelada': return '❌';
      case 'no_asistio': return '🚫';
      default: return '📅';
    }
  };

  // Función para obtener el color del estado
  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'programada': return 'azul';
      case 'confirmada': return 'verde';
      case 'en_proceso': return 'amarillo';
      case 'completada': return 'verde-oscuro';
      case 'cancelada': return 'rojo';
      case 'no_asistio': return 'gris';
      default: return 'azul';
    }
  };

  // 🆕 FUNCIÓN PARA VERIFICAR SI LA CONSULTA SE REALIZÓ
  const consultaSeRealizo = (estado) => {
    return estado?.toLowerCase() === 'completada';
  };

  // Función para formatear fecha compacta
  const formatearFechaCompacta = (fecha) => {
    if (!fecha) return 'Sin fecha';
    const date = new Date(fecha);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Función para formatear hora
  const formatearHora = (hora) => {
    if (!hora) return 'No especificada';
    return hora.substring(0, 5); // HH:MM
  };

  // Función para formatear precio
  const formatearPrecio = (precio) => {
    if (!precio || precio === 0) return 'Sin costo';
    return `$${parseFloat(precio).toFixed(2)}`;
  };

  // 🆕 FUNCIÓN ACTUALIZADA para actualizar estado de cita
  const actualizarEstadoCita = async () => {
    if (!citaSeleccionada || !nuevoEstado) return;

    try {
      const response = await fetch(buildApiUrl(`/citas/${citaSeleccionada.id}/estado`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        const citaActualizada = { ...citaSeleccionada, estado: nuevoEstado };
        setCitaSeleccionada(citaActualizada);
        
        // 🆕 Cerrar el modal de cambio de estado
        setModalEstadoOpen(false);
        setModalVerCitaOpen(false);
        
        // 🆕 Mostrar el modal de confirmación con el nuevo estado
        setEstadoActualizado(nuevoEstado);
        setModalEstadoActualizadoOpen(true);
        
        if (onActualizarEstado) {
          onActualizarEstado(citaSeleccionada.id, nuevoEstado);
        }

        // 🆕 Ya no mostramos alert, el modal se encarga de la notificación
      } else {
        throw new Error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error al actualizar estado:', error);
      alert('❌ Error al actualizar el estado de la cita');
    }
  };

  // Loading state
  if (loadingCitas) {
    return (
      <div className="loading-section">
        <div className="spinner"></div>
        <p>Cargando historial de citas...</p>
      </div>
    );
  }

  // Empty state
  if (citas.length === 0) {
    return (
      <div className="seccion-vacia">
        <div className="icono-vacio">📅</div>
        <h3>Sin Historial de Citas</h3>
        <p>Este paciente no tiene citas registradas. Las citas aparecerán aquí cuando se agenden consultas.</p>
      </div>
    );
  }

  // Main render - VISTA COMPACTA MEJORADA
  return (
    <div className="seccion-completa">
      <div className="seccion-header">
        <h2>📅 Historial de Citas ({citas.length})</h2>
        <div className="citas-stats">
          <span className="stat-item">
            ✅ Completadas: {citas.filter(c => c.estado?.toLowerCase() === 'completada').length}
          </span>
          <span className="stat-item">
            📅 Programadas: {citas.filter(c => ['programada', 'confirmada'].includes(c.estado?.toLowerCase())).length}
          </span>
          <span className="stat-item">
            ❌ Canceladas: {citas.filter(c => ['cancelada', 'no_asistio'].includes(c.estado?.toLowerCase())).length}
          </span>
        </div>
      </div>

      {/* 🆕 VISTA COMPACTA MEJORADA - Con datos clínicos cuando aplica */}
      <div className="citas-lista-compacta">
        {citas.map((cita) => (
          <div key={cita.id} className={`cita-item-compacto ${consultaSeRealizo(cita.estado) ? 'cita-completada' : ''}`}>
            
            {/* Fecha y hora principal */}
            <div className="cita-fecha-hora">
              <div className="fecha-icono">📅</div>
              <div className="fecha-texto">
                <div className="fecha-principal">
                  {formatearFechaCompacta(cita.fecha_cita)}
                </div>
                <div className="hora-principal">
                  🕐 {formatearHora(cita.hora_cita)}
                </div>
              </div>
            </div>

            {/* Información clínica (solo si la consulta se realizó) */}
            {consultaSeRealizo(cita.estado) && (
              <div className="cita-info-clinica">
                {cita.motivo_consulta && (
                  <div className="info-clinica-item">
                    <span className="info-label">💬 Motivo:</span>
                    <span className="info-texto">{cita.motivo_consulta}</span>
                  </div>
                )}
                
                {cita.diagnostico && (
                  <div className="info-clinica-item">
                    <span className="info-label">🩺 Diagnóstico:</span>
                    <span className="info-texto">{cita.diagnostico}</span>
                  </div>
                )}
                
                {cita.tratamiento && (
                  <div className="info-clinica-item">
                    <span className="info-label">💊 Tratamiento:</span>
                    <span className="info-texto">{cita.tratamiento}</span>
                  </div>
                )}
              </div>
            )}

            {/* Estado */}
            <div className="cita-estado">
              <span className={`estado-badge-compacto estado-${getEstadoColor(cita.estado)}`}>
                {cita.estado || 'Programada'}
              </span>
            </div>

            {/* Botones de acción */}
            <div className="cita-acciones-compactas">
              <button
                onClick={() => {
                  setCitaSeleccionada(cita);
                  setModalVerCitaOpen(true);
                }}
                className="btn-detalle-compacto"
                title="Ver detalles completos"
              >
                Ver Detalles
              </button>
              
              {!['completada', 'cancelada', 'no_asistio'].includes(cita.estado?.toLowerCase()) && (
                <button
                  onClick={() => {
                    setCitaSeleccionada(cita);
                    setNuevoEstado(cita.estado);
                    setModalEstadoOpen(true);
                  }}
                  className="btn-estado-compacto"
                  title="Cambiar estado de la cita"
                >
                  Cambiar Estado
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Ver Detalles de Cita - MEJORADO CON DATOS CLÍNICOS */}
      {modalVerCitaOpen && citaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-amplio">
            <div className="modal-header">
              <h2>👁️ Detalles de la Cita</h2>
              <button 
                onClick={() => {
                  setModalVerCitaOpen(false);
                  setCitaSeleccionada(null);
                }}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="detalle-cita">
                <div className="cita-header-modal">
                  <h3>📅 {formatearFechaCompacta(citaSeleccionada.fecha_cita)} a las {formatearHora(citaSeleccionada.hora_cita)}</h3>
                  <span className={`estado-badge estado-${getEstadoColor(citaSeleccionada.estado)}`}>
                    {getEstadoIcono(citaSeleccionada.estado)} {citaSeleccionada.estado}
                  </span>
                </div>

                <div className="detalles-grid">
                  {/* Información básica de la cita */}
                  <div className="detalle-item">
                    <strong>👨‍⚕️ Doctor:</strong>
                    <span>{citaSeleccionada.doctor_nombre_completo || 'No asignado'}</span>
                  </div>

                  <div className="detalle-item">
                    <strong>🩺 Tipo de Consulta:</strong>
                    <span>{citaSeleccionada.tipo_cita || citaSeleccionada.tipo_consulta_nombre || 'Consulta General'}</span>
                  </div>

                  <div className="detalle-item">
                    <strong>💰 Costo:</strong>
                    <span className="precio-display">{formatearPrecio(citaSeleccionada.precio)}</span>
                  </div>

                  {citaSeleccionada.doctor_especialidad && (
                    <div className="detalle-item">
                      <strong>🎓 Especialidad:</strong>
                      <span>{citaSeleccionada.doctor_especialidad}</span>
                    </div>
                  )}

                  <div className="detalle-item">
                    <strong>📅 Fecha de Creación:</strong>
                    <span>{formatearFechaCompacta(citaSeleccionada.fecha_creacion)}</span>
                  </div>

                  {citaSeleccionada.fecha_actualizacion && (
                    <div className="detalle-item">
                      <strong>🔄 Última Actualización:</strong>
                      <span>{formatearFechaCompacta(citaSeleccionada.fecha_actualizacion)}</span>
                    </div>
                  )}

                  {citaSeleccionada.observaciones && (
                    <div className="detalle-item-full">
                      <strong>📝 Observaciones:</strong>
                      <p>{citaSeleccionada.observaciones}</p>
                    </div>
                  )}

                  {citaSeleccionada.tipo_consulta_descripcion && (
                    <div className="detalle-item-full">
                      <strong>ℹ️ Descripción del Tipo:</strong>
                      <p>{citaSeleccionada.tipo_consulta_descripcion}</p>
                    </div>
                  )}
                </div>

                {/* 🆕 SECCIÓN DE INFORMACIÓN CLÍNICA - Solo si la consulta se realizó */}
                {consultaSeRealizo(citaSeleccionada.estado) && (
                  <div className="seccion-informacion-clinica">
                    <h4 className="seccion-titulo">🏥 Información Clínica de la Consulta</h4>
                    
                    <div className="detalles-grid">
                      {citaSeleccionada.motivo_consulta && (
                        <div className="detalle-item-full detalle-clinico">
                          <strong>💬 Motivo de la Consulta:</strong>
                          <div className="contenido-clinico">
                            {citaSeleccionada.motivo_consulta}
                          </div>
                        </div>
                      )}

                      {citaSeleccionada.diagnostico && (
                        <div className="detalle-item-full detalle-clinico">
                          <strong>🩺 Diagnóstico:</strong>
                          <div className="contenido-clinico">
                            {citaSeleccionada.diagnostico}
                          </div>
                        </div>
                      )}

                      {citaSeleccionada.tratamiento && (
                        <div className="detalle-item-full detalle-clinico">
                          <strong>💊 Tratamiento Prescrito:</strong>
                          <div className="contenido-clinico">
                            {citaSeleccionada.tratamiento}
                          </div>
                        </div>
                      )}

                      {citaSeleccionada.medicamentos && (
                        <div className="detalle-item-full detalle-clinico">
                          <strong>💉 Medicamentos:</strong>
                          <div className="contenido-clinico">
                            {citaSeleccionada.medicamentos}
                          </div>
                        </div>
                      )}

                      {citaSeleccionada.indicaciones && (
                        <div className="detalle-item-full detalle-clinico">
                          <strong>📋 Indicaciones:</strong>
                          <div className="contenido-clinico">
                            {citaSeleccionada.indicaciones}
                          </div>
                        </div>
                      )}

                      {citaSeleccionada.proxima_cita && (
                        <div className="detalle-item">
                          <strong>📅 Próxima Cita:</strong>
                          <span>{formatearFechaCompacta(citaSeleccionada.proxima_cita)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 🆕 MENSAJE CUANDO NO HAY INFORMACIÓN CLÍNICA */}
                {!consultaSeRealizo(citaSeleccionada.estado) && (
                  <div className="sin-informacion-clinica">
                    <div className="mensaje-info">
                      <span className="icono-info">ℹ️</span>
                      <div className="texto-info">
                        <strong>Información Clínica No Disponible</strong>
                        <p>Los datos clínicos (motivo, diagnóstico, tratamiento) solo aparecen cuando la consulta se ha completado.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => {
                  setModalVerCitaOpen(false);
                  setCitaSeleccionada(null);
                }}
                className="btn-secundario"
              >
                ✅ Cerrar
              </button>
              
              {!['completada', 'cancelada', 'no_asistio'].includes(citaSeleccionada.estado?.toLowerCase()) && (
                <button
                  onClick={() => {
                    setNuevoEstado(citaSeleccionada.estado);
                    setModalEstadoOpen(true);
                  }}
                  className="btn-primario"
                >
                  🔄 Cambiar Estado
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Cambiar Estado */}
      {modalEstadoOpen && citaSeleccionada && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>🔄 Cambiar Estado de Cita</h2>
              <button 
                onClick={() => setModalEstadoOpen(false)}
                className="close-btn"
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="cambio-estado">
                <p><strong>Cita:</strong> {formatearFechaCompacta(citaSeleccionada.fecha_cita)} - {formatearHora(citaSeleccionada.hora_cita)}</p>
                <p><strong>Estado actual:</strong> {citaSeleccionada.estado}</p>

                <div className="form-group">
                  <label>Nuevo Estado:</label>
                  <select 
                    value={nuevoEstado} 
                    onChange={(e) => setNuevoEstado(e.target.value)}
                  >
                    <option value="Programada">📅 Programada</option>
                    <option value="Confirmada">✅ Confirmada</option>
                    <option value="En_Proceso">🔄 En Proceso</option>
                    <option value="Completada">✅ Completada</option>
                    <option value="Cancelada">❌ Cancelada</option>
                    <option value="No_Asistio">🚫 No Asistió</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                onClick={() => setModalEstadoOpen(false)}
                className="btn-secundario"
              >
                ❌ Cancelar
              </button>
              <button 
                onClick={actualizarEstadoCita}
                className="btn-primario"
                disabled={!nuevoEstado || nuevoEstado === citaSeleccionada.estado}
              >
                ✅ Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 MODAL DE CONFIRMACIÓN DE ESTADO ACTUALIZADO */}
      <EstadoActualizadoModal
        isOpen={modalEstadoActualizadoOpen}
        onClose={() => setModalEstadoActualizadoOpen(false)}
        nuevoEstado={estadoActualizado}
        autoClose={true}
        autoCloseDelay={4000}
      />
    </div>
  );
};

export default CitasHistorialSection;