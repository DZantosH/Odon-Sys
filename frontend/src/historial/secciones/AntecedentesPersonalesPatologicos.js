import React, { useState, useCallback, useMemo } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const AntecedentesPersonalesPatologicos = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  // Estado local por defecto - usar useMemo para evitar recreación
  const defaultData = useMemo(() => ({
    padecimientos: [
      { padecimiento: '', edad: '', control_medico: '', complicaciones: '' },
      { padecimiento: '', edad: '', control_medico: '', complicaciones: '' },
      { padecimiento: '', edad: '', control_medico: '', complicaciones: '' }
    ],
    anestesia: {
      ha_recibido: null,
      problema_anestesia: null,
      descripcion_problema: ''
    },
    antecedentes_sistemicos: {
      nutricionales: '',
      infecciosos: '',
      hemorragicos: '',
      alergicos: '',
      padecimientos_nombres: ''
    },
    habitus_exterior: '',
    somatometria: {
      peso: '',
      talla: '',
      imc: ''
    },
    signos_vitales: {
      temperatura: '',
      tension_arterial_sistolica: '',
      tension_arterial_diastolica: '',
      frecuencia_respiratoria: '',
      frecuencia_cardiaca: '',
      pulso: ''
    }
  }), []);

  const [localData, setLocalData] = useState(defaultData);

  // Usar datos externos si están disponibles, con validaciones
  const data = externalData || localData;

  // Asegurar que padecimientos siempre sea un array - usar useMemo
  const padecimientos = useMemo(() => {
    return Array.isArray(data.padecimientos) ? data.padecimientos : defaultData.padecimientos;
  }, [data.padecimientos, defaultData.padecimientos]);

  // Asegurar que las secciones anidadas existan - usar useMemo
  const anestesia = useMemo(() => {
    return data.anestesia || defaultData.anestesia;
  }, [data.anestesia, defaultData.anestesia]);

  const antecedentes_sistemicos = useMemo(() => {
    return data.antecedentes_sistemicos || defaultData.antecedentes_sistemicos;
  }, [data.antecedentes_sistemicos, defaultData.antecedentes_sistemicos]);

  const somatometria = useMemo(() => {
    return data.somatometria || defaultData.somatometria;
  }, [data.somatometria, defaultData.somatometria]);

  const signos_vitales = useMemo(() => {
    return data.signos_vitales || defaultData.signos_vitales;
  }, [data.signos_vitales, defaultData.signos_vitales]);

  // Función de cambio adaptada - corregir dependencies
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

  // Función para manejar cambios anidados - corregir dependencies
  const handleNestedChange = useCallback((section, field, value) => {
    const currentSection = section === 'anestesia' ? anestesia :
                          section === 'antecedentes_sistemicos' ? antecedentes_sistemicos :
                          section === 'somatometria' ? somatometria :
                          section === 'signos_vitales' ? signos_vitales : {};

    const newData = {
      ...currentSection,
      [field]: value
    };
    handleChange(section, newData);
  }, [anestesia, antecedentes_sistemicos, somatometria, signos_vitales, handleChange]);

  
  // Función para manejar cambios en padecimientos - corregir dependencies
  const handlePadecimientoChange = useCallback((index, field, value) => {
    const newPadecimientos = [...padecimientos];
    newPadecimientos[index] = {
      ...newPadecimientos[index],
      [field]: value
    };
    handleChange('padecimientos', newPadecimientos);
  }, [padecimientos, handleChange]);

  // Función para agregar nuevo padecimiento - corregir dependencies
  const agregarPadecimiento = useCallback(() => {
    const newPadecimientos = [
      ...padecimientos,
      { padecimiento: '', edad: '', control_medico: '', complicaciones: '' }
    ];
    handleChange('padecimientos', newPadecimientos);
  }, [padecimientos, handleChange]);

  // Efecto para calcular IMC cuando cambian peso o talla - dependencies correctas
React.useEffect(() => {
  const peso = parseFloat(somatometria.peso);
  const talla = parseFloat(somatometria.talla);
  
  if (peso && talla && talla > 0) {
    const tallaMetros = talla / 100;
    const imc = (peso / (tallaMetros * tallaMetros)).toFixed(2);
    
    // Solo actualizar si el IMC es diferente (evita loops)
    if (somatometria.imc !== imc) {
      handleNestedChange('somatometria', 'imc', imc);
    }
  } else {
    // Solo limpiar si había un valor antes
    if (somatometria.imc !== '') {
      handleNestedChange('somatometria', 'imc', '');
    }
  }
}, [handleNestedChange, somatometria.imc, somatometria.peso, somatometria.talla]);

  // Suprimir warnings de eslint para errores si no se usan
  React.useEffect(() => {
    if (Object.keys(errores).length > 0) {
      console.log('Errores disponibles:', errores);
    }
  }, [errores]);

  return (
    <div className="antecedentes-personales-patologicos">
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>🏥 Antecedentes Personales Patológicos</h3>
          <p className="header-subtitle">Historial médico y condiciones de salud previas</p>
        </div>
      </div>

      {/* Tabla de padecimientos */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>📋 Padecimientos Anteriores</h4>
          <span className="card-badge" style={{backgroundColor: '#dc3545'}}>Médico</span>
        </div>

        <div className="form-group-enhanced">
          <div className="padecimientos-table">
            <div className="padecimientos-table-header">
              <div className="padecimientos-header-cell">Padecimiento</div>
              <div className="padecimientos-header-cell">Edad</div>
              <div className="padecimientos-header-cell">Tuvo control médico</div>
              <div className="padecimientos-header-cell">Complicaciones o secuelas</div>
            </div>

            {padecimientos.map((padecimiento, index) => (
              <div key={index} className="padecimientos-table-row">
                <div className="padecimientos-cell" data-label="Padecimiento">
                  <input
                    type="text"
                    value={padecimiento.padecimiento || ''}
                    onChange={(e) => handlePadecimientoChange(index, 'padecimiento', e.target.value)}
                    placeholder="Nombre del padecimiento"
                  />
                </div>
                <div className="padecimientos-cell" data-label="Edad">
                  <input
                    type="number"
                    value={padecimiento.edad || ''}
                    onChange={(e) => handlePadecimientoChange(index, 'edad', e.target.value)}
                    placeholder="Edad"
                    min="0"
                    max="120"
                  />
                </div>
                <div className="padecimientos-cell" data-label="Control médico">
                  <input
                    type="text"
                    value={padecimiento.control_medico || ''}
                    onChange={(e) => handlePadecimientoChange(index, 'control_medico', e.target.value)}
                    placeholder="Sí/No, médico tratante"
                  />
                </div>
                <div className="padecimientos-cell" data-label="Complicaciones">
                  <textarea
                    value={padecimiento.complicaciones || ''}
                    onChange={(e) => handlePadecimientoChange(index, 'complicaciones', e.target.value)}
                    placeholder="Describe complicaciones o secuelas"
                    rows="2"
                  />
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarPadecimiento}
            className="btn-agregar-padecimiento"
          >
            ➕ Agregar Padecimiento
          </button>
        </div>
      </div>

      {/* Anestesia dental */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>💉 Anestesia Dental</h4>
          <span className="card-badge urgencia-badge">Anestesia</span>
        </div>

        <div className="form-group-enhanced">
          <div className="anestesia-section">
            <div className="anestesia-questions">
              <div className="anestesia-question">
                <label>¿Ha recibido anestesia dental?</label>
                <div className="anestesia-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${anestesia.ha_recibido === true ? 'active-si' : ''}`}
                    onClick={() => handleNestedChange('anestesia', 'ha_recibido', true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${anestesia.ha_recibido === false ? 'active-no' : ''}`}
                    onClick={() => handleNestedChange('anestesia', 'ha_recibido', false)}
                  >
                    No
                  </button>
                </div>
              </div>

              <div className="anestesia-question">
                <label>¿Ha presentado algún problema con la anestesia?</label>
                <div className="anestesia-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${anestesia.problema_anestesia === true ? 'active-si' : ''}`}
                    onClick={() => handleNestedChange('anestesia', 'problema_anestesia', true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${anestesia.problema_anestesia === false ? 'active-no' : ''}`}
                    onClick={() => handleNestedChange('anestesia', 'problema_anestesia', false)}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>

            {anestesia.problema_anestesia === true && (
              <div className="anestesia-problema-field">
                <label className="form-label-enhanced">Describe el problema con la anestesia:</label>
                <textarea
                  value={anestesia.descripcion_problema || ''}
                  onChange={(e) => handleNestedChange('anestesia', 'descripcion_problema', e.target.value)}
                  placeholder="Detalla qué tipo de problema tuvo con la anestesia dental..."
                  rows="3"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Antecedentes sistémicos */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🔬 Interrogatorio por Aparatos y Sistemas</h4>
          <span className="card-badge optional-badge">Sistémico</span>
        </div>

        <div className="form-group-enhanced">
          <div className="antecedentes-sistemicos">
            <div className="sistemicos-grid">
              <div className="sistemicos-categorias">
                <div className="sistemicos-categoria">
                  <h6>🍎 Nutricionales, digestivos, hepáticos, renales, endócrinos</h6>
                  <p>Cardíacos, vasculares, respiratorios, neoplásicos, neurológicos, piel y faneras, articulares y de la conducta u otros.</p>
                  <textarea
                    value={antecedentes_sistemicos.nutricionales || ''}
                    onChange={(e) => handleNestedChange('antecedentes_sistemicos', 'nutricionales', e.target.value)}
                    placeholder="Describe antecedentes nutricionales, digestivos, hepáticos, renales, endócrinos..."
                  />
                </div>

                <div className="sistemicos-categoria">
                  <h6>🦠 Antecedentes infecciosos</h6>
                  <p>Fiebres eruptivas, fiebre reumática, tuberculosis, sífilis, VIH, sida, papiloma, enfermedades micóticas y virales, abscesos e infecciones, parasitosis intestinales u otras.</p>
                  <textarea
                    value={antecedentes_sistemicos.infecciosos || ''}
                    onChange={(e) => handleNestedChange('antecedentes_sistemicos', 'infecciosos', e.target.value)}
                    placeholder="Describe antecedentes infecciosos..."
                  />
                </div>

                <div className="sistemicos-categoria">
                  <h6>🩸 Antecedentes hemorrágicos</h6>
                  <p>Hemorragias postquirúrgicas prolongadas, hemofilia, hemorragias nasales, bucales o rectales, púrpura, otras discrasias sanguíneas.</p>
                  <textarea
                    value={antecedentes_sistemicos.hemorragicos || ''}
                    onChange={(e) => handleNestedChange('antecedentes_sistemicos', 'hemorragicos', e.target.value)}
                    placeholder="Describe antecedentes hemorrágicos..."
                  />
                </div>

                <div className="sistemicos-categoria">
                  <h6>🤧 Antecedentes alérgicos</h6>
                  <p>Alimentos, medicamentos, animales, objetos, ambiente, otros.</p>
                  <textarea
                    value={antecedentes_sistemicos.alergicos || ''}
                    onChange={(e) => handleNestedChange('antecedentes_sistemicos', 'alergicos', e.target.value)}
                    placeholder="Describe alergias conocidas..."
                  />
                </div>
              </div>

              <div className="padecimientos-lista">
                <h6>📝 Nombre de los Padecimientos</h6>
                <textarea
                  value={antecedentes_sistemicos.padecimientos_nombres || ''}
                  onChange={(e) => handleNestedChange('antecedentes_sistemicos', 'padecimientos_nombres', e.target.value)}
                  placeholder="Lista los nombres específicos de los padecimientos mencionados..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Exploración física */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>👨‍⚕️ Exploración Física</h4>
          <span className="card-badge" style={{backgroundColor: '#17a2b8'}}>Examen</span>
        </div>

        <div className="form-group-enhanced">
          <div className="examen-fisico-section">
            {/* Habitus exterior */}
            <div className="habitus-exterior">
              <label className="form-label-enhanced">🚶‍♂️ Habitus exterior (Facies, marcha, lenguaje verbal y corporal, actitud):</label>
              <textarea
                value={data.habitus_exterior || ''}
                onChange={(e) => handleChange('habitus_exterior', e.target.value)}
                placeholder="Describe la apariencia general del paciente, marcha, lenguaje, actitud..."
                rows="3"
              />
            </div>

            {/* Somatometría */}
<h5 className="form-label-enhanced">📏 Somatometría:</h5>
<div className="somatometria-grid">

<div className="somatometria-field">
  <label>Peso (kg):</label>
  <input
    type="number"
    step="0.1"
    min="1"
    max="500"
    value={somatometria.peso || ''}
    onChange={(e) => handleNestedChange('somatometria', 'peso', e.target.value)}
    placeholder="70.5"
  />
  <small className="input-help">Ejemplo: 70.5 kg</small>
</div>

<div className="somatometria-field">
  <label>Talla (cm):</label>
  <input
    type="number"
    step="0.1"
    min="30"
    max="300"
    value={somatometria.talla || ''}
    onChange={(e) => handleNestedChange('somatometria', 'talla', e.target.value)}
    placeholder="170.5"
  />
  <small className="input-help">Ejemplo: 170.5 cm</small>
</div>

  <div className="somatometria-field">
    <label>IMC:</label>
    <input
      type="text"
      value={somatometria.imc || ''}
      readOnly
      placeholder="Se calcula automáticamente"
      style={{backgroundColor: '#f8f9fa', cursor: 'not-allowed'}}
    />
    <small className="input-help">
      {somatometria.imc && (
        <span>
          IMC: {somatometria.imc} - {
            parseFloat(somatometria.imc) < 18.5 ? 'Bajo peso' :
            parseFloat(somatometria.imc) < 25 ? 'Normal' :
            parseFloat(somatometria.imc) < 30 ? 'Sobrepeso' : 'Obesidad'
          }
        </span>
      )}
    </small>
  </div>
</div>

            {/* Signos vitales */}
            <h5 className="form-label-enhanced">💓 Signos Vitales:</h5>
            <div className="signos-vitales-grid">
              <div className="signos-vitales-card">
                <h6>🌡️ Temperatura y Respiración</h6>
                <div className="signos-row">
                  <div className="signos-field">
                    <label>Temperatura (°C):</label>
                    <input
                      type="number"
                      step="0.1"
                      value={signos_vitales.temperatura || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'temperatura', e.target.value)}
                      placeholder="36.5"
                      min="30"
                      max="45"
                    />
                  </div>
                </div>
                <div className="signos-row">
                  <div className="signos-field">
                    <label>Frecuencia respiratoria (por minuto):</label>
                    <input
                      type="number"
                      value={signos_vitales.frecuencia_respiratoria || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'frecuencia_respiratoria', e.target.value)}
                      placeholder="20"
                      min="5"
                      max="60"
                    />
                  </div>
                </div>
              </div>

              <div className="signos-vitales-card">
                <h6>💓 Presión y Pulso</h6>
                <div className="signos-row">
                  <div className="signos-field">
                    <label>Tensión arterial sistólica (mmHg):</label>
                    <input
                      type="number"
                      value={signos_vitales.tension_arterial_sistolica || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'tension_arterial_sistolica', e.target.value)}
                      placeholder="120"
                      min="60"
                      max="250"
                    />
                  </div>
                  <div className="signos-field">
                    <label>Tensión arterial diastólica (mmHg):</label>
                    <input
                      type="number"
                      value={signos_vitales.tension_arterial_diastolica || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'tension_arterial_diastolica', e.target.value)}
                      placeholder="80"
                      min="40"
                      max="150"
                    />
                  </div>
                </div>
                <div className="signos-row">
                  <div className="signos-field">
                    <label>Frecuencia cardíaca (por minuto):</label>
                    <input
                      type="number"
                      value={signos_vitales.frecuencia_cardiaca || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'frecuencia_cardiaca', e.target.value)}
                      placeholder="72"
                      min="30"
                      max="200"
                    />
                  </div>
                  <div className="signos-field">
                    <label>Pulso (por minuto):</label>
                    <input
                      type="number"
                      value={signos_vitales.pulso || ''}
                      onChange={(e) => handleNestedChange('signos_vitales', 'pulso', e.target.value)}
                      placeholder="72"
                      min="30"
                      max="200"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">⚕️</div>
        <div className="info-content">
          <h6>Importancia del historial médico</h6>
          <p>
            Los antecedentes patológicos son fundamentales para evaluar riesgos, 
            planificar tratamientos seguros y detectar posibles complicaciones. 
            Toda la información será tratada con absoluta confidencialidad médica 
            y nos ayudará a brindarte la mejor atención odontológica.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntecedentesPersonalesPatologicos;