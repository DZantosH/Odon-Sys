import React, { useState, useEffect, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const AuxiliaresDiagnostico = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  const [formData, setFormData] = useState({
    // 21. Modelos de estudio
    modelos_estudio: {
      hallazgos: ['', '', '', '', '', ''] // 6 líneas como en la imagen
    },
    
    // 22. Estudio Radiográfico
    radiografias_intraorales: [
      { region: '', hallazgos: '' },
      { region: '', hallazgos: '' },
      { region: '', hallazgos: '' },
      { region: '', hallazgos: '' }
    ],
    
    radiografias_extraorales: [
      { tipo: '', hallazgos: '' },
      { tipo: '', hallazgos: '' },
      { tipo: '', hallazgos: '' }
    ],
    
    // 23. Exámenes de laboratorio
    examenes_laboratorio: {
      biometria_hematica: '',
      quimica_sanguinea: '',
      general_orina: '',
      pruebas_sanguineas_coagulacion: '',
      cultivo_antibiograma: '',
      otros: ''
    },
    
    // VI. Diagnóstico Integro
    diagnostico_integro: ['', '', '', '', '', ''], // 6 líneas
    
    // V. Pronóstico
    pronostico: ['', '', ''], // 3 líneas
    
    // VI. Plan de tratamiento
    plan_tratamiento: ['', '', '', '', '', ''] // 6 líneas
  });

  // Usar datos externos si están disponibles
  const data = externalData || formData;

  useEffect(() => {
    if (externalData && Object.keys(externalData).length > 0) {
      // Estructura por defecto sin usar formData para evitar dependencia
      const dataWithDefaults = {
        modelos_estudio: {
          hallazgos: ['', '', '', '', '', ''],
          ...externalData.modelos_estudio
        },
        radiografias_intraorales: externalData.radiografias_intraorales || [
          { region: '', hallazgos: '' },
          { region: '', hallazgos: '' },
          { region: '', hallazgos: '' },
          { region: '', hallazgos: '' }
        ],
        radiografias_extraorales: externalData.radiografias_extraorales || [
          { tipo: '', hallazgos: '' },
          { tipo: '', hallazgos: '' },
          { tipo: '', hallazgos: '' }
        ],
        examenes_laboratorio: {
          biometria_hematica: '',
          quimica_sanguinea: '',
          general_orina: '',
          pruebas_sanguineas_coagulacion: '',
          cultivo_antibiograma: '',
          otros: '',
          ...externalData.examenes_laboratorio
        },
        diagnostico_integro: externalData.diagnostico_integro || ['', '', '', '', '', ''],
        pronostico: externalData.pronostico || ['', '', ''],
        plan_tratamiento: externalData.plan_tratamiento || ['', '', '', '', '', ''],
        ...externalData
      };
      setFormData(dataWithDefaults);
    }
  }, [externalData]);

  const handleChange = useCallback((section, field, value) => {
    const newFormData = {
      ...data,
      [section]: {
        ...(data[section] || {}),
        [field]: value
      }
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  const handleArrayChange = useCallback((section, index, value) => {
    const currentArray = data[section] || [];
    const newArray = [...currentArray];
    newArray[index] = value;
    
    const newFormData = {
      ...data,
      [section]: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  const handleObjectArrayChange = useCallback((section, index, field, value) => {
    const currentArray = data[section] || [];
    const newArray = [...currentArray];
    newArray[index] = {
      ...newArray[index],
      [field]: value
    };
    
    const newFormData = {
      ...data,
      [section]: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  // Función para agregar filas a radiografías si es necesario
  const agregarRadiografiaIntraoral = useCallback(() => {
    const currentArray = data.radiografias_intraorales || [];
    const newArray = [...currentArray, { region: '', hallazgos: '' }];
    
    const newFormData = {
      ...data,
      radiografias_intraorales: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  const agregarRadiografiaExtraoral = useCallback(() => {
    const currentArray = data.radiografias_extraorales || [];
    const newArray = [...currentArray, { tipo: '', hallazgos: '' }];
    
    const newFormData = {
      ...data,
      radiografias_extraorales: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  // Función para eliminar filas si es necesario
  const eliminarRadiografiaIntraoral = useCallback((index) => {
    const currentArray = data.radiografias_intraorales || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    
    const newFormData = {
      ...data,
      radiografias_intraorales: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  const eliminarRadiografiaExtraoral = useCallback((index) => {
    const currentArray = data.radiografias_extraorales || [];
    const newArray = currentArray.filter((_, i) => i !== index);
    
    const newFormData = {
      ...data,
      radiografias_extraorales: newArray
    };
    
    if (externalOnChange) {
      externalOnChange(newFormData);
    } else {
      setFormData(newFormData);
    }
  }, [data, externalOnChange]);

  // Función de validación básica
  const validarFormulario = useCallback(() => {
    const errores = {};
    
    // Validar que al menos un auxiliar de diagnóstico esté completado
    const tieneModelos = data.modelos_estudio?.hallazgos?.some(h => h.trim());
    const tieneRadiografias = data.radiografias_intraorales?.some(r => r.region || r.hallazgos) || 
                             data.radiografias_extraorales?.some(r => r.tipo || r.hallazgos);
    const tieneLaboratorio = Object.values(data.examenes_laboratorio || {}).some(val => val?.trim());
    
    if (!tieneModelos && !tieneRadiografias && !tieneLaboratorio) {
      errores.auxiliares = 'Debe completar al menos un tipo de auxiliar de diagnóstico';
    }
    
    // Validar diagnóstico
    const tieneDiagnostico = data.diagnostico_integro?.some(d => d.trim());
    if (!tieneDiagnostico) {
      errores.diagnostico = 'El diagnóstico integral es obligatorio';
    }
    
    return errores;
  }, [data]);

  return (
    <div className="auxiliares-diagnostico-moderno">
      
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>V. AUXILIARES DE DIAGNÓSTICO</h3>
          <p className="header-subtitle">
            Estudios complementarios para el diagnóstico integral
          </p>
        </div>
      </div>

      {/* 21. Modelos de estudio */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>21. Modelos de estudio</h4>
          <span className="card-badge modelos-badge">Análisis de modelos</span>
        </div>
        
        <div className="form-group-enhanced">
          <p className="section-description">
            (anexar análisis de modelos) Hallazgos
          </p>
          
          <div className="modelos-lineas">
            {(data.modelos_estudio?.hallazgos || ['', '', '', '', '', '']).map((linea, index) => (
              <div key={index} className="linea-item">
                <input
                  type="text"
                  className="linea-input"
                  value={linea}
                  onChange={(e) => {
                    const newHallazgos = [...(data.modelos_estudio?.hallazgos || ['', '', '', '', '', ''])];
                    newHallazgos[index] = e.target.value;
                    handleChange('modelos_estudio', 'hallazgos', newHallazgos);
                  }}
                  placeholder={`Hallazgo ${index + 1}...`}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 22. Estudio Radiográfico */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>22. Estudio Radiográfico</h4>
          <span className="card-badge radiografias-badge">Estudios de imagen</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="radiografias-section">
            <div className="radiografias-subtitle">Radiografías Intraorales</div>
            
            <table className="tabla-auxiliares">
              <thead>
                <tr>
                  <th className="col-categoria">Región</th>
                  <th className="col-hallazgos">Hallazgos</th>
                </tr>
              </thead>
              <tbody>
                {(data.radiografias_intraorales || []).map((radiografia, index) => (
                  <tr key={index}>
                    <td className="col-categoria" data-label="Región">
                      <textarea
                        className="tabla-textarea"
                        value={radiografia.region}
                        onChange={(e) => handleObjectArrayChange('radiografias_intraorales', index, 'region', e.target.value)}
                        placeholder="Ej: Periapicales sector anterior, Bitewings..."
                        style={{ minHeight: '40px' }}
                      />
                    </td>
                    <td className="col-hallazgos" data-label="Hallazgos">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <textarea
                          className="tabla-textarea"
                          value={radiografia.hallazgos}
                          onChange={(e) => handleObjectArrayChange('radiografias_intraorales', index, 'hallazgos', e.target.value)}
                          placeholder="Describir hallazgos radiográficos..."
                          style={{ flex: 1 }}
                        />
                        {(data.radiografias_intraorales || []).length > 4 && (
                          <button
                            type="button"
                            onClick={() => eliminarRadiografiaIntraoral(index)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button
              type="button"
              onClick={agregarRadiografiaIntraoral}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                marginTop: '12px'
              }}
            >
              + Agregar Radiografía Intraoral
            </button>
          </div>

          <div className="radiografias-section">
            <div className="radiografias-subtitle">Radiografías Extraorales</div>
            
            <table className="tabla-auxiliares">
              <thead>
                <tr>
                  <th className="col-tipo">Tipo de radiografía</th>
                  <th className="col-hallazgos">Hallazgos</th>
                </tr>
              </thead>
              <tbody>
                {(data.radiografias_extraorales || []).map((radiografia, index) => (
                  <tr key={index}>
                    <td className="col-tipo" data-label="Tipo de radiografía">
                      <textarea
                        className="tabla-textarea"
                        value={radiografia.tipo}
                        onChange={(e) => handleObjectArrayChange('radiografias_extraorales', index, 'tipo', e.target.value)}
                        placeholder="Ej: Panorámica, Lateral de cráneo, Posteroanterior..."
                        style={{ minHeight: '40px' }}
                      />
                    </td>
                    <td className="col-hallazgos" data-label="Hallazgos">
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                        <textarea
                          className="tabla-textarea"
                          value={radiografia.hallazgos}
                          onChange={(e) => handleObjectArrayChange('radiografias_extraorales', index, 'hallazgos', e.target.value)}
                          placeholder="Describir hallazgos radiográficos..."
                          style={{ flex: 1 }}
                        />
                        {(data.radiografias_extraorales || []).length > 3 && (
                          <button
                            type="button"
                            onClick={() => eliminarRadiografiaExtraoral(index)}
                            style={{
                              background: '#dc3545',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              padding: '4px 8px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            <button
              type="button"
              onClick={agregarRadiografiaExtraoral}
              style={{
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: '600',
                marginTop: '12px'
              }}
            >
              + Agregar Radiografía Extraoral
            </button>
          </div>
        </div>
      </div>

      {/* 23. Exámenes de laboratorio */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>23. Exámenes de laboratorio</h4>
          <span className="card-badge laboratorio-badge">Estudios complementarios</span>
        </div>
        
        <div className="form-group-enhanced">
          <table className="tabla-auxiliares">
            <thead>
              <tr>
                <th className="col-estudio">Estudio</th>
                <th className="col-hallazgos">Hallazgo</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  Biometría hemática
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.biometria_hematica || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'biometria_hematica', e.target.value)}
                    placeholder="Resultados de biometría hemática..."
                  />
                </td>
              </tr>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  Química Sanguínea
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.quimica_sanguinea || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'quimica_sanguinea', e.target.value)}
                    placeholder="Resultados de química sanguínea..."
                  />
                </td>
              </tr>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  General de orina
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.general_orina || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'general_orina', e.target.value)}
                    placeholder="Resultados de examen general de orina..."
                  />
                </td>
              </tr>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  Pruebas sanguíneas tiempo de sangrado y coagulación
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.pruebas_sanguineas_coagulacion || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'pruebas_sanguineas_coagulacion', e.target.value)}
                    placeholder="Resultados de tiempos de sangrado y coagulación..."
                  />
                </td>
              </tr>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  Cultivo y antibiograma
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.cultivo_antibiograma || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'cultivo_antibiograma', e.target.value)}
                    placeholder="Resultados de cultivo y antibiograma..."
                  />
                </td>
              </tr>
              <tr>
                <td className="col-estudio" data-label="Estudio">
                  Otros
                </td>
                <td className="col-hallazgos" data-label="Hallazgo">
                  <textarea
                    className="tabla-textarea"
                    value={data.examenes_laboratorio?.otros || ''}
                    onChange={(e) => handleChange('examenes_laboratorio', 'otros', e.target.value)}
                    placeholder="Otros exámenes de laboratorio..."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* VI. Diagnóstico Integro */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>VI. DIAGNÓSTICO INTEGRO</h4>
          <span className="card-badge diagnostico-badge">Diagnóstico final</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="area-texto-grande">
            <div className="lineas-diagnostico">
              {(data.diagnostico_integro || ['', '', '', '', '', '']).map((linea, index) => (
                <div key={index} className="linea-diagnostico">
                  <input
                    type="text"
                    value={linea}
                    onChange={(e) => handleArrayChange('diagnostico_integro', index, e.target.value)}
                    placeholder={`Diagnóstico ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* V. Pronóstico */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>V. PRONÓSTICO</h4>
          <span className="card-badge pronostico-badge">Pronóstico</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="area-texto-grande">
            <div className="lineas-diagnostico">
              {(data.pronostico || ['', '', '']).map((linea, index) => (
                <div key={index} className="linea-diagnostico">
                  <input
                    type="text"
                    value={linea}
                    onChange={(e) => handleArrayChange('pronostico', index, e.target.value)}
                    placeholder={`Pronóstico ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* VI. Plan de Tratamiento */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>VI. PLAN DE TRATAMIENTO</h4>
          <span className="card-badge plan-badge">Plan terapéutico</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="area-texto-grande">
            <div className="lineas-diagnostico">
              {(data.plan_tratamiento || ['', '', '', '', '', '']).map((linea, index) => (
                <div key={index} className="linea-diagnostico">
                  <input
                    type="text"
                    value={linea}
                    onChange={(e) => handleArrayChange('plan_tratamiento', index, e.target.value)}
                    placeholder={`Plan de tratamiento ${index + 1}...`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h6>Información importante</h6>
          <p>
            Los auxiliares de diagnóstico son fundamentales para establecer un diagnóstico 
            preciso y completo. Registre todos los hallazgos de estudios complementarios, 
            radiografías y exámenes de laboratorio que contribuyan al diagnóstico integral 
            y pronóstico del paciente.
          </p>
        </div>
      </div>

    </div>
  );
};

export default AuxiliaresDiagnostico;