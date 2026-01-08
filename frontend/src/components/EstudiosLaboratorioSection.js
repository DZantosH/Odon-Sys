import React, { useState, useCallback } from 'react';
import { ConfirmModal } from '../components/modals/ModalSystem';
import '../css/EstudiosLaboratorioSection.css';

// Modal para solicitar nuevo estudio
const ModalNuevoEstudio = React.memo(({
  isOpen, 
  onClose, 
  formData, 
  onFormChange, 
  onSubmit, 
  submitLoading 
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Formulario enviado');
    console.log('📋 Datos del formulario:', formData);
    
    if (!formData.tipo_estudio.trim()) {
      console.error('❌ Tipo de estudio vacío:', formData.tipo_estudio);
      alert('⚠️ Por favor selecciona un tipo de estudio');
      return;
    }

    console.log('✅ Validación pasada, ejecutando onSubmit...');
    await onSubmit();
  };

  const handleInputChange = useCallback((field, value) => {
    onFormChange(field, value);
  }, [onFormChange]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-estudio">
      <div className="modal-content-estudio">
        <div className="modal-header-estudio">
          <h2>🔬 Solicitar Nuevo Estudio de Laboratorio</h2>
          <button 
            onClick={onClose}
            className="close-btn-estudio"
            disabled={submitLoading}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="modal-body-estudio">
          <form onSubmit={handleSubmit}>
            <div className="form-grid-estudio">
              <div className="form-group-estudio">
                <label htmlFor="tipo-estudio">🔬 Tipo de Estudio</label>
                <select
                  id="tipo-estudio"
                  value={formData.tipo_estudio}
                  onChange={(e) => handleInputChange('tipo_estudio', e.target.value)}
                  required
                  disabled={submitLoading}
                >
                  <option value="">Seleccionar tipo...</option>
                  <option value="Biometría Hemática">Biometría Hemática</option>
                  <option value="Química Sanguínea">Química Sanguínea</option>
                  <option value="Perfil Lipídico">Perfil Lipídico</option>
                  <option value="Examen General de Orina">Examen General de Orina</option>
                  <option value="Perfil Tiroideo">Perfil Tiroideo</option>
                  <option value="Perfil Hepático">Perfil Hepático</option>
                  <option value="Perfil Renal">Perfil Renal</option>
                  <option value="Hemoglobina Glucosilada">Hemoglobina Glucosilada</option>
                  <option value="Antígeno Prostático">Antígeno Prostático</option>
                  <option value="Marcadores Tumorales">Marcadores Tumorales</option>
                  <option value="Cultivo y Antibiograma">Cultivo y Antibiograma</option>
                  <option value="Electroforesis de Proteínas">Electroforesis de Proteínas</option>
                  <option value="Coprológico">Coprológico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div className="form-group-estudio">
                <label htmlFor="urgencia">⚡ Urgencia</label>
                <select
                  id="urgencia"
                  value={formData.urgencia}
                  onChange={(e) => handleInputChange('urgencia', e.target.value)}
                  disabled={submitLoading}
                >
                  <option value="normal">🟢 Normal</option>
                  <option value="media">🟡 Media</option>
                  <option value="alta">🔴 Alta</option>
                </select>
              </div>

              <div className="form-group-estudio">
                <label htmlFor="laboratorio">🏥 Laboratorio Recomendado</label>
                <input
                  type="text"
                  id="laboratorio"
                  value={formData.laboratorio_recomendado}
                  onChange={(e) => handleInputChange('laboratorio_recomendado', e.target.value)}
                  placeholder="Ej: Laboratorio Clínico XYZ"
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group-estudio checkbox-group">
                <label htmlFor="ayunas" className="checkbox-label">
                  <input
                    type="checkbox"
                    id="ayunas"
                    checked={formData.ayunas_requerido}
                    onChange={(e) => handleInputChange('ayunas_requerido', e.target.checked)}
                    disabled={submitLoading}
                  />
                  <span className="checkmark"></span>
                  🍽️ Requiere Ayunas
                </label>
              </div>

              <div className="form-group-estudio form-group-full">
                <label htmlFor="descripcion">📝 Descripción Detallada</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleInputChange('descripcion', e.target.value)}
                  placeholder="Describe qué estudios específicos necesitas..."
                  rows="3"
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group-estudio form-group-full">
                <label htmlFor="preparacion">🔧 Preparación Especial</label>
                <textarea
                  id="preparacion"
                  value={formData.preparacion_especial}
                  onChange={(e) => handleInputChange('preparacion_especial', e.target.value)}
                  placeholder="Instrucciones especiales para el paciente..."
                  rows="2"
                  disabled={submitLoading}
                />
              </div>

              <div className="form-group-estudio form-group-full">
                <label htmlFor="notas">📋 Notas Médicas</label>
                <textarea
                  id="notas"
                  value={formData.notas_medicas}
                  onChange={(e) => handleInputChange('notas_medicas', e.target.value)}
                  placeholder="Notas adicionales o justificación médica..."
                  rows="2"
                  disabled={submitLoading}
                />
              </div>
            </div>

            <div className="modal-actions-estudio">
              <button 
                type="button" 
                onClick={onClose}
                className="btn-cancelar-estudio"
                disabled={submitLoading}
              >
                ❌ Cancelar
              </button>
              <button 
                type="submit" 
                className={`btn-solicitar-estudio ${submitLoading ? 'loading' : ''}`}
                disabled={submitLoading}
              >
                {submitLoading ? (
                  <>
                    <span className="spinner-btn"></span>
                    ⏳ Solicitando...
                  </>
                ) : (
                  '✅ Solicitar Estudio'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
});

// Modal para ver detalles del estudio
const ModalVerEstudio = React.memo(({
  isOpen,
  onClose,
  estudio,
  formatearFecha,
  buildApiUrl,
  onSubirResultado
}) => {
  if (!isOpen || !estudio) return null;

  return (
    <div className="modal-overlay-estudio">
      <div className="modal-content-estudio">
        <div className="modal-header-estudio">
          <h2>👁️ Detalles del Estudio</h2>
          <button onClick={onClose} className="close-btn-estudio">✕</button>
        </div>

        <div className="modal-body-estudio">
          <div className="detalle-estudio">
            <div className="info-estudio">
              <h3>🔬 {estudio.tipo_estudio}</h3>
              <p><strong>Estado:</strong> 
                <span className={`estado-badge estado-${estudio.estado?.toLowerCase() || 'pendiente'}`}>
                  {estudio.estado || 'Pendiente'}
                </span>
              </p>
            </div>

            <div className="detalles-grid">
              <div className="detalle-item">
                <strong>📅 Fecha Solicitud:</strong>
                <span>{formatearFecha(estudio.fecha_solicitud)}</span>
              </div>

              {estudio.fecha_realizacion && (
                <div className="detalle-item">
                  <strong>✅ Fecha Realización:</strong>
                  <span>{formatearFecha(estudio.fecha_realizacion)}</span>
                </div>
              )}

              <div className="detalle-item">
                <strong>⚡ Urgencia:</strong>
                <span className={`urgencia urgencia-${estudio.urgencia || 'normal'}`}>
                  {estudio.urgencia === 'alta' ? '🔴 Alta' : 
                   estudio.urgencia === 'media' ? '🟡 Media' : '🟢 Normal'}
                </span>
              </div>

              {estudio.laboratorio_recomendado && (
                <div className="detalle-item">
                  <strong>🏥 Laboratorio:</strong>
                  <span>{estudio.laboratorio_recomendado}</span>
                </div>
              )}

              {estudio.ayunas_requerido && (
                <div className="detalle-item">
                  <strong>🍽️ Ayunas:</strong>
                  <span>✅ Requerido</span>
                </div>
              )}

              {estudio.descripcion && (
                <div className="detalle-item-full">
                  <strong>📝 Descripción:</strong>
                  <p>{estudio.descripcion}</p>
                </div>
              )}

              {estudio.preparacion_especial && (
                <div className="detalle-item-full">
                  <strong>🔧 Preparación Especial:</strong>
                  <p>{estudio.preparacion_especial}</p>
                </div>
              )}

              {estudio.notas_medicas && (
                <div className="detalle-item-full">
                  <strong>📋 Notas Médicas:</strong>
                  <p>{estudio.notas_medicas}</p>
                </div>
              )}

              {estudio.archivo_resultado && (
                <div className="detalle-item-full">
                  <strong>📄 Resultado:</strong>
                  <a 
                    href={buildApiUrl(estudio.archivo_resultado)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link-resultado"
                  >
                    📄 Descargar PDF
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="modal-actions-estudio">
            <button onClick={onClose} className="btn-cancelar-estudio">
              ✅ Cerrar
            </button>
            
            {!estudio.archivo_resultado && (
              <button
                onClick={() => {
                  onClose();
                  onSubirResultado(estudio);
                }}
                className="btn-solicitar-estudio"
              >
                📤 Subir Resultado
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

// Modal para subir resultado PDF
const ModalSubirResultado = React.memo(({
  isOpen,
  onClose,
  estudio,
  formatearFecha,
  onSubir,
  subiendoArchivo
}) => {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  const handleSubmit = async () => {
    if (!archivoSeleccionado) {
      alert('⚠️ Por favor selecciona un archivo PDF');
      return;
    }
    
    await onSubir(archivoSeleccionado);
    setArchivoSeleccionado(null);
  };

  const handleClose = () => {
    setArchivoSeleccionado(null);
    onClose();
  };

  if (!isOpen || !estudio) return null;

  return (
    <div className="modal-overlay-estudio">
      <div className="modal-content-estudio">
        <div className="modal-header-estudio">
          <h2>📤 Subir Resultado de Laboratorio</h2>
          <button onClick={handleClose} className="close-btn-estudio" disabled={subiendoArchivo}>
            ✕
          </button>
        </div>

        <div className="modal-body-estudio">
          <div className="info-estudio">
            <h3>🔬 {estudio.tipo_estudio}</h3>
            <p><strong>📅 Solicitado:</strong> {formatearFecha(estudio.fecha_solicitud)}</p>
            {estudio.descripcion && (
              <p><strong>📝 Descripción:</strong> {estudio.descripcion}</p>
            )}
          </div>

          <div className="upload-area">
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
              className="file-input-estudio"
              id="archivo-resultado"
              disabled={subiendoArchivo}
            />
            <label htmlFor="archivo-resultado" className="file-label-estudio">
              📄 Seleccionar archivo PDF
            </label>
            
            {archivoSeleccionado && (
              <div className="file-selected">
                ✅ Archivo seleccionado: {archivoSeleccionado.name}
              </div>
            )}
          </div>

          <div className="modal-actions-estudio">
            <button 
              onClick={handleClose}
              className="btn-cancelar-estudio"
              disabled={subiendoArchivo}
            >
              ❌ Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!archivoSeleccionado || subiendoArchivo}
              className={`btn-solicitar-estudio ${subiendoArchivo ? 'loading' : ''}`}
            >
              {subiendoArchivo ? (
                <>
                  <span className="spinner-btn"></span>
                  ⏳ Subiendo...
                </>
              ) : (
                '📤 Subir Resultado'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

// Componente principal
const EstudiosLaboratorioSection = ({
  estudiosLaboratorio = [],
  loadingEstudios = false,
  formatearFecha,
  buildApiUrl,
  onSolicitarNuevo,
  onRecargar,
  getAuthHeaders // ✅ Agregamos esta prop para los headers de autenticación
}) => {
  // Estados para modales
  const [modalNuevoEstudioOpen, setModalNuevoEstudioOpen] = useState(false);
  const [modalVerEstudioOpen, setModalVerEstudioOpen] = useState(false);
  const [modalSubirResultadoOpen, setModalSubirResultadoOpen] = useState(false);
  const [estudioSeleccionado, setEstudioSeleccionado] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  
  // Estados para modal de confirmación
  const [modalConfirmacionOpen, setModalConfirmacionOpen] = useState(false);
  const [datosConfirmacion, setDatosConfirmacion] = useState({});

  // Estados para el formulario de nuevo estudio
  const [formNuevoEstudio, setFormNuevoEstudio] = useState({
    tipo_estudio: '',
    descripcion: '',
    urgencia: 'normal',
    laboratorio_recomendado: '',
    notas_medicas: '',
    ayunas_requerido: false,
    preparacion_especial: ''
  });

  const handleFormChange = useCallback((field, value) => {
    setFormNuevoEstudio(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSolicitarNuevo = async () => {
    try {
      console.log('🚀 Iniciando solicitud de estudio...');
      console.log('📋 Form data:', formNuevoEstudio);
      
      setSubmitLoading(true);
      
      // Validación básica
      if (!formNuevoEstudio.tipo_estudio?.trim()) {
        alert('⚠️ Por favor selecciona un tipo de estudio');
        return;
      }

      console.log('✅ Validación pasada, llamando a onSolicitarNuevo...');
      
      const resultado = await onSolicitarNuevo(formNuevoEstudio);
      
      console.log('📡 Resultado de onSolicitarNuevo:', resultado);
      
      if (resultado !== false) {
        console.log('✅ Estudio solicitado exitosamente');
        
        // Cerrar modal del formulario
        setModalNuevoEstudioOpen(false);
        
        // Preparar datos para el modal de confirmación
        setDatosConfirmacion({
          tipo_estudio: formNuevoEstudio.tipo_estudio,
          laboratorio: formNuevoEstudio.laboratorio_recomendado || 'No especificado',
          urgencia: formNuevoEstudio.urgencia,
          fecha: new Date().toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        });
        
        // Mostrar modal de confirmación en la esquina superior derecha
        setModalConfirmacionOpen(true);
        
        // Limpiar formulario
        setFormNuevoEstudio({
          tipo_estudio: '',
          descripcion: '',
          urgencia: 'normal',
          laboratorio_recomendado: '',
          notas_medicas: '',
          ayunas_requerido: false,
          preparacion_especial: ''
        });
        
        // Recargar la lista si hay función de recarga
        if (onRecargar) {
          console.log('🔄 Recargando lista de estudios...');
          await onRecargar();
        }
      } else {
        console.error('❌ Error: onSolicitarNuevo retornó false');
      }
    } catch (error) {
      console.error('❌ Error en handleSolicitarNuevo:', error);
      alert('❌ Error al solicitar estudio: ' + error.message);
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleSubirResultado = async (archivo) => {
    try {
      setSubiendoArchivo(true);
      
      console.log('📤 Subiendo archivo:', archivo.name, 'para estudio:', estudioSeleccionado.id);
      
      // Crear FormData para subir el archivo
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('estudio_id', estudioSeleccionado.id);
      formData.append('fecha_realizacion', new Date().toISOString().split('T')[0]);

      // Subir archivo al backend
      const response = await fetch(buildApiUrl(`/estudios-laboratorio/${estudioSeleccionado.id}/resultado`), {
        method: 'POST',
        headers: getAuthHeaders ? {
          'Authorization': getAuthHeaders().Authorization
        } : {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Error al subir archivo');
      }

      const resultado = await response.json();
      console.log('✅ Archivo subido:', resultado);
      
      // Cerrar modal de subir resultado
      setModalSubirResultadoOpen(false);
      
      // Preparar datos para el modal de confirmación
      setDatosConfirmacion({
        tipo_estudio: estudioSeleccionado.tipo_estudio,
        archivo: archivo.name,
        fecha: new Date().toLocaleDateString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        accion: 'subida' // Para diferenciar del modal de solicitud
      });
      
      // Mostrar modal de confirmación en esquina superior derecha
      setModalConfirmacionOpen(true);
      
      // Recargar la lista
      if (onRecargar) {
        await onRecargar();
      }
      
    } catch (error) {
      console.error('❌ Error al subir archivo:', error);
      
      // Preparar datos para modal de error
      setDatosConfirmacion({
        tipo_estudio: estudioSeleccionado.tipo_estudio,
        error: error.message,
        accion: 'error'
      });
      
      // Mostrar modal de error
      setModalConfirmacionOpen(true);
    } finally {
      setSubiendoArchivo(false);
    }
  };

  const abrirModalSubirResultado = (estudio) => {
    setEstudioSeleccionado(estudio);
    setModalSubirResultadoOpen(true);
  };

  const abrirModalVerEstudio = (estudio) => {
    setEstudioSeleccionado(estudio);
    setModalVerEstudioOpen(true);
  };

  // Render del estado de carga
  if (loadingEstudios) {
    return (
      <div className="loading-section-estudios">
        <div className="spinner-estudios"></div>
        <p>Cargando estudios de laboratorio...</p>
      </div>
    );
  }

  // Render cuando no hay estudios
  if (estudiosLaboratorio.length === 0) {
    return (
      <div className="seccion-vacia-estudios">
        <div className="icono-vacio-estudios">🔬</div>
        <h3>Sin Estudios de Laboratorio</h3>
        <p>Este paciente no tiene estudios de laboratorio registrados. Puedes solicitar el primer estudio haciendo clic en el botón de abajo.</p>
        
        <button 
          onClick={() => setModalNuevoEstudioOpen(true)}
          className="btn-primera-accion-estudios"
        >
          🔬 Solicitar Primer Estudio
        </button>

        {/* Modal para nuevo estudio */}
        <ModalNuevoEstudio
          isOpen={modalNuevoEstudioOpen}
          onClose={() => setModalNuevoEstudioOpen(false)}
          formData={formNuevoEstudio}
          onFormChange={handleFormChange}
          onSubmit={handleSolicitarNuevo}
          submitLoading={submitLoading}
        />
      </div>
    );
  }

  // Render principal con estudios
  return (
    <div className="seccion-completa-estudios">
      <div className="seccion-header-estudios">
        <h2>🔬 Estudios de Laboratorio ({estudiosLaboratorio.length})</h2>
        <div className="header-actions-estudios">
          <button 
            onClick={() => onRecargar && onRecargar()}
            className="btn-recargar-estudios"
            disabled={loadingEstudios}
            title="Recargar estudios"
          >
            🔄 Recargar
          </button>
          <button 
            onClick={() => setModalNuevoEstudioOpen(true)}
            className="btn-accion-estudios"
          >
            ➕ Solicitar Nuevo Estudio
          </button>
        </div>
      </div>

      <div className="estudios-grid">
        {estudiosLaboratorio.map((estudio) => (
          <div key={estudio.id} className="estudio-card">
            <div className="estudio-header">
              <h4>{estudio.tipo_estudio || 'Estudio General'}</h4>
              <span className={`estado-badge estado-${estudio.estado?.toLowerCase() || 'pendiente'}`}>
                {estudio.estado || 'Pendiente'}
              </span>
            </div>

            <div className="estudio-info">
              <div className="info-item">
                <strong>📅 Fecha Solicitud:</strong>
                <span>{formatearFecha(estudio.fecha_solicitud)}</span>
              </div>

              {estudio.laboratorio_recomendado && (
                <div className="info-item">
                  <strong>🏥 Laboratorio:</strong>
                  <span>{estudio.laboratorio_recomendado}</span>
                </div>
              )}

              <div className="info-item">
                <strong>⚡ Urgencia:</strong>
                <span className={`urgencia urgencia-${estudio.urgencia || 'normal'}`}>
                  {estudio.urgencia === 'alta' ? '🔴 Alta' : 
                   estudio.urgencia === 'media' ? '🟡 Media' : '🟢 Normal'}
                </span>
              </div>

              {estudio.ayunas_requerido && (
                <div className="info-item">
                  <strong>🍽️ Ayunas:</strong>
                  <span>✅ Requerido</span>
                </div>
              )}

              {estudio.descripcion && (
                <div className="info-item">
                  <strong>📝 Descripción:</strong>
                  <p>{estudio.descripcion}</p>
                </div>
              )}

              {estudio.fecha_realizacion && (
                <div className="info-item">
                  <strong>✅ Fecha Realización:</strong>
                  <span>{formatearFecha(estudio.fecha_realizacion)}</span>
                </div>
              )}

              {estudio.archivo_resultado && (
                <div className="info-item">
                  <strong>📄 Resultado:</strong>
                  <a 
                    href={buildApiUrl(estudio.archivo_resultado)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="link-resultado"
                  >
                    📄 Ver PDF
                  </a>
                </div>
              )}
            </div>

            <div className="estudio-acciones">
              <button
                onClick={() => abrirModalVerEstudio(estudio)}
                className="btn-secundario-estudios"
              >
                👁️ Ver Detalles
              </button>
              
              {!estudio.archivo_resultado && (
                <button
                  onClick={() => abrirModalSubirResultado(estudio)}
                  className="btn-primario-estudios"
                >
                  📤 Subir Resultado
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODALES */}
      <ModalNuevoEstudio
        isOpen={modalNuevoEstudioOpen}
        onClose={() => setModalNuevoEstudioOpen(false)}
        formData={formNuevoEstudio}
        onFormChange={handleFormChange}
        onSubmit={handleSolicitarNuevo}
        submitLoading={submitLoading}
      />

      <ModalVerEstudio
        isOpen={modalVerEstudioOpen}
        onClose={() => setModalVerEstudioOpen(false)}
        estudio={estudioSeleccionado}
        formatearFecha={formatearFecha}
        buildApiUrl={buildApiUrl}
        onSubirResultado={abrirModalSubirResultado}
      />

      <ModalSubirResultado
        isOpen={modalSubirResultadoOpen}
        onClose={() => setModalSubirResultadoOpen(false)}
        estudio={estudioSeleccionado}
        formatearFecha={formatearFecha}
        onSubir={handleSubirResultado}
        subiendoArchivo={subiendoArchivo}
      />

      {/* Modal de confirmación en esquina superior derecha */}
      <ConfirmModal
        isOpen={modalConfirmacionOpen}
        onClose={() => setModalConfirmacionOpen(false)}
        onConfirm={() => setModalConfirmacionOpen(false)}
        title={
          datosConfirmacion.accion === 'subida' 
            ? '¡Resultado Subido Exitosamente!' 
            : datosConfirmacion.accion === 'error'
            ? '❌ Error al Subir Archivo'
            : '¡Estudio Solicitado Exitosamente!'
        }
        message={
          datosConfirmacion.accion === 'subida'
            ? `El archivo "${datosConfirmacion.archivo}" se ha subido correctamente para el estudio "${datosConfirmacion.tipo_estudio}".`
            : datosConfirmacion.accion === 'error'
            ? `No se pudo subir el archivo para "${datosConfirmacion.tipo_estudio}": ${datosConfirmacion.error}`
            : `El estudio "${datosConfirmacion.tipo_estudio}" ha sido registrado correctamente en el sistema.`
        }
        confirmText="Entendido"
        icon={
          datosConfirmacion.accion === 'error' ? '❌' : '✅'
        }
        type={
          datosConfirmacion.accion === 'error' ? 'danger' : 'success'
        }
        position="top-right"
        showIcon={true}
      />
    </div>
  );
};

ModalNuevoEstudio.displayName = 'ModalNuevoEstudio';
ModalVerEstudio.displayName = 'ModalVerEstudio';
ModalSubirResultado.displayName = 'ModalSubirResultado';

export default EstudiosLaboratorioSection;