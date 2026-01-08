import React, { useState, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const ExamenExtrabucal = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  // Estado local por defecto
  const [localData, setLocalData] = useState({
    cabeza: {
      craneo: '',
      biotipo_facial: '',
      perfil: ''
    },
    cadenas_ganglionares: {
      cervicales_anteriores: '',
      cervicales_posteriores: '',
      occipitales: '',
      periauriculares: '',
      parotideos: '',
      submentonianas: '',
      submandibulares: ''
    },
    tiroides: '',
    musculos_cuello: {
      esternocleidomastoideo: '',
      subclavio: '',
      trapecios: ''
    },
    atm: {
      alteracion: '',
      apertura_maxima: '',
      lateralidad_derecha: '',
      lateralidad_izquierda: '',
      masticacion_bilateral: null,
      descripcion_masticacion: ''
    },
    musculos_faciales: {
      masetero: '',
      temporal: '',
      borla_menton: '',
      orbicular_labios: '',
      risorio_santorini: ''
    },
    piel: {
      color: '',
      integridad: '',
      pigmentaciones: '',
      nevos: ''
    },
    estructuras_faciales: {
      frente: '',
      cejas: '',
      ojos: '',
      nariz: '',
      orejas: '',
      labios: ''
    }
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

  // Opciones para la sección de cabeza
  const opcionesCabeza = {
    craneo: ['Braquicéfalo', 'Mesocéfalo', 'Dolicocéfalo'],
    biotipo_facial: ['Braquifacial', 'Mesofacial', 'Dolicofacial'],
    perfil: ['Recto', 'Cóncavo', 'Convexo']
  };

  // Músculos del cuello
  const musculosCuello = [
    { key: 'esternocleidomastoideo', label: 'Esternocleidomastoideo' },
    { key: 'subclavio', label: 'Subclavio' },
    { key: 'trapecios', label: 'Trapecios' }
  ];

  // Músculos faciales
  const musculosFaciales = [
    { key: 'masetero', label: 'Masetero' },
    { key: 'temporal', label: 'Temporal' },
    { key: 'borla_menton', label: 'Borla del mentón' },
    { key: 'orbicular_labios', label: 'Orbicular de los labios' },
    { key: 'risorio_santorini', label: 'Risorio de Santorini' }
  ];

  // Estructuras faciales
  const estructurasFaciales = [
    { key: 'frente', label: 'Frente' },
    { key: 'cejas', label: 'Cejas' },
    { key: 'ojos', label: 'Ojos' },
    { key: 'nariz', label: 'Nariz' },
    { key: 'orejas', label: 'Orejas' },
    { key: 'labios', label: 'Labios' }
  ];

  // Cadenas ganglionares
  const cadenasGanglionares = [
    { key: 'cervicales_anteriores', label: 'Cervicales anteriores' },
    { key: 'cervicales_posteriores', label: 'Cervicales posteriores' },
    { key: 'occipitales', label: 'Occipitales' },
    { key: 'periauriculares', label: 'Periauriculares' },
    { key: 'parotideos', label: 'Parotídeos' },
    { key: 'submentonianas', label: 'Submentonianas' },
    { key: 'submandibulares', label: 'Submandibulares' }
  ];

  // Opciones de piel
  const opcionesPiel = [
    { key: 'color', label: 'Color', placeholder: 'Describir color de la piel...' },
    { key: 'integridad', label: 'Integridad', placeholder: 'Describir integridad de la piel...' },
    { key: 'pigmentaciones', label: 'Pigmentaciones', placeholder: 'Describir pigmentaciones...' },
    { key: 'nevos', label: 'Nevos', placeholder: 'Describir nevos...' }
  ];

  return (
    <div className="examen-extrabucal-moderno">
      
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>III. EXAMEN EXTRABUCAL</h3>
          <p className="header-subtitle">
            Evaluación de estructuras externas de cabeza y cuello
          </p>
        </div>
      </div>

      {/* 10. Cabeza */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>10. Cabeza</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="form-grid-3">
            <div className="form-field">
              <label className="form-label-enhanced">Cráneo</label>
              <select
                className="form-select-enhanced"
                value={data.cabeza?.craneo || ''}
                onChange={(e) => handleNestedChange('cabeza', 'craneo', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {opcionesCabeza.craneo.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label className="form-label-enhanced">Biotipo facial</label>
              <select
                className="form-select-enhanced"
                value={data.cabeza?.biotipo_facial || ''}
                onChange={(e) => handleNestedChange('cabeza', 'biotipo_facial', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {opcionesCabeza.biotipo_facial.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <label className="form-label-enhanced">Perfil</label>
              <select
                className="form-select-enhanced"
                value={data.cabeza?.perfil || ''}
                onChange={(e) => handleNestedChange('cabeza', 'perfil', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                {opcionesCabeza.perfil.map(opcion => (
                  <option key={opcion} value={opcion}>{opcion}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* 11. Cadenas ganglionares */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>11. Cadenas ganglionares</h4>
          <span className="card-badge alteraciones-badge">Solo alteraciones</span>
        </div>
        
        <div className="form-group-enhanced">
          <p className="section-description">
            Anotar solo si existe alguna alteración
          </p>
          
          <div className="cadenas-grid">
            {cadenasGanglionares.map(cadena => (
              <div key={cadena.key} className="form-field">
                <label className="form-label-enhanced">{cadena.label}</label>
                <textarea
                  className="form-textarea-enhanced"
                  value={data.cadenas_ganglionares?.[cadena.key] || ''}
                  onChange={(e) => handleNestedChange('cadenas_ganglionares', cadena.key, e.target.value)}
                  placeholder="Describir alteración si existe..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 12. Tiroides */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>12. Tiroides</h4>
          <span className="card-badge opcional-badge">Opcional</span>
        </div>
        
        <div className="form-group-enhanced">
          <label className="form-label-enhanced">
            Anotar sólo si existe alguna alteración
          </label>
          <textarea
            className="form-textarea-enhanced"
            value={data.tiroides || ''}
            onChange={(e) => handleChange('tiroides', e.target.value)}
            placeholder="Describir alteraciones tiroideas..."
          />
        </div>
      </div>

      {/* 13. Músculos del cuello */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>13. Músculos del cuello</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <p className="section-description">
            Descripción de alteración (trismus, cansancio, atónicos, espásticos, hipotónicos, hipertónicos, parestesia, paresia, atróficos, hipertróficos, dolor)
          </p>
          
          <div className="musculos-grid">
            {musculosCuello.map(musculo => (
              <div key={musculo.key} className="form-field">
                <label className="form-label-enhanced">{musculo.label}</label>
                <textarea
                  className="form-textarea-enhanced"
                  value={data.musculos_cuello?.[musculo.key] || ''}
                  onChange={(e) => handleNestedChange('musculos_cuello', musculo.key, e.target.value)}
                  placeholder="Describir alteración..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 14. Articulación Temporo-mandibular */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>14. Articulación Temporo-mandibular (ATM)</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="form-field" style={{ marginBottom: '20px' }}>
            <label className="form-label-enhanced">
              Alteración (anotar si existe alteración y describirla)
            </label>
            <textarea
              className="form-textarea-enhanced"
              value={data.atm?.alteracion || ''}
              onChange={(e) => handleNestedChange('atm', 'alteracion', e.target.value)}
              placeholder="Describir alteraciones de la ATM..."
            />
          </div>
          
          <div className="atm-medidas-grid">
            <div className="form-field">
              <label className="form-label-enhanced">Apertura máxima (mm)</label>
              <input
                type="text"
                className="form-input-enhanced"
                value={data.atm?.apertura_maxima || ''}
                onChange={(e) => handleNestedChange('atm', 'apertura_maxima', e.target.value)}
                placeholder="mm"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label-enhanced">Lateralidad derecha (mm)</label>
              <input
                type="text"
                className="form-input-enhanced"
                value={data.atm?.lateralidad_derecha || ''}
                onChange={(e) => handleNestedChange('atm', 'lateralidad_derecha', e.target.value)}
                placeholder="mm"
              />
            </div>
            
            <div className="form-field">
              <label className="form-label-enhanced">Lateralidad izquierda (mm)</label>
              <input
                type="text"
                className="form-input-enhanced"
                value={data.atm?.lateralidad_izquierda || ''}
                onChange={(e) => handleNestedChange('atm', 'lateralidad_izquierda', e.target.value)}
                placeholder="mm"
              />
            </div>
          </div>
          
          <div className="atm-masticacion-section">
            <label className="form-label-enhanced">Masticación bilateral</label>
            <div className="radio-group">
              <div className="radio-option">
                <input
                  type="radio"
                  id="masticacion_si"
                  name="masticacion_bilateral"
                  value="true"
                  checked={data.atm?.masticacion_bilateral === true}
                  onChange={() => handleNestedChange('atm', 'masticacion_bilateral', true)}
                />
                <label htmlFor="masticacion_si">SÍ</label>
              </div>
              <div className="radio-option">
                <input
                  type="radio"
                  id="masticacion_no"
                  name="masticacion_bilateral"
                  value="false"
                  checked={data.atm?.masticacion_bilateral === false}
                  onChange={() => handleNestedChange('atm', 'masticacion_bilateral', false)}
                />
                <label htmlFor="masticacion_no">NO</label>
              </div>
            </div>
            
            <div className="form-field" style={{ marginTop: '16px' }}>
              <label className="form-label-enhanced">Descripción</label>
              <input
                type="text"
                className="form-input-enhanced"
                value={data.atm?.descripcion_masticacion || ''}
                onChange={(e) => handleNestedChange('atm', 'descripcion_masticacion', e.target.value)}
                placeholder="Describir masticación..."
              />
            </div>
          </div>
        </div>
      </div>

      {/* 15. Músculos faciales */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>15. Músculos faciales</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <p className="section-description">
            Descripción de alteración (trismus, cansancio, astenia, atónicos, espásticos, hipotónicos, hipertónicos, parestesia, paresia, atróficos, hipertróficos, dolor)
          </p>
          
          <div className="musculos-grid">
            {musculosFaciales.map(musculo => (
              <div key={musculo.key} className="form-field">
                <label className="form-label-enhanced">{musculo.label}</label>
                <textarea
                  className="form-textarea-enhanced"
                  value={data.musculos_faciales?.[musculo.key] || ''}
                  onChange={(e) => handleNestedChange('musculos_faciales', musculo.key, e.target.value)}
                  placeholder="Describir alteración..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Piel */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>Piel</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <p className="section-description">
            Color, Integridad, Pigmentaciones, nevos
          </p>
          
          <div className="piel-grid">
            {opcionesPiel.map(opcion => (
              <div key={opcion.key} className="piel-field">
                <label>{opcion.label}</label>
                <input
                  type="text"
                  value={data.piel?.[opcion.key] || ''}
                  onChange={(e) => handleNestedChange('piel', opcion.key, e.target.value)}
                  placeholder={opcion.placeholder}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Estructuras Faciales */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>Estructuras faciales</h4>
          <span className="card-badge evaluacion-badge">Evaluación</span>
        </div>
        
        <div className="form-group-enhanced">
          <div className="estructuras-grid">
            {estructurasFaciales.map(estructura => (
              <div key={estructura.key} className="form-field">
                <label className="form-label-enhanced">{estructura.label}</label>
                <textarea
                  className="form-textarea-enhanced"
                  value={data.estructuras_faciales?.[estructura.key] || ''}
                  onChange={(e) => handleNestedChange('estructuras_faciales', estructura.key, e.target.value)}
                  placeholder="Describir alteración..."
                  style={{ minHeight: '60px' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h6>Información importante</h6>
          <p>
            Complete solo los campos donde identifique alteraciones o hallazgos significativos. 
            Los campos vacíos se interpretarán como normales. Sea específico en las descripciones 
            de alteraciones encontradas.
          </p>
        </div>
      </div>

    </div>
  );
};

export default ExamenExtrabucal;