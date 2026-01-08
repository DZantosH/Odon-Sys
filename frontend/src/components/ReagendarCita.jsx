// components/ReagendarCita.jsx - VERSIÓN CORREGIDA

import React, { useState, useEffect } from 'react';
import { buildApiUrl, getAuthHeaders } from '../config/config';
import '../css/ReagendarCita.css';

const ReagendarCita = ({ isOpen, onClose, citaData, onCitaReagendada }) => {
  const [fechaSeleccionada, setFechaSeleccionada] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('');
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState('');

  // Limpiar datos al abrir/cerrar modal
  useEffect(() => {
    if (isOpen && citaData) {
      setFechaSeleccionada('');
      setHoraSeleccionada('');
      setHorariosDisponibles([]);
      setError('');
      console.log('🔄 [REAGENDAR] Modal abierto para cita:', citaData);
    }
  }, [isOpen, citaData]);

  // Cargar horarios disponibles cuando se selecciona una fecha
  useEffect(() => {
    if (fechaSeleccionada && citaData?.id) {
      cargarHorariosDisponibles();
    }
  }, [fechaSeleccionada, citaData?.id]);

  const cargarHorariosDisponibles = async () => {
    try {
      setLoadingHorarios(true);
      setError('');
      
      console.log('⏰ [REAGENDAR] Cargando horarios para fecha:', fechaSeleccionada);
      console.log('⏰ [REAGENDAR] Cita ID:', citaData.id);
      
      // 🔧 CORRECCIÓN: Usar la URL correcta del endpoint
      const url = buildApiUrl(`/citas/${citaData.id}/horarios-disponibles?fecha=${fechaSeleccionada}`);
      console.log('🌐 [REAGENDAR] URL completa:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });

      console.log('📡 [REAGENDAR] Response status:', response.status);
      console.log('📡 [REAGENDAR] Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [REAGENDAR] Horarios recibidos:', data);
        
        const horarios = data.horarios || [];
        setHorariosDisponibles(horarios);
        
        if (horarios.length === 0) {
          setError('No hay horarios disponibles para esta fecha');
        }
      } else {
        const errorText = await response.text();
        console.error('❌ [REAGENDAR] Error response:', response.status, errorText);
        
        let errorMessage = 'Error al cargar horarios';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${errorText}`;
        }
        
        setError(errorMessage);
        setHorariosDisponibles([]);
      }
    } catch (error) {
      console.error('❌ [REAGENDAR] Error de conexión:', error);
      setError('Error de conexión al cargar horarios');
      setHorariosDisponibles([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const handleReagendarCita = async () => {
    if (!fechaSeleccionada || !horaSeleccionada) {
      setError('Por favor selecciona fecha y hora');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      console.log('🔄 [REAGENDAR] Reagendando cita:', {
        citaId: citaData.id,
        nuevaFecha: fechaSeleccionada,
        nuevaHora: horaSeleccionada
      });

      const url = buildApiUrl(`/citas/${citaData.id}/reagendar`);
      console.log('🌐 [REAGENDAR] URL reagendar:', url);

      const response = await fetch(url, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          nueva_fecha: fechaSeleccionada,
          nueva_hora: horaSeleccionada,
          observaciones: `Reagendada desde la interfaz web el ${new Date().toLocaleString('es-MX')}`
        })
      });

      console.log('📡 [REAGENDAR] Response status reagendar:', response.status);

      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ [REAGENDAR] Cita reagendada exitosamente:', responseData);
        
        if (responseData.success && responseData.cita) {
          // Notificar al componente padre
          onCitaReagendada(responseData.cita);
          
          // Cerrar modal
          onClose();
          
          // Limpiar formulario
          setFechaSeleccionada('');
          setHoraSeleccionada('');
          setHorariosDisponibles([]);
        } else {
          throw new Error(responseData.message || 'Error al reagendar la cita');
        }
        
      } else {
        const errorText = await response.text();
        console.error('❌ [REAGENDAR] Error al reagendar:', errorText);
        
        let errorMessage = 'Error al reagendar la cita';
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          errorMessage = `Error ${response.status}: ${errorText}`;
        }
        
        throw new Error(errorMessage);
      }
      
    } catch (error) {
      console.error('❌ [REAGENDAR] Error al reagendar cita:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFechaSeleccionada('');
      setHoraSeleccionada('');
      setHorariosDisponibles([]);
      setError('');
      onClose();
    }
  };

  const formatearFecha = (fecha) => {
    if (!fecha) return 'Fecha inválida';
    try {
      return new Date(fecha + 'T00:00:00').toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return fecha;
    }
  };

  const formatearHora = (hora) => {
    return hora ? hora.slice(0, 5) : '';
  };

  // Obtener fecha mínima (hoy)
  const today = new Date();
  const minDate = today.toISOString().split('T')[0];

  if (!isOpen) return null;

  return (
    <div className="reagendar-overlay" onClick={(e) => {
      if (e.target.classList.contains('reagendar-overlay') && !loading) {
        handleClose();
      }
    }}>
      <div className="reagendar-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="reagendar-header">
          <div className="reagendar-title-section">
            <h3>🔄 Reprogramar Cita</h3>
            <p className="reagendar-subtitle">
              Selecciona una nueva fecha y hora para la cita
            </p>
          </div>
          <button 
            className="reagendar-close-btn" 
            onClick={handleClose}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {/* Información de la cita actual */}
        {citaData && (
          <div className="cita-actual-info">
            <h4>📋 Información de la Cita</h4>
            <div className="cita-info-grid">
              <div className="info-item">
                <strong>ID Cita:</strong>
                <span>{citaData.id}</span>
              </div>
              <div className="info-item">
                <strong>Paciente:</strong>
                <span>
                  {citaData.paciente_nombre_completo || 
                   `${citaData.paciente_nombre || ''} ${citaData.paciente_apellido || ''}`.trim() ||
                   citaData.nombre_paciente ||
                   'Paciente'}
                </span>
              </div>
              <div className="info-item">
                <strong>Fecha actual:</strong>
                <span>{formatearFecha(citaData.fecha_cita)}</span>
              </div>
              <div className="info-item">
                <strong>Hora actual:</strong>
                <span>{formatearHora(citaData.hora_cita)}</span>
              </div>
              <div className="info-item">
                <strong>Tipo de consulta:</strong>
                <span>{citaData.tipo_consulta_nombre || citaData.tipo_consulta || citaData.tipo_cita || 'Consulta'}</span>
              </div>
              {citaData.precio && (
                <div className="info-item">
                  <strong>Precio:</strong>
                  <span>${parseFloat(citaData.precio).toLocaleString('es-MX')}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Formulario de reagendar */}
        <div className="reagendar-form">
          <h4>📅 Seleccionar Nueva Fecha y Hora</h4>
          
          {/* Selección de fecha */}
          <div className="form-group">
            <label htmlFor="fecha">Nueva fecha:</label>
            <input
              type="date"
              id="fecha"
              value={fechaSeleccionada}
              onChange={(e) => {
                console.log('📅 [REAGENDAR] Fecha seleccionada:', e.target.value);
                setFechaSeleccionada(e.target.value);
                setHoraSeleccionada(''); // Limpiar hora al cambiar fecha
                setError(''); // Limpiar errores
              }}
              min={minDate}
              disabled={loading}
              className="form-control"
            />
          </div>

          {/* Debug info */}
          {fechaSeleccionada && (
            <div style={{ 
              padding: '8px', 
              background: '#f0f0f0', 
              borderRadius: '4px', 
              fontSize: '12px',
              marginBottom: '10px'
            }}>
              <strong>🔍 Debug:</strong> Cita ID: {citaData?.id}, Fecha: {fechaSeleccionada}
            </div>
          )}

          {/* Selección de hora */}
          {fechaSeleccionada && (
            <div className="form-group">
              <label>Nueva hora:</label>
              
              {loadingHorarios ? (
                <div className="loading-horarios">
                  <div className="spinner-small"></div>
                  <span>Cargando horarios disponibles...</span>
                </div>
              ) : horariosDisponibles.length > 0 ? (
                <div className="horarios-grid">
                  {horariosDisponibles.map((horario) => (
                    <button
                      key={horario}
                      type="button"
                      className={`horario-btn ${horaSeleccionada === horario ? 'selected' : ''}`}
                      onClick={() => {
                        console.log('⏰ [REAGENDAR] Hora seleccionada:', horario);
                        setHoraSeleccionada(horario);
                        setError(''); // Limpiar errores
                      }}
                      disabled={loading}
                    >
                      {formatearHora(horario)}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="no-horarios">
                  <p>❌ No hay horarios disponibles para esta fecha</p>
                  <p className="no-horarios-subtitle">
                    Por favor selecciona otra fecha
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Mostrar error */}
          {error && (
            <div className="error-message" style={{
              background: '#fee',
              border: '1px solid #fcc',
              borderRadius: '4px',
              padding: '10px',
              margin: '10px 0',
              color: '#c33'
            }}>
              <span>❌ {error}</span>
            </div>
          )}

          {/* Resumen de la nueva programación */}
          {fechaSeleccionada && horaSeleccionada && (
            <div className="resumen-reagendar">
              <h4>✅ Nueva Programación</h4>
              <div className="resumen-content">
                <p>
                  <strong>Fecha:</strong> {formatearFecha(fechaSeleccionada)}
                </p>
                <p>
                  <strong>Hora:</strong> {formatearHora(horaSeleccionada)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botones de acción */}
        <div className="reagendar-actions">
          <button
            className="btn-cancelar"
            onClick={handleClose}
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            className="btn-reagendar"
            onClick={handleReagendarCita}
            disabled={loading || !fechaSeleccionada || !horaSeleccionada}
          >
            {loading ? (
              <>
                <div className="spinner-small"></div>
                Reagendando...
              </>
            ) : (
              <>
                🔄 Reprogramar Cita
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReagendarCita;