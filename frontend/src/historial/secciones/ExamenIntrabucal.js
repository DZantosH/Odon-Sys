import React, { useState, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const ExamenIntrabucal = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  // Estado local por defecto
  const [localData, setLocalData] = useState({
    estructuras: {
      labios: '',
      carrillos: '',
      musculos_pterigoideo_interno: '',
      musculos_pterigoideo_externo: '',
      frenillos: '',
      vestibulos: '',
      fondo_surco: '',
      lengua: '',
      piso_boca: '',
      paladar_duro: '',
      paladar_blando: '',
      uvula: '',
      pilares: '',
      amigdalas: '',
      orofaringe: ''
    },
    higiene_bucal: {
      general: '',
      indice_placa: '',
      calculo: '',
      halitosis: ''
    },
    encias: {
      color: '',
      textura: '',
      forma: '',
      consistencia: '',
      sangrado: '',
      alteraciones: []
    },
    hallazgos_adicionales: ''
  });

  // Usar datos externos si están disponibles
  const data = externalData || localData;

  // Función de cambio adaptada
  const handleChange = useCallback((field, value) => {
    if (externalOnChange) {
      externalOnChange(field, value);
    } else {
      setLocalData(prev => ({
        ...prev,
        [field]: value
      }));
      console.log('Campo actualizado:', field, value);
    }
  }, [externalOnChange]);

  // Función para manejar cambios anidados
  const handleNestedChange = useCallback((section, field, value) => {
    const newData = {
      ...data[section],
      [field]: value
    };
    handleChange(section, newData);
  }, [data, handleChange]);

  // Estructuras intrabucales
  const estructurasIntrabucales = [
    { key: 'labios', label: 'Labios', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'carrillos', label: 'Carrillos', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'musculos_pterigoideo_interno', label: 'Músculos pterigoideo interno', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'musculos_pterigoideo_externo', label: 'Músculos pterigoideo externo', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'frenillos', label: 'Frenillos', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'vestibulos', label: 'Vestíbulos', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'fondo_surco', label: 'Fondo de surco', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'lengua', label: 'Lengua', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'piso_boca', label: 'Piso de boca', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'paladar_duro', label: 'Paladar duro', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'paladar_blando', label: 'Paladar blando', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'uvula', label: 'Úvula', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'pilares', label: 'Pilares', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'amigdalas', label: 'Amígdalas', placeholder: 'Describir alteraciones o "Normal"' },
    { key: 'orofaringe', label: 'Orofaringe', placeholder: 'Describir alteraciones o "Normal"' }
  ];

  // Opciones para encías
  const opcionesEncias = {
    color: ['Rosa coral', 'Rojo', 'Azulado', 'Pálido', 'Pigmentado'],
    textura: ['Lisa', 'Rugosa', 'Granular', 'Punteado'],
    forma: ['Festoneada', 'Rectangular', 'Triangular', 'Irregular'],
    consistencia: ['Firme', 'Blanda', 'Edematosa', 'Fibrosa'],
    sangrado: ['Ausente', 'Espontáneo', 'Al sondaje', 'Al cepillado']
  };

  // Función para agregar alteración gingival
  const agregarAlteracion = () => {
    const nuevasAlteraciones = [...(data.encias?.alteraciones || []), {
      localizacion: '',
      descripcion: '',
      tamaño: '',
      color: '',
      consistencia: ''
    }];
    handleNestedChange('encias', 'alteraciones', nuevasAlteraciones);
  };

  // Función para eliminar alteración
  const eliminarAlteracion = (index) => {
    const nuevasAlteraciones = (data.encias?.alteraciones || []).filter((_, i) => i !== index);
    handleNestedChange('encias', 'alteraciones', nuevasAlteraciones);
  };

  // Función para actualizar alteración
  const actualizarAlteracion = (index, campo, valor) => {
    const nuevasAlteraciones = [...(data.encias?.alteraciones || [])];
    nuevasAlteraciones[index] = { ...nuevasAlteraciones[index], [campo]: valor };
    handleNestedChange('encias', 'alteraciones', nuevasAlteraciones);
  };

  return (
    <div className="examen-intrabucal-container">
      
      {/* Header de la sección */}
      <div className="intrabucal-header">
        <h3>IV. EXAMEN INTRABUCAL</h3>
        <p className="header-subtitle">
          Evaluación sistemática de estructuras intrabucales básicas
        </p>
      </div>

      {/* 1. Estructuras Intrabucales */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">Estructuras Intrabucales</h4>
          <span className="intrabucal-badge evaluacion">EVALUACIÓN</span>
        </div>
        
        <div className="intrabucal-form-group">
          <p className="intrabucal-section-description">
            Describe las alteraciones que se presentan en cada estructura
          </p>
          
          <div className="intrabucal-grid-2">
            {estructurasIntrabucales.map(estructura => (
              <div key={estructura.key} className="intrabucal-field">
                <label className="intrabucal-label">{estructura.label}</label>
                <textarea
                  className="intrabucal-textarea"
                  value={data.estructuras?.[estructura.key] || ''}
                  onChange={(e) => handleNestedChange('estructuras', estructura.key, e.target.value)}
                  placeholder={estructura.placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Higiene Bucal */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">Higiene Bucal</h4>
          <span className="intrabucal-badge higiene">HIGIENE</span>
        </div>
        
        <div className="intrabucal-form-group">
          <div className="intrabucal-grid-4">
            <div className="intrabucal-field">
              <label className="intrabucal-label">Estado general</label>
              <select
                className="intrabucal-select"
                value={data.higiene_bucal?.general || ''}
                onChange={(e) => handleNestedChange('higiene_bucal', 'general', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Excelente">Excelente</option>
                <option value="Buena">Buena</option>
                <option value="Regular">Regular</option>
                <option value="Deficiente">Deficiente</option>
                <option value="Mala">Mala</option>
              </select>
            </div>
            
            <div className="intrabucal-field">
              <label className="intrabucal-label">Índice de placa (%)</label>
              <input
                type="text"
                className="intrabucal-input"
                value={data.higiene_bucal?.indice_placa || ''}
                onChange={(e) => handleNestedChange('higiene_bucal', 'indice_placa', e.target.value)}
                placeholder="Ej: 35%"
              />
            </div>
            
            <div className="intrabucal-field">
              <label className="intrabucal-label">Cálculo</label>
              <select
                className="intrabucal-select"
                value={data.higiene_bucal?.calculo || ''}
                onChange={(e) => handleNestedChange('higiene_bucal', 'calculo', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Ausente">Ausente</option>
                <option value="Leve">Leve</option>
                <option value="Moderado">Moderado</option>
                <option value="Abundante">Abundante</option>
              </select>
            </div>
            
            <div className="intrabucal-field">
              <label className="intrabucal-label">Halitosis</label>
              <select
                className="intrabucal-select"
                value={data.higiene_bucal?.halitosis || ''}
                onChange={(e) => handleNestedChange('higiene_bucal', 'halitosis', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="Ausente">Ausente</option>
                <option value="Leve">Leve</option>
                <option value="Moderada">Moderada</option>
                <option value="Intensa">Intensa</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Encías - Evaluación Básica */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">Encías - Evaluación Básica</h4>
          <span className="intrabucal-badge encias">ENCÍAS</span>
        </div>
        
        <div className="intrabucal-form-group">
          <p className="intrabucal-section-description">
            Evaluación general de las características gingivales
          </p>
          
          {/* Características gingivales */}
          <div className="intrabucal-grid-3">
            {Object.entries(opcionesEncias).map(([campo, opciones]) => (
              <div key={campo} className="intrabucal-field">
                <label className="intrabucal-label">
                  {campo.replace('_', ' ').charAt(0).toUpperCase() + campo.replace('_', ' ').slice(1)}
                </label>
                <select
                  className="intrabucal-select"
                  value={data.encias?.[campo] || ''}
                  onChange={(e) => handleNestedChange('encias', campo, e.target.value)}
                >
                  <option value="">Seleccionar...</option>
                  {opciones.map(opcion => (
                    <option key={opcion} value={opcion}>{opcion}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Alteraciones gingivales básicas */}
          <div className="intrabucal-subsection">
            <div className="intrabucal-alteraciones-header">
              <h5 className="intrabucal-alteraciones-title">Alteraciones gingivales generales</h5>
              <button
                type="button"
                onClick={agregarAlteracion}
                className="intrabucal-btn-add"
              >
                + Agregar alteración
              </button>
            </div>

            {(data.encias?.alteraciones || []).map((alteracion, index) => (
              <div key={index} className="intrabucal-alteracion-item">
                <div className="intrabucal-alteracion-header">
                  <h6 className="intrabucal-alteracion-title">Alteración {index + 1}</h6>
                  <button
                    type="button"
                    onClick={() => eliminarAlteracion(index)}
                    className="intrabucal-btn-remove"
                  >
                    Eliminar
                  </button>
                </div>
                
                <div className="intrabucal-alteracion-fields">
                  <div className="intrabucal-small-field">
                    <label className="intrabucal-small-label">Localización</label>
                    <input
                      type="text"
                      className="intrabucal-small-input"
                      value={alteracion.localizacion || ''}
                      onChange={(e) => actualizarAlteracion(index, 'localizacion', e.target.value)}
                      placeholder="Ej: Encía marginal superior anterior"
                    />
                  </div>
                  
                  <div className="intrabucal-small-field">
                    <label className="intrabucal-small-label">Descripción</label>
                    <input
                      type="text"
                      className="intrabucal-small-input"
                      value={alteracion.descripcion || ''}
                      onChange={(e) => actualizarAlteracion(index, 'descripcion', e.target.value)}
                      placeholder="Ej: Inflamación, úlcera, hiperplasia"
                    />
                  </div>
                  
                  <div className="intrabucal-small-field">
                    <label className="intrabucal-small-label">Tamaño</label>
                    <input
                      type="text"
                      className="intrabucal-small-input"
                      value={alteracion.tamaño || ''}
                      onChange={(e) => actualizarAlteracion(index, 'tamaño', e.target.value)}
                      placeholder="Ej: 5mm x 3mm"
                    />
                  </div>
                  
                  <div className="intrabucal-small-field">
                    <label className="intrabucal-small-label">Color</label>
                    <input
                      type="text"
                      className="intrabucal-small-input"
                      value={alteracion.color || ''}
                      onChange={(e) => actualizarAlteracion(index, 'color', e.target.value)}
                      placeholder="Ej: Rojizo, blanquecino"
                    />
                  </div>
                  
                  <div className="intrabucal-small-field">
                    <label className="intrabucal-small-label">Consistencia</label>
                    <input
                      type="text"
                      className="intrabucal-small-input"
                      value={alteracion.consistencia || ''}
                      onChange={(e) => actualizarAlteracion(index, 'consistencia', e.target.value)}
                      placeholder="Ej: Blanda, dura, fluctuante"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Hallazgos adicionales */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">Hallazgos Adicionales</h4>
          <span className="intrabucal-badge evaluacion">GENERAL</span>
        </div>
        
        <div className="intrabucal-form-group">
          <label className="intrabucal-label">
            Observaciones generales y hallazgos relevantes
          </label>
          <textarea
            className="intrabucal-textarea"
            value={data.hallazgos_adicionales || ''}
            onChange={(e) => handleChange('hallazgos_adicionales', e.target.value)}
            placeholder="Describir hallazgos adicionales, observaciones especiales, patologías encontradas, etc..."
            style={{ minHeight: '120px' }}
          />
        </div>
      </div>

      {/* Nota informativa */}
      <div className="intrabucal-info-note">
        <div className="intrabucal-info-icon">ℹ️</div>
        <div className="intrabucal-info-content">
          <h6>Información importante</h6>
          <p>
            Complete detalladamente cada sección del examen intrabucal básico. Esta información 
            complementa las evaluaciones especializadas de oclusión y periodontograma que se 
            encuentran en secciones separadas.
          </p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            <strong>Nota:</strong> Para evaluaciones específicas de oclusión, odontograma, 
            armonía maxilar y periodontograma, consulte las secciones especializadas correspondientes.
          </p>
        </div>
      </div>

    </div>
  );
};

export default ExamenIntrabucal;