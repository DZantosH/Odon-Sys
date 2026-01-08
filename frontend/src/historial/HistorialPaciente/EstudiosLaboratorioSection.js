import React, { useState, useCallback, useEffect } from 'react';
import { EstudioDetallesModal, SubirResultadoModal, SuccessNotificationModal, ConfirmModal } from '../../components/modals/ModalSystem';
import '../../css/EstudiosLaboratorioSection.css';

// ===== FORMULARIO INLINE =====
const FormularioInlineEstudio = ({ 
  formData, 
  onFormChange, 
  onSubmit, 
  onCancel, 
  submitLoading,
  setSubmitLoading
}) => {
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Formulario enviado inline');
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

  return (
    <div className="formulario-inline-estudio">
      <div className="formulario-header">
        <h3>🔬 Solicitar Nuevo Estudio de Laboratorio</h3>
        <p>Completa la información para solicitar un estudio médico</p>
      </div>

      <form onSubmit={handleSubmit} className="form-inline">
        <div className="form-grid-inline">
          
          {/* FILA 1: Tipo y Urgencia */}
          <div className="form-row">
            <div className="form-group-inline">
              <label htmlFor="tipo-estudio">🔬 Tipo de Estudio *</label>
              <select
                id="tipo-estudio"
                value={formData.tipo_estudio}
                onChange={(e) => handleInputChange('tipo_estudio', e.target.value)}
                required
                disabled={submitLoading}
                className="input-principal"
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

            <div className="form-group-inline">
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
          </div>

          {/* FILA 2: Laboratorio y Ayunas */}
          <div className="form-row">
            <div className="form-group-inline">
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

            <div className="form-group-inline checkbox-container">
              <label htmlFor="ayunas" className="checkbox-label-inline">
                <input
                  type="checkbox"
                  id="ayunas"
                  checked={formData.ayunas_requerido}
                  onChange={(e) => handleInputChange('ayunas_requerido', e.target.checked)}
                  disabled={submitLoading}
                />
                <span className="checkmark-inline"></span>
                🍽️ Requiere Ayunas
              </label>
            </div>
          </div>

          {/* FILA 3: Descripción */}
          <div className="form-row">
            <div className="form-group-inline form-group-full">
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
          </div>

          {/* FILA 4: Preparación y Notas */}
          <div className="form-row">
            <div className="form-group-inline">
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

            <div className="form-group-inline">
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

        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="form-actions-inline">
          <button 
            type="button" 
            onClick={onCancel}
            className="btn-cancelar-inline"
            disabled={submitLoading}
          >
            ❌ Cancelar
          </button>
          <button 
            type="submit" 
            className={`btn-solicitar-inline ${submitLoading ? 'loading' : ''}`}
            disabled={submitLoading}
          >
            {submitLoading ? (
              <>
                <span className="spinner-btn-inline"></span>
                ⏳ Solicitando...
              </>
            ) : (
              '✅ Solicitar Estudio'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// ===== TARJETA COMPACTA DE ESTUDIO =====
const TarjetaEstudioCompacta = ({ 
  estudio, 
  formatearFecha, 
  buildApiUrl, 
  onVerDetalles, 
  onSubirResultado,
  getAuthHeaders  // ✅ AGREGADO: Recibir getAuthHeaders
}) => {
  // ✅ AGREGADO: Función para abrir archivos protegidos
  const abrirArchivoProtegido = async (archivoUrl) => {
    try {
      console.log('🔒 Abriendo archivo protegido:', archivoUrl);
      
      // Construir URL de la API protegida
      const apiUrl = buildApiUrl(archivoUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: getAuthHeaders ? {
          'Authorization': getAuthHeaders().Authorization
        } : {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      // Obtener el blob del archivo
      const blob = await response.blob();
      
      // Crear URL temporal para el blob
      const blobUrl = window.URL.createObjectURL(blob);
      
      // Abrir en nueva ventana
      const newWindow = window.open(blobUrl, '_blank');
      
      // Limpiar el blob URL después de un tiempo para liberar memoria
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
      }, 10000); // 10 segundos
      
      if (!newWindow) {
        alert('⚠️ Por favor permite ventanas emergentes para ver el archivo');
      }
      
    } catch (error) {
      console.error('❌ Error abriendo archivo:', error);
      alert(`❌ Error al abrir archivo: ${error.message}`);
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'completado':
      case 'realizado':
        return 'completado';
      case 'pendiente':
        return 'pendiente';
      case 'en-proceso':
        return 'en-proceso';
      case 'cancelado':
        return 'cancelado';
      default:
        return 'pendiente';
    }
  };

  const getUrgenciaIcon = (urgencia) => {
    switch (urgencia?.toLowerCase()) {
      case 'alta':
        return '🔴';
      case 'media':
        return '🟡';
      case 'normal':
      default:
        return '🟢';
    }
  };

  return (
    <div className="tarjeta-estudio-compacta">
      <div className="tarjeta-header-compacta">
        <div className="tarjeta-info-principal">
          <h4 className="tarjeta-titulo-compacta">
            {estudio.tipo_estudio || 'Estudio General'}
          </h4>
          <div className="tarjeta-metadata">
            <span className="urgencia-badge">
              {getUrgenciaIcon(estudio.urgencia)} {estudio.urgencia || 'Normal'}
            </span>
            <span className={`estado-badge-compacta estado-${getEstadoColor(estudio.estado)}`}>
              {estudio.estado || 'PENDIENTE'}
            </span>
          </div>
        </div>
      </div>

      <div className="tarjeta-info-secundaria">
        <div className="info-fecha-compacta">
          <span className="fecha-icon">📅</span>
          <span className="fecha-texto">
            Solicitado: {formatearFecha(estudio.fecha_solicitud)}
          </span>
        </div>
        
        {estudio.laboratorio_recomendado && (
          <div className="info-laboratorio">
            <span className="lab-icon">🏥</span>
            <span className="lab-texto">{estudio.laboratorio_recomendado}</span>
          </div>
        )}
      </div>

      <div className="tarjeta-acciones-compacta">
        <button 
          onClick={() => onVerDetalles(estudio)}
          className="btn-compacto btn-detalles-compacto"
        >
          🔍 Detalles
        </button>
        
        {/* ✅ CAMBIADO: De enlace directo a botón con función protegida */}
        {estudio.archivo_resultado ? (
          <button
            onClick={() => abrirArchivoProtegido(estudio.archivo_resultado)}
            className="btn-compacto btn-resultado-compacto"
          >
            📄 Ver Resultado
          </button>
        ) : (
          <button
            onClick={() => onSubirResultado(estudio)}
            className="btn-compacto btn-subir-compacto"
          >
            📤 Añadir Archivo
          </button>
        )}
      </div>
    </div>
  );
};

// ===== COMPONENTE PRINCIPAL =====
const EstudiosLaboratorioSection = ({
  estudiosLaboratorio = [],
  loadingEstudios = false,
  formatearFecha,
  buildApiUrl,
  onSolicitarNuevo,
  onRecargar,
  getAuthHeaders
}) => {
  // Estados principales
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [conteoEstudiosInicial, setConteoEstudiosInicial] = useState(0);
  
  // Estados para modales del sistema unificado
  const [modalVerEstudioOpen, setModalVerEstudioOpen] = useState(false);
  const [modalSubirResultadoOpen, setModalSubirResultadoOpen] = useState(false);
  const [estudioSeleccionado, setEstudioSeleccionado] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  
  // Estados para notificaciones
  const [showSuccessNotification, setShowSuccessNotification] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successTitle, setSuccessTitle] = useState('');

  // Estados para el formulario
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

  useEffect(() => {
    console.log('🔍 useEffect disparado:', {
      submitLoading,
      estudiosLength: estudiosLaboratorio.length,
      conteoEstudiosInicial,
      tipoEstudio: formNuevoEstudio.tipo_estudio
    });

    if (submitLoading && estudiosLaboratorio.length > conteoEstudiosInicial) {
      console.log('🎉 ¡Nuevo estudio detectado! Cerrando formulario automáticamente');
      console.log(`📊 Estudios: ${conteoEstudiosInicial} → ${estudiosLaboratorio.length}`);
      
      setMostrarFormulario(false);
      setSubmitLoading(false);
      
      setFormNuevoEstudio({
        tipo_estudio: '',
        descripcion: '',
        urgencia: 'normal',
        laboratorio_recomendado: '',
        notas_medicas: '',
        ayunas_requerido: false,
        preparacion_especial: ''
      });
      
      setSuccessTitle('¡Estudio Agregado Exitosamente!');
      setSuccessMessage(`Nuevo estudio agregado al historial del paciente.`);
      setShowSuccessNotification(true);
      
      setConteoEstudiosInicial(0);
    }
    // Timeout de seguridad para evitar que se quede cargando indefinidamente
    else if (submitLoading) {
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout de seguridad: deteniendo loading');
        setSubmitLoading(false);
      }, 10000); // 10 segundos timeout
      
      return () => clearTimeout(timeout);
    }
  }, [estudiosLaboratorio.length, submitLoading, conteoEstudiosInicial]);

  const handleSolicitarNuevo = async () => {
    try {
      console.log('🚀 Iniciando solicitud de estudio inline...');
      console.log('📋 Form data:', formNuevoEstudio);
      
      setConteoEstudiosInicial(estudiosLaboratorio.length);
      console.log('📊 Conteo inicial de estudios:', estudiosLaboratorio.length);
      
      setSubmitLoading(true);
      
      if (!formNuevoEstudio.tipo_estudio?.trim()) {
        alert('⚠️ Por favor selecciona un tipo de estudio');
        setSubmitLoading(false);
        return;
      }

      console.log('✅ Validación pasada, llamando a onSolicitarNuevo...');
      
      onSolicitarNuevo(formNuevoEstudio).then(() => {
        console.log('📡 onSolicitarNuevo completado');
      }).catch((error) => {
        console.error('❌ Error en onSolicitarNuevo:', error);
        setSubmitLoading(false);
        alert(`❌ Error al solicitar estudio: ${error.message}`);
      });
      
    } catch (error) {
      console.error('❌ Error en handleSolicitarNuevo:', error);
      alert(`❌ Error al solicitar estudio: ${error.message}`);
      setSubmitLoading(false);
    }
  };

  const handleCancelarFormulario = () => {
    setMostrarFormulario(false);
    setFormNuevoEstudio({
      tipo_estudio: '',
      descripcion: '',
      urgencia: 'normal',
      laboratorio_recomendado: '',
      notas_medicas: '',
      ayunas_requerido: false,
      preparacion_especial: ''
    });
  };

  const handleSubirResultado = async (estudio, archivo) => {
    try {
      setSubiendoArchivo(true);
      
      console.log('📤 Subiendo archivo:', archivo.name, 'para estudio:', estudio.id);
      
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('estudio_id', estudio.id);
      formData.append('fecha_realizacion', new Date().toISOString().split('T')[0]);

      const response = await fetch(buildApiUrl(`/estudios-laboratorio/${estudio.id}/resultado`), {
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
      
      setModalSubirResultadoOpen(false);
      
      setSuccessTitle('¡Resultado Subido Exitosamente!');
      setSuccessMessage(`El archivo "${archivo.name}" se ha subido correctamente para el estudio "${estudio.tipo_estudio}".`);
      setShowSuccessNotification(true);
      
      if (onRecargar) {
        await onRecargar();
      }
      
    } catch (error) {
      console.error('❌ Error al subir archivo:', error);
      alert(`❌ Error al subir archivo: ${error.message}`);
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

  if (loadingEstudios) {
    return (
      <div className="loading-section-estudios">
        <div className="spinner-estudios"></div>
        <p>Cargando estudios de laboratorio...</p>
      </div>
    );
  }

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
          {!mostrarFormulario && (
            <button 
              onClick={() => setMostrarFormulario(true)}
              className="btn-accion-estudios"
            >
              ➕ Solicitar Nuevo Estudio
            </button>
          )}
        </div>
      </div>

      {mostrarFormulario && (
        <FormularioInlineEstudio
          formData={formNuevoEstudio}
          onFormChange={handleFormChange}
          onSubmit={handleSolicitarNuevo}
          onCancel={handleCancelarFormulario}
          submitLoading={submitLoading}
          setSubmitLoading={setSubmitLoading}
        />
      )}

      {estudiosLaboratorio.length === 0 && !mostrarFormulario ? (
        <div className="seccion-vacia-estudios">
          <div className="icono-vacio-estudios">🔬</div>
          <h3>Sin Estudios de Laboratorio</h3>
          <p>Este paciente no tiene estudios de laboratorio registrados. Puedes solicitar el primer estudio haciendo clic en el botón de abajo.</p>
          
          <button 
            onClick={() => setMostrarFormulario(true)}
            className="btn-primera-accion-estudios"
          >
            🔬 Solicitar Primer Estudio
          </button>
        </div>
      ) : (
        !mostrarFormulario && (
          <div className="estudios-grid-compacto">
            {/* ✅ CAMBIADO: Agregar getAuthHeaders */}
            {estudiosLaboratorio.map((estudio) => (
              <TarjetaEstudioCompacta
                key={estudio.id}
                estudio={estudio}
                formatearFecha={formatearFecha}
                buildApiUrl={buildApiUrl}
                onVerDetalles={abrirModalVerEstudio}
                onSubirResultado={abrirModalSubirResultado}
                getAuthHeaders={getAuthHeaders}
              />
            ))}
          </div>
        )
      )}

      <EstudioDetallesModal
        isOpen={modalVerEstudioOpen}
        onClose={() => setModalVerEstudioOpen(false)}
        estudio={estudioSeleccionado}
        formatearFecha={formatearFecha}
        buildApiUrl={buildApiUrl}
      />

      <SubirResultadoModal
        isOpen={modalSubirResultadoOpen}
        onClose={() => setModalSubirResultadoOpen(false)}
        estudio={estudioSeleccionado}
        formatearFecha={formatearFecha}
        onSubirResultado={handleSubirResultado}
      />

      <SuccessNotificationModal
        isOpen={showSuccessNotification}
        onClose={() => setShowSuccessNotification(false)}
        title={successTitle}
        message={successMessage}
        autoClose={true}
        autoCloseDelay={4000}
        icon="✅"
      />
    </div>
  );
};

export default EstudiosLaboratorioSection;