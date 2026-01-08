import React, { useState } from 'react';
import { X, Upload, Calendar, FileText, Building2, User, AlertCircle, CheckCircle } from 'lucide-react';

const MedicalModalsComplete = () => {
  // Estados para modales
  const [modalEstudioAbierto, setModalEstudioAbierto] = useState(false);
  const [modalRadiografiaAbierto, setModalRadiografiaAbierto] = useState(false);
  
  // Estados para formularios
  const [nuevoEstudio, setNuevoEstudio] = useState({
    tipo_estudio: '',
    laboratorio: '',
    descripcion: '',
    urgente: false,
    observaciones: ''
  });

  const [nuevaRadiografia, setNuevaRadiografia] = useState({
    tipo_radiografia: '',
    descripcion: '',
    archivo: null,
    resultados: ''
  });

  // Estados de loading
  const [enviandoEstudio, setEnviandoEstudio] = useState(false);
  const [enviandoRadiografia, setEnviandoRadiografia] = useState(false);

  // Datos de ejemplo para selects
  const tiposEstudio = [
    'Biometría Hemática',
    'Química Sanguínea',
    'Examen General de Orina',
    'Perfil Lipídico',
    'Glucosa en Sangre',
    'Hemoglobina Glucosilada',
    'Función Renal',
    'Función Hepática',
    'Perfil Tiroideo',
    'Electrolitos Séricos',
    'Coagulación',
    'Marcadores Tumorales',
    'Cultivo de Orina',
    'Coprocultivo',
    'VDRL',
    'VIH',
    'Hepatitis B y C'
  ];

  const laboratorios = [
    'Lab Central CDMX',
    'Laboratorios Chopo',
    'Salud Digna',
    'Laboratorio San José',
    'Lab Azteca',
    'Laboratorio Clínico del Norte',
    'Otro'
  ];

  const tiposRadiografia = [
    'Panorámica',
    'Periapical',
    'Bite-wing',
    'Lateral',
    'Oclusal'
  ];

  // Funciones principales
  const solicitarEstudioLaboratorio = () => {
    setModalEstudioAbierto(true);
  };

  const subirRadiografia = () => {
    setModalRadiografiaAbierto(true);
  };

  // Función para cerrar modales y resetear formularios
  const cerrarModalEstudio = () => {
    setModalEstudioAbierto(false);
    setNuevoEstudio({
      tipo_estudio: '',
      laboratorio: '',
      descripcion: '',
      urgente: false,
      observaciones: ''
    });
  };

  const cerrarModalRadiografia = () => {
    setModalRadiografiaAbierto(false);
    setNuevaRadiografia({
      tipo_radiografia: '',
      descripcion: '',
      archivo: null,
      resultados: ''
    });
  };

  // Función para manejar envío de estudio
  const enviarSolicitudEstudio = async () => {
    if (!nuevoEstudio.tipo_estudio || !nuevoEstudio.laboratorio) {
      alert('❌ Por favor complete los campos obligatorios');
      return;
    }

    setEnviandoEstudio(true);

    try {
      // Simulación de datos que se enviarían al backend
      const datosEstudio = {
        paciente_id: 5, // Simulated pacienteId
        doctor_id: 8, // Simulated current user
        tipo_estudio: nuevoEstudio.tipo_estudio,
        descripcion: nuevoEstudio.descripcion,
        laboratorio: nuevoEstudio.laboratorio,
        fecha_solicitud: new Date().toISOString().split('T')[0],
        estado: nuevoEstudio.urgente ? 'urgente' : 'solicitado',
        urgente: nuevoEstudio.urgente,
        observaciones: nuevoEstudio.observaciones
      };

      console.log('📤 Enviando solicitud de estudio:', datosEstudio);

      // Aquí harías la llamada real al API:
      /*
      const response = await fetch('/api/estudios-laboratorio', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(datosEstudio)
      });

      if (!response.ok) throw new Error('Error al solicitar estudio');
      
      const resultado = await response.json();
      */

      // Simulación de éxito
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('✅ Estudio de laboratorio solicitado exitosamente');
      cerrarModalEstudio();
      
      // Aquí recargarías los estudios:
      // await cargarEstudiosLaboratorio();
      
    } catch (error) {
      console.error('❌ Error al solicitar estudio:', error);
      alert('❌ Error al solicitar estudio: ' + error.message);
    } finally {
      setEnviandoEstudio(false);
    }
  };

  // Función para manejar envío de radiografía
  const enviarRadiografia = async () => {
    if (!nuevaRadiografia.tipo_radiografia || !nuevaRadiografia.archivo) {
      alert('❌ Por favor complete los campos obligatorios y seleccione un archivo');
      return;
    }

    setEnviandoRadiografia(true);

    try {
      // Simulación de FormData que se enviaría al backend
      const formData = new FormData();
      formData.append('paciente_id', '5'); // Simulated pacienteId
      formData.append('doctor_id', '8'); // Simulated current user
      formData.append('tipo_radiografia', nuevaRadiografia.tipo_radiografia);
      formData.append('descripcion', nuevaRadiografia.descripcion);
      formData.append('resultados', nuevaRadiografia.resultados);
      formData.append('archivo', nuevaRadiografia.archivo);
      formData.append('fecha_estudio', new Date().toISOString().split('T')[0]);

      console.log('📤 Enviando radiografía:', {
        tipo: nuevaRadiografia.tipo_radiografia,
        archivo: nuevaRadiografia.archivo.name,
        tamaño: nuevaRadiografia.archivo.size
      });

      // Aquí harías la llamada real al API:
      /*
      const response = await fetch('/api/radiografias', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Error al subir radiografía');
      
      const resultado = await response.json();
      */

      // Simulación de éxito
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      alert('✅ Radiografía subida exitosamente');
      cerrarModalRadiografia();
      
      // Aquí recargarías las radiografías:
      // await cargarRadiografias();
      
    } catch (error) {
      console.error('❌ Error al subir radiografía:', error);
      alert('❌ Error al subir radiografía: ' + error.message);
    } finally {
      setEnviandoRadiografia(false);
    }
  };

  // Función para manejar selección de archivo
  const manejarSeleccionArchivo = (e) => {
    const archivo = e.target.files[0];
    
    if (archivo) {
      // Validar tipo de archivo
      const tiposPermitidos = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!tiposPermitidos.includes(archivo.type)) {
        alert('❌ Solo se permiten archivos JPG, PNG o PDF');
        return;
      }
      
      // Validar tamaño (máximo 10MB)
      if (archivo.size > 10 * 1024 * 1024) {
        alert('❌ El archivo no puede ser mayor a 10MB');
        return;
      }
      
      setNuevaRadiografia(prev => ({
        ...prev,
        archivo: archivo
      }));
    }
  };

  return (
    <div className="medical-system-demo">
      {/* Botones para activar modales */}
      <div className="demo-buttons">
        <h2>🔬 Sistema Médico - Modales Funcionales</h2>
        <div className="buttons-container">
          <button 
            className="btn-demo btn-estudio"
            onClick={solicitarEstudioLaboratorio}
          >
            🔬 Solicitar Estudio de Laboratorio
          </button>
          <button 
            className="btn-demo btn-radiografia"
            onClick={subirRadiografia}
          >
            📸 Subir Radiografía
          </button>
        </div>
      </div>

      {/* Modal para Solicitar Estudio de Laboratorio */}
      {modalEstudioAbierto && (
        <div className="modal-overlay">
          <div className="modal-container modal-estudio">
            <div className="modal-header">
              <h3>🔬 Solicitar Estudio de Laboratorio</h3>
              <button 
                className="btn-cerrar"
                onClick={cerrarModalEstudio}
                disabled={enviandoEstudio}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-grid">
                {/* Tipo de Estudio */}
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Tipo de Estudio *
                  </label>
                  <select
                    value={nuevoEstudio.tipo_estudio}
                    onChange={(e) => setNuevoEstudio(prev => ({
                      ...prev,
                      tipo_estudio: e.target.value
                    }))}
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar estudio...</option>
                    {tiposEstudio.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                {/* Laboratorio */}
                <div className="form-group">
                  <label className="form-label">
                    <Building2 size={16} />
                    Laboratorio *
                  </label>
                  <select
                    value={nuevoEstudio.laboratorio}
                    onChange={(e) => setNuevoEstudio(prev => ({
                      ...prev,
                      laboratorio: e.target.value
                    }))}
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar laboratorio...</option>
                    {laboratorios.map(lab => (
                      <option key={lab} value={lab}>{lab}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <FileText size={16} />
                    Descripción
                  </label>
                  <textarea
                    value={nuevoEstudio.descripcion}
                    onChange={(e) => setNuevoEstudio(prev => ({
                      ...prev,
                      descripcion: e.target.value
                    }))}
                    className="form-textarea"
                    placeholder="Motivo del estudio, síntomas relevantes..."
                    rows={3}
                  />
                </div>

                {/* Observaciones */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <FileText size={16} />
                    Observaciones Adicionales
                  </label>
                  <textarea
                    value={nuevoEstudio.observaciones}
                    onChange={(e) => setNuevoEstudio(prev => ({
                      ...prev,
                      observaciones: e.target.value
                    }))}
                    className="form-textarea"
                    placeholder="Instrucciones especiales, medicamentos a suspender..."
                    rows={2}
                  />
                </div>

                {/* Urgente */}
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={nuevoEstudio.urgente}
                      onChange={(e) => setNuevoEstudio(prev => ({
                        ...prev,
                        urgente: e.target.checked
                      }))}
                      className="form-checkbox"
                    />
                    <span className="checkmark"></span>
                    <AlertCircle size={16} className="urgente-icon" />
                    Marcar como URGENTE
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={cerrarModalEstudio}
                  className="btn-cancelar"
                  disabled={enviandoEstudio}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviarSolicitudEstudio}
                  className="btn-confirmar"
                  disabled={enviandoEstudio}
                >
                  {enviandoEstudio ? (
                    <>
                      <div className="spinner-small"></div>
                      Solicitando...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      Solicitar Estudio
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Subir Radiografía */}
      {modalRadiografiaAbierto && (
        <div className="modal-overlay">
          <div className="modal-container modal-radiografia">
            <div className="modal-header">
              <h3>📸 Subir Radiografía</h3>
              <button 
                className="btn-cerrar"
                onClick={cerrarModalRadiografia}
                disabled={enviandoRadiografia}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-form">
              <div className="form-grid">
                {/* Tipo de Radiografía */}
                <div className="form-group">
                  <label className="form-label">
                    <FileText size={16} />
                    Tipo de Radiografía *
                  </label>
                  <select
                    value={nuevaRadiografia.tipo_radiografia}
                    onChange={(e) => setNuevaRadiografia(prev => ({
                      ...prev,
                      tipo_radiografia: e.target.value
                    }))}
                    className="form-select"
                    required
                  >
                    <option value="">Seleccionar tipo...</option>
                    {tiposRadiografia.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                </div>

                {/* Archivo */}
                <div className="form-group">
                  <label className="form-label">
                    <Upload size={16} />
                    Archivo de Radiografía *
                  </label>
                  <div className="file-input-container">
                    <input
                      type="file"
                      onChange={manejarSeleccionArchivo}
                      className="file-input"
                      accept="image/*,.pdf"
                      required
                    />
                    <div className="file-input-display">
                      {nuevaRadiografia.archivo ? (
                        <span className="file-selected">
                          📄 {nuevaRadiografia.archivo.name}
                          <small>({(nuevaRadiografia.archivo.size / 1024 / 1024).toFixed(2)} MB)</small>
                        </span>
                      ) : (
                        <span className="file-placeholder">
                          Seleccionar archivo... (JPG, PNG, PDF - Máx. 10MB)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Descripción */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <FileText size={16} />
                    Descripción
                  </label>
                  <textarea
                    value={nuevaRadiografia.descripcion}
                    onChange={(e) => setNuevaRadiografia(prev => ({
                      ...prev,
                      descripcion: e.target.value
                    }))}
                    className="form-textarea"
                    placeholder="Motivo del estudio, área específica..."
                    rows={3}
                  />
                </div>

                {/* Resultados/Observaciones */}
                <div className="form-group full-width">
                  <label className="form-label">
                    <FileText size={16} />
                    Resultados/Observaciones
                  </label>
                  <textarea
                    value={nuevaRadiografia.resultados}
                    onChange={(e) => setNuevaRadiografia(prev => ({
                      ...prev,
                      resultados: e.target.value
                    }))}
                    className="form-textarea"
                    placeholder="Hallazgos radiográficos, interpretación..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={cerrarModalRadiografia}
                  className="btn-cancelar"
                  disabled={enviandoRadiografia}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={enviarRadiografia}
                  className="btn-confirmar"
                  disabled={enviandoRadiografia}
                >
                  {enviandoRadiografia ? (
                    <>
                      <div className="spinner-small"></div>
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Subir Radiografía
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
);
};
      export default MedicalModalsComplete;