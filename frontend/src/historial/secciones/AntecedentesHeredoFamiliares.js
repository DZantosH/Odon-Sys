import React, { useState, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const AntecedentesHeredoFamiliares = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  // Estado local por defecto
  const [localData, setLocalData] = useState({
    antecedentes: [
      { parentesco: 'Padre', padecimientos: '', edad: '', vivo: true },
      { parentesco: 'Madre', padecimientos: '', edad: '', vivo: true },
      { parentesco: 'Hermanos', padecimientos: '', edad: '', vivo: true },
      { parentesco: 'Abuelos paternos', padecimientos: '', edad: '', vivo: true },
      { parentesco: 'Abuelos maternos', padecimientos: '', edad: '', vivo: true },
      { parentesco: 'Tíos', padecimientos: '', edad: '', vivo: true }
    ],
    enfermedades_relevantes: {
      diabetes: false,
      hipertension: false,
      cardiopatias: false,
      cancer: false,
      enfermedades_mentales: false,
      malformaciones_congenitas: false,
      enfermedades_autoinmunes: false,
      alergias: false,
      otras: ''
    }
  });

  // Usar datos externos si están disponibles
  const data = externalData || localData;
  const antecedentes = data.antecedentes || localData.antecedentes;
  const enfermedadesRelevantes = data.enfermedades_relevantes || localData.enfermedades_relevantes;

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

  // Función para manejar cambios en antecedentes
  const handleAntecedenteChange = useCallback((index, field, value) => {
    const newAntecedentes = [...antecedentes];
    newAntecedentes[index] = {
      ...newAntecedentes[index],
      [field]: value
    };
    handleChange('antecedentes', newAntecedentes);
  }, [antecedentes, handleChange]);

  // Función para manejar cambios en enfermedades
  const handleEnfermedadChange = useCallback((field, value) => {
    const newEnfermedades = {
      ...enfermedadesRelevantes,
      [field]: value
    };
    handleChange('enfermedades_relevantes', newEnfermedades);
  }, [enfermedadesRelevantes, handleChange]);

  // Función para agregar familiar
  const agregarFamiliar = useCallback(() => {
    const newAntecedentes = [
      ...antecedentes,
      { parentesco: '', padecimientos: '', edad: '', vivo: true }
    ];
    handleChange('antecedentes', newAntecedentes);
  }, [antecedentes, handleChange]);

  // Función para eliminar familiar
  const eliminarFamiliar = useCallback((index) => {
    const newAntecedentes = antecedentes.filter((_, i) => i !== index);
    handleChange('antecedentes', newAntecedentes);
  }, [antecedentes, handleChange]);

  const padecimientosComunes = [
    'Diabetes Mellitus',
    'Hipertensión Arterial',
    'Infarto al Miocardio',
    'Cáncer',
    'Asma',
    'Artritis',
    'Osteoporosis',
    'Alzheimer',
    'Epilepsia',
    'Depresión',
    'Obesidad',
    'Tiroides',
    'Riñones',
    'Hígado',
    'Ninguno'
  ];

  return (
    <div className="antecedentes-heredo-familiares">
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>👨‍👩‍👧‍👦 Antecedentes Heredo-Familiares</h3>
          <p className="header-subtitle">Información sobre la salud de tus familiares directos</p>
        </div>
      </div>

      {/* Antecedentes por parentesco */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>📋 Antecedentes Familiares por Parentesco</h4>
          <span className="card-badge">Historial</span>
        </div>

        <div className="form-group-enhanced">
          <p className="section-description">
            Registre las enfermedades o padecimientos que han presentado sus familiares directos.
            Esta información es fundamental para identificar factores de riesgo hereditarios.
          </p>

          <div className="antecedentes-table">
            <div className="table-header">
              <div className="col-parentesco">Parentesco</div>
              <div className="col-padecimientos">Padecimientos</div>
              <div className="col-edad">Edad</div>
              <div className="col-estado">Estado</div>
              <div className="col-acciones">Acciones</div>
            </div>

            {antecedentes.map((antecedente, index) => (
              <div key={index} className="table-row">
                <div className="col-parentesco" data-label="Parentesco">
                  <input
                    type="text"
                    value={antecedente.parentesco}
                    onChange={(e) => handleAntecedenteChange(index, 'parentesco', e.target.value)}
                    placeholder="Ej: Padre, Hermana mayor"
                  />
                </div>

                <div className="col-padecimientos" data-label="Padecimientos">
                  <textarea
                    value={antecedente.padecimientos}
                    onChange={(e) => handleAntecedenteChange(index, 'padecimientos', e.target.value)}
                    placeholder="Describir padecimientos o 'Ninguno'"
                    rows="2"
                  />
                  <div className="padecimientos-sugeridos">
                    {padecimientosComunes.map((padecimiento) => (
                      <button
                        key={padecimiento}
                        type="button"
                        className="padecimiento-btn"
                        onClick={() => {
                          const currentValue = antecedente.padecimientos;
                          const newValue = currentValue 
                            ? `${currentValue}, ${padecimiento}`
                            : padecimiento;
                          handleAntecedenteChange(index, 'padecimientos', newValue);
                        }}
                      >
                        {padecimiento}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="col-edad" data-label="Edad">
                  <input
                    type="text"
                    value={antecedente.edad}
                    onChange={(e) => handleAntecedenteChange(index, 'edad', e.target.value)}
                    placeholder="Edad actual o de fallecimiento"
                  />
                </div>

                <div className="col-estado" data-label="Estado">
                  <select
                    value={antecedente.vivo}
                    onChange={(e) => handleAntecedenteChange(index, 'vivo', e.target.value === 'true')}
                  >
                    <option value={true}>Vivo</option>
                    <option value={false}>Finado</option>
                  </select>
                </div>

                <div className="col-acciones" data-label="Acciones">
                  {index >= 6 && (
                    <button
                      type="button"
                      onClick={() => eliminarFamiliar(index)}
                      className="btn-eliminar"
                      title="Eliminar familiar"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={agregarFamiliar}
            className="btn-agregar-familiar"
          >
            ➕ Agregar Familiar
          </button>
        </div>
      </div>

      {/* Enfermedades hereditarias relevantes */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🧬 Enfermedades Hereditarias Relevantes</h4>
          <span className="card-badge urgencia-badge">Genético</span>
        </div>

        <div className="form-group-enhanced">
          <p className="section-description">
            Marque las enfermedades que han presentado familiares directos y que pueden tener componente hereditario.
          </p>

          <div className="enfermedades-grid">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="diabetes"
                checked={enfermedadesRelevantes.diabetes}
                onChange={(e) => handleEnfermedadChange('diabetes', e.target.checked)}
              />
              <label htmlFor="diabetes">💉 Diabetes Mellitus</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="hipertension"
                checked={enfermedadesRelevantes.hipertension}
                onChange={(e) => handleEnfermedadChange('hipertension', e.target.checked)}
              />
              <label htmlFor="hipertension">🩺 Hipertensión Arterial</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="cardiopatias"
                checked={enfermedadesRelevantes.cardiopatias}
                onChange={(e) => handleEnfermedadChange('cardiopatias', e.target.checked)}
              />
              <label htmlFor="cardiopatias">❤️ Cardiopatías</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="cancer"
                checked={enfermedadesRelevantes.cancer}
                onChange={(e) => handleEnfermedadChange('cancer', e.target.checked)}
              />
              <label htmlFor="cancer">🎗️ Cáncer</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enfermedades_mentales"
                checked={enfermedadesRelevantes.enfermedades_mentales}
                onChange={(e) => handleEnfermedadChange('enfermedades_mentales', e.target.checked)}
              />
              <label htmlFor="enfermedades_mentales">🧠 Enfermedades Mentales</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="malformaciones_congenitas"
                checked={enfermedadesRelevantes.malformaciones_congenitas}
                onChange={(e) => handleEnfermedadChange('malformaciones_congenitas', e.target.checked)}
              />
              <label htmlFor="malformaciones_congenitas">🧬 Malformaciones Congénitas</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enfermedades_autoinmunes"
                checked={enfermedadesRelevantes.enfermedades_autoinmunes}
                onChange={(e) => handleEnfermedadChange('enfermedades_autoinmunes', e.target.checked)}
              />
              <label htmlFor="enfermedades_autoinmunes">🛡️ Enfermedades Autoinmunes</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="alergias"
                checked={enfermedadesRelevantes.alergias}
                onChange={(e) => handleEnfermedadChange('alergias', e.target.checked)}
              />
              <label htmlFor="alergias">🤧 Alergias Hereditarias</label>
            </div>
          </div>

          <div className="additional-info">
            <label htmlFor="otras_enfermedades" className="form-label-enhanced">
              Otras Enfermedades Hereditarias:
            </label>
            <textarea
              id="otras_enfermedades"
              className="form-textarea-enhanced"
              value={enfermedadesRelevantes.otras}
              onChange={(e) => handleEnfermedadChange('otras', e.target.value)}
              placeholder="Especifique otras enfermedades hereditarias no mencionadas anteriormente..."
              rows="3"
            />
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">⚠️</div>
        <div className="info-content">
          <h6>¿Por qué es importante esta información?</h6>
          <p>
            Los antecedentes heredo-familiares son cruciales para identificar factores de riesgo 
            y planificar tratamientos preventivos. La información hereditaria puede influir en 
            el desarrollo de enfermedades bucales y sistémicas, permitiendo un enfoque médico 
            más personalizado y preventivo.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntecedentesHeredoFamiliares;