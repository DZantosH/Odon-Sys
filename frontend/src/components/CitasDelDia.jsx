// CitasDelDia.jsx - VERSIÓN FINAL FUNCIONAL

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/config.js';
import { useAuth } from '../services/AuthContext.js';
import '../css/PanelPrincipal.css';

const CitasDelDia = ({ fecha, isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Función para obtener headers con autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const cargarCitasDelDia = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const fechaParaConsultar = fecha || new Date();
      const fechaFormateada = fechaParaConsultar.toISOString().split('T')[0];
      
      console.log('🔍 === CARGANDO CITAS ===');
      console.log('📅 Fecha:', fechaFormateada);
      
      const url = buildApiUrl(`/citas/fecha/${fechaFormateada}`);
      console.log('🌐 URL completa:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getAuthHeaders()
      });
      
      console.log('📡 Status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('📋 Respuesta completa:', result);
        
        // Extraer citas
        const citasData = result.data || result.citas || result || [];
        console.log('📊 Citas extraídas:', citasData.length);
        
        if (Array.isArray(citasData)) {
          // Filtrar por hora si es hoy
          let citasFiltradas = citasData;
          const ahora = new Date();
          const fechaSeleccionada = new Date(fechaParaConsultar);
          
          if (fechaSeleccionada.toDateString() === ahora.toDateString()) {
            citasFiltradas = citasData.filter(cita => {
              if (cita.hora_cita) {
                const [horas, minutos] = cita.hora_cita.split(':').map(Number);
                const fechaHoraCita = new Date(fechaSeleccionada);
                fechaHoraCita.setHours(horas, minutos, 0, 0);
                
                // Margen de 30 minutos antes
                const margen = 30 * 60 * 1000;
                return fechaHoraCita.getTime() >= (ahora.getTime() - margen);
              }
              return true;
            });
          }
          
          console.log('✅ Citas después del filtro:', citasFiltradas.length);
          setCitas(citasFiltradas);
        } else {
          console.warn('⚠️ citasData no es array:', citasData);
          setCitas([]);
        }
      } else {
        const errorText = await response.text();
        console.error('❌ Error HTTP:', response.status, errorText);
        setError(`Error ${response.status}: ${errorText}`);
        setCitas([]);
      }
    } catch (error) {
      console.error('❌ Excepción:', error);
      setError('Error de conexión: ' + error.message);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [fecha]);

  useEffect(() => {
    if (isOpen) {
      console.log('🚀 Modal abierto, cargando citas...');
      cargarCitasDelDia();
    }
  }, [isOpen, cargarCitasDelDia]);

  // Función para navegar al historial
  const irAlHistorial = (cita) => {
    console.log('🎯 === NAVEGANDO AL HISTORIAL ===');
    console.log('📋 Cita:', cita);
    
    const pacienteId = cita.paciente_id;
    console.log('👤 ID del paciente:', pacienteId);
    
    if (!pacienteId) {
      alert('❌ Error: No se encontró el ID del paciente');
      return;
    }
    
    // Datos del paciente
    const pacienteData = {
      id: pacienteId,
      nombre: cita.paciente_nombre || '',
      apellido_paterno: cita.paciente_apellido || '',
      apellido_materno: cita.paciente_apellido_materno || ''
    };
    
    console.log('👤 Datos del paciente:', pacienteData);
    
    const ruta = `/historial-paciente/${pacienteId}`;
    console.log('🎯 Navegando a:', ruta);
    
    try {
      navigate(ruta, {
        state: {
          paciente: pacienteData,
          origen: 'citas-del-dia',
          cita: cita,
          vistaInicial: 'consulta-actual',
          timestamp: Date.now()
        }
      });
      
      console.log('✅ Navegación ejecutada');
      onClose();
      
    } catch (error) {
      console.error('❌ Error en navegación:', error);
      alert('❌ Error al navegar: ' + error.message);
    }
  };

  // Función para cambiar estado
  const cambiarEstado = async (citaId, nuevoEstado) => {
    try {
      console.log('🔄 Cambiando estado:', citaId, 'a', nuevoEstado);
      
      const response = await fetch(buildApiUrl(`/citas/${citaId}/estado`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: nuevoEstado })
      });

      if (response.ok) {
        console.log('✅ Estado actualizado');
        cargarCitasDelDia();
      } else {
        console.error('❌ Error al cambiar estado:', response.status);
      }
    } catch (error) {
      console.error('❌ Excepción al cambiar estado:', error);
    }
  };

  const formatearFecha = (fecha) => {
    return fecha.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatearHora = (hora) => {
    return hora ? hora.slice(0, 5) : 'N/A';
  };

  const getEstadoColor = (estado) => {
    const colores = {
      'Programada': '#f59e0b',
      'Confirmada': '#06b6d4',
      'En_Proceso': '#3b82f6',
      'Completada': '#10b981',
      'Cancelada': '#ef4444',
      'No_Asistio': '#6b7280'
    };
    return colores[estado] || '#6b7280';
  };

  if (!isOpen) return null;

  const fechaMostrar = fecha || new Date();

  return (
    <div className="modal-citas-overlay" onClick={(e) => {
      if (e.target.classList.contains('modal-citas-overlay')) {
        onClose();
      }
    }}>
      <div className="modal-citas-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-citas-header">
          <div className="modal-fecha-info">
            <h3>📅 Citas del Día</h3>
            <p className="modal-fecha-seleccionada">
              {formatearFecha(fechaMostrar)}
            </p>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <div className="modal-citas-content">
          {/* Estado de carga */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '20px' }}>
              <div style={{ 
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '3px solid #f3f3f3',
                borderTop: '3px solid #3498db',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              <p style={{ marginTop: '10px' }}>Cargando citas...</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              background: '#fee2e2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              margin: '10px 0',
              color: '#dc2626'
            }}>
              <strong>❌ Error:</strong> {error}
              <br />
              <button
                onClick={cargarCitasDelDia}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  marginTop: '8px',
                  cursor: 'pointer'
                }}
              >
                🔄 Reintentar
              </button>
            </div>
          )}

          {/* Info de debug */}
          <div style={{
            background: '#f0f9ff',
            padding: '10px',
            margin: '8px 0',
            borderRadius: '6px',
            fontSize: '12px',
            border: '1px solid #0ea5e9'
          }}>
            <strong>🔧 Info:</strong>
            <br />• Usuario: {user?.nombre || 'No logueado'}
            <br />• Token: {localStorage.getItem('token') ? '✅' : '❌'}
            <br />• Citas cargadas: {citas.length}
            <br />• Fecha: {fechaMostrar.toISOString().split('T')[0]}
          </div>

          {/* Lista de citas */}
          {!loading && !error && (
            <>
              {citas.length > 0 ? (
                <div>
                  <div style={{
                    background: '#f8fafc',
                    padding: '10px',
                    borderRadius: '6px',
                    marginBottom: '10px',
                    textAlign: 'center'
                  }}>
                    <strong>📊 {citas.length} citas encontradas</strong>
                  </div>
                  
                  {citas
                    .sort((a, b) => a.hora_cita.localeCompare(b.hora_cita))
                    .map((cita) => (
                    <div key={cita.id} style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '12px',
                      marginBottom: '8px',
                      background: 'white',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                    }}>
                      <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'flex-start',
                        gap: '12px'
                      }}>
                        {/* Info de la cita */}
                        <div style={{ flex: 1 }}>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '8px',
                            marginBottom: '4px'
                          }}>
                            <strong style={{ fontSize: '16px' }}>
                              {formatearHora(cita.hora_cita)}
                            </strong>
                            <span style={{
                              background: getEstadoColor(cita.estado),
                              color: 'white',
                              padding: '2px 8px',
                              borderRadius: '12px',
                              fontSize: '11px',
                              fontWeight: '600'
                            }}>
                              {cita.estado}
                            </span>
                          </div>
                          
                          <div style={{ marginBottom: '4px' }}>
                            <strong>
                              {cita.paciente_nombre_completo || 
                               `${cita.paciente_nombre || ''} ${cita.paciente_apellido || ''}`.trim() ||
                               'Paciente sin nombre'}
                            </strong>
                          </div>
                          
                          <div style={{ fontSize: '14px', color: '#6b7280' }}>
                            {cita.tipo_consulta || 'Consulta'} • 
                            {cita.doctor_nombre_completo || 'Doctor no especificado'}
                          </div>
                          
                          {cita.precio && (
                            <div style={{ fontSize: '14px', color: '#059669', fontWeight: '600' }}>
                              💰 ${parseFloat(cita.precio).toLocaleString('es-MX')}
                            </div>
                          )}
                          
                          {/* Debug info por cita */}
                          <div style={{ 
                            fontSize: '10px', 
                            color: '#6b7280',
                            marginTop: '4px',
                            background: '#f9fafb',
                            padding: '4px',
                            borderRadius: '4px'
                          }}>
                            ID Cita: {cita.id} | Paciente ID: {cita.paciente_id}
                          </div>
                        </div>
                        
                        {/* Botones de acción */}
                        <div style={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '4px',
                          minWidth: '120px'
                        }}>
                          <button
                            onClick={() => irAlHistorial(cita)}
                            style={{
                              background: '#3b82f6',
                              color: 'white',
                              border: 'none',
                              padding: '6px 12px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              cursor: 'pointer',
                              width: '100%'
                            }}
                          >
                            📋 Ir a Historial
                          </button>
                          
                          <select
                            value={cita.estado}
                            onChange={(e) => cambiarEstado(cita.id, e.target.value)}
                            style={{
                              fontSize: '11px',
                              padding: '4px',
                              borderRadius: '4px',
                              border: '1px solid #d1d5db',
                              width: '100%'
                            }}
                          >
                            <option value="Programada">Programada</option>
                            <option value="Confirmada">Confirmada</option>
                            <option value="En_Proceso">En Proceso</option>
                            <option value="Completada">Completada</option>
                            <option value="Cancelada">Cancelada</option>
                            <option value="No_Asistio">No Asistió</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                  <div style={{ fontSize: '48px', marginBottom: '16px' }}>📅</div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#374151' }}>
                    No hay citas programadas
                  </h4>
                  <p style={{ margin: '0', color: '#6b7280' }}>
                    No se encontraron citas para este día
                  </p>
                  
                  {/* Botón de test si no hay citas */}
                  <button
                    onClick={() => {
                      console.log('🧪 Test de navegación directa');
                      try {
                        navigate('/historial-paciente/8', {
                          state: {
                            paciente: { id: 8, nombre: 'Brandon', apellido_paterno: 'Reynoso' },
                            origen: 'test-navegacion'
                          }
                        });
                        onClose();
                      } catch (error) {
                        console.error('❌ Error en test:', error);
                        alert('Error: ' + error.message);
                      }
                    }}
                    style={{
                      background: '#f59e0b',
                      color: 'white',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '16px'
                    }}
                  >
                    🧪 Test Navegación (ID: 8)
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="modal-citas-footer">
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
            <button 
              onClick={cargarCitasDelDia}
              disabled={loading}
              style={{
                background: '#10b981',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1
              }}
            >
              🔄 {loading ? 'Cargando...' : 'Actualizar'}
            </button>
            <button 
              onClick={onClose}
              style={{
                background: '#6b7280',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

      {/* Estilos CSS inline para la animación */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default CitasDelDia;