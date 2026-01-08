import React, { useState, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const AntecedentesPersonalesNoPatologicos = ({ 
  datos: externalData, 
  onChange: externalOnChange, 
  errores = {},
  datosPaciente = {} // Agregamos los datos del paciente para acceder al género
}) => {
  // Estado local por defecto con estructura completa
  const defaultData = {
    servicios_publicos: {
      drenaje: null,
      agua: null,
      luz: null,
      telefono: null,
      otros: ''
    },
    vivienda: {
      tipo: '',
      riesgos_ambientales: '',
      convivencia_mascotas: ''
    },
    higiene: {
      general: '',
      bucal: ''
    },
    alimentarios: {
      comidas_por_dia: '',
      cantidad_agua: '',
      desayuno: '',
      comida: '',
      cena: '',
      entre_comidas: '',
      riesgos: {
        cardiovascular: false,
        litiasis_renal: false,
        colesterol_trigliceridos: false,
        desnutricion: false,
        obesidad: false,
        caries: false,
        periodontitis: false
      }
    },
    habitos_perniciosos: {
      alcoholismo: { tiene: false, frecuencia: '', cantidad: '', tipo: '' },
      tabaquismo: { tiene: false, frecuencia: '', cantidad: '', tipo: '' },
      otras_adicciones: { tiene: false, descripcion: '' },
      habitos_orales: {
        onicofagia: false,
        succion_digital: false,
        morder_objetos: false,
        bricomania: false,
        bruxismo: false,
        respirador_bucal: false,
        otros: ''
      }
    },
    antecedentes_medicos: {
      inmunizaciones: '',
      hospitalizaciones: '',
      fracturas: '',
      tipo_sangre: '',
      factor_rh: '',
      transfusiones_fecha: '',
      transfusiones_motivo: ''
    },
    antecedentes_sexuales: {
      vida_sexual_activa: null,
      numero_parejas: '',
      orientacion_sexual: '',
      metodo_proteccion: ''
    },
    antecedentes_gineco: {
      edad_menarca: '',
      periodos_regulares: null,
      sangrados_abundantes: null,
      metodo_anticonceptivo: null,
      cual_anticonceptivo: '',
      embarazos: '',
      abortos: '',
      edad_menopausia: '',
      fecha_ultima_menstruacion: ''
    },
    padecimiento_actual: ''
  };

  const [localData, setLocalData] = useState(defaultData);

  // Función para combinar datos externos con estructura por defecto
  const mergeWithDefaults = (external, defaults) => {
    if (!external) return defaults;
    
    const merged = { ...defaults };
    
    Object.keys(defaults).forEach(key => {
      if (external[key] !== undefined) {
        if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
          merged[key] = mergeWithDefaults(external[key], defaults[key]);
        } else {
          merged[key] = external[key];
        }
      }
    });
    
    return merged;
  };

  // Combinar datos externos con estructura por defecto
  const data = mergeWithDefaults(externalData, localData);

  // Determinar si mostrar la sección gineco-obstétrica
  const esPacienteFemenino = () => {
    const genero = datosPaciente?.genero || datosPaciente?.sexo || '';
    return genero.toLowerCase() === 'femenino' || genero.toLowerCase() === 'mujer' || genero.toLowerCase() === 'f';
  };

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

  // Función para manejar cambios profundamente anidados
  const handleDeepNestedChange = useCallback((section, subsection, field, value) => {
    const newData = {
      ...data[section],
      [subsection]: {
        ...data[section][subsection],
        [field]: value
      }
    };
    handleChange(section, newData);
  }, [data, handleChange]);

  const serviciosPublicos = [
    { key: 'drenaje', label: 'Drenaje', icon: '🚰' },
    { key: 'agua', label: 'Agua', icon: '💧' },
    { key: 'luz', label: 'Luz', icon: '💡' },
    { key: 'telefono', label: 'Teléfono', icon: '📞' }
  ];

  const riesgosAlimenticios = [
    { key: 'cardiovascular', label: 'Cardiovascular' },
    { key: 'litiasis_renal', label: 'Litiasis renal' },
    { key: 'colesterol_trigliceridos', label: 'Colesterol y triglicéridos altos' },
    { key: 'desnutricion', label: 'Desnutrición' },
    { key: 'obesidad', label: 'Obesidad' },
    { key: 'caries', label: 'Riesgo para caries' },
    { key: 'periodontitis', label: 'Riesgo periodontitis' }
  ];

  const habitosOrales = [
    { key: 'onicofagia', label: 'Onicofagia (morderse las uñas)' },
    { key: 'succion_digital', label: 'Succión digital' },
    { key: 'morder_objetos', label: 'Morder objetos' },
    { key: 'bricomania', label: 'Bricomania' },
    { key: 'bruxismo', label: 'Bruxismo' },
    { key: 'respirador_bucal', label: 'Respirador bucal' }
  ];

  return (
    <div className="antecedentes-personales-no-patologicos">
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>🏠 Antecedentes Personales No Patológicos</h3>
          <p className="header-subtitle">Información sobre tu estilo de vida y hábitos</p>
        </div>
      </div>

      {/* Indicador de género del paciente */}
      {datosPaciente?.nombre && (
        <div style={{
          background: 'linear-gradient(135deg, #e3f2fd 0%, #f1f8e9 100%)',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '20px',
          border: '1px solid #2196f3',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>
            {esPacienteFemenino() ? '👩' : '👨'}
          </span>
          <div>
            <strong style={{ color: '#1976d2' }}>
              Paciente: {datosPaciente.nombre || 'Sin nombre'}
            </strong>
            <span style={{ color: '#424242', marginLeft: '10px', fontSize: '14px' }}>
              Género: {datosPaciente.genero || datosPaciente.sexo || 'No especificado'}
            </span>
          </div>
        </div>
      )}

      {/* Accesibilidad a servicios públicos */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🏘️ Accesibilidad a Servicios Públicos</h4>
          <span className="card-badge">Vivienda</span>
        </div>

        <div className="form-group-enhanced">
          <div className="servicios-publicos-grid">
            {serviciosPublicos.map(servicio => (
              <div 
                key={servicio.key}
                className={`servicio-item ${
                  data.servicios_publicos[servicio.key] === true ? 'tiene-servicio' :
                  data.servicios_publicos[servicio.key] === false ? 'no-tiene-servicio' : ''
                }`}
              >
                <div className="servicio-icon">{servicio.icon}</div>
                <div className="servicio-label">{servicio.label}</div>
                <div className="servicio-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${data.servicios_publicos[servicio.key] === true ? 'active-si' : ''}`}
                    onClick={() => handleNestedChange('servicios_publicos', servicio.key, true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${data.servicios_publicos[servicio.key] === false ? 'active-no' : ''}`}
                    onClick={() => handleNestedChange('servicios_publicos', servicio.key, false)}
                  >
                    No
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="form-group">
            <label className="form-label-enhanced">Otros servicios:</label>
            <input
              type="text"
              className="form-input"
              value={data.servicios_publicos.otros || ''}
              onChange={(e) => handleNestedChange('servicios_publicos', 'otros', e.target.value)}
              placeholder="Especifica otros servicios..."
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label-enhanced">Tipo de vivienda:</label>
              <input
                type="text"
                className="form-input"
                value={data.vivienda.tipo || ''}
                onChange={(e) => handleNestedChange('vivienda', 'tipo', e.target.value)}
                placeholder="Casa, departamento, etc."
              />
            </div>
            <div className="form-group">
              <label className="form-label-enhanced">Riesgos ambientales:</label>
              <input
                type="text"
                className="form-input"
                value={data.vivienda.riesgos_ambientales || ''}
                onChange={(e) => handleNestedChange('vivienda', 'riesgos_ambientales', e.target.value)}
                placeholder="Contaminación, ruido, etc."
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label-enhanced">Convivencia con mascotas:</label>
            <input
              type="text"
              className="form-input"
              value={data.vivienda.convivencia_mascotas || ''}
              onChange={(e) => handleNestedChange('vivienda', 'convivencia_mascotas', e.target.value)}
              placeholder="Tipo de mascotas y cuidados..."
            />
          </div>
        </div>
      </div>

      {/* Hábitos de higiene */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🧼 Hábitos de Higiene</h4>
          <span className="card-badge urgencia-badge">Cuidado</span>
        </div>

        <div className="form-group-enhanced">
          <div className="higiene-grid">
            <div className="higiene-section">
              <h5>🚿 Higiene General</h5>
              <textarea
                value={data.higiene.general || ''}
                onChange={(e) => handleNestedChange('higiene', 'general', e.target.value)}
                placeholder="Describe tus hábitos de higiene personal: frecuencia de baño, cuidado de la piel, etc."
              />
            </div>
            <div className="higiene-section">
              <h5>🦷 Higiene Bucal</h5>
              <textarea
                value={data.higiene.bucal || ''}
                onChange={(e) => handleNestedChange('higiene', 'bucal', e.target.value)}
                placeholder="Describe tu rutina de higiene bucal: cepillado, uso de hilo dental, enjuague, etc."
              />
            </div>
          </div>
        </div>
      </div>

      {/* Hábitos alimentarios */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🍽️ Hábitos Alimentarios</h4>
          <span className="card-badge optional-badge">Nutrición</span>
        </div>

        <div className="form-group-enhanced">
          <div className="comidas-info">
            <div className="form-group">
              <label className="form-label-enhanced">Número de comidas al día:</label>
              <input
                type="number"
                className="form-input"
                value={data.alimentarios.comidas_por_dia || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'comidas_por_dia', e.target.value)}
                placeholder="Ej: 3"
                min="1"
                max="10"
              />
            </div>
            <div className="form-group">
              <label className="form-label-enhanced">Cantidad de agua por día (litros):</label>
              <input
                type="number"
                step="0.5"
                className="form-input"
                value={data.alimentarios.cantidad_agua || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'cantidad_agua', e.target.value)}
                placeholder="Ej: 2.5"
                min="0"
                max="10"
              />
            </div>
          </div>

          <div className="comidas-grid">
            <div className="comida-card">
              <h6>🌅 Desayuno</h6>
              <textarea
                value={data.alimentarios.desayuno || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'desayuno', e.target.value)}
                placeholder="Alimentos típicos del desayuno..."
              />
            </div>
            <div className="comida-card">
              <h6>🌞 Comida</h6>
              <textarea
                value={data.alimentarios.comida || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'comida', e.target.value)}
                placeholder="Alimentos típicos de la comida..."
              />
            </div>
            <div className="comida-card">
              <h6>🌙 Cena</h6>
              <textarea
                value={data.alimentarios.cena || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'cena', e.target.value)}
                placeholder="Alimentos típicos de la cena..."
              />
            </div>
            <div className="comida-card">
              <h6>🍎 Entre comidas</h6>
              <textarea
                value={data.alimentarios.entre_comidas || ''}
                onChange={(e) => handleNestedChange('alimentarios', 'entre_comidas', e.target.value)}
                placeholder="Snacks y colaciones..."
              />
            </div>
          </div>

          <h5 className="form-label-enhanced">Riesgos alimenticios detectados:</h5>
          <div className="riesgos-grid">
            {riesgosAlimenticios.map(riesgo => (
              <div 
                key={riesgo.key}
                className={`riesgo-item ${data.alimentarios.riesgos[riesgo.key] ? 'selected' : ''}`}
                onClick={() => handleDeepNestedChange('alimentarios', 'riesgos', riesgo.key, !data.alimentarios.riesgos[riesgo.key])}
              >
                <input
                  type="checkbox"
                  checked={data.alimentarios.riesgos[riesgo.key] || false}
                  onChange={() => {}} // Manejado por el onClick del contenedor
                />
                <label>{riesgo.label}</label>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hábitos perniciosos */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>⚠️ Hábitos Perniciosos</h4>
          <span className="card-badge" style={{backgroundColor: '#dc3545'}}>Riesgo</span>
        </div>

        <div className="form-group-enhanced">
          <div className="habitos-perniciosos-grid">
            {/* Alcoholismo */}
            <div className={`habito-card ${data.habitos_perniciosos.alcoholismo.tiene ? 'tiene-habito' : ''}`}>
              <div className="habito-header">
                <h5 className="habito-titulo">🍺 Alcoholismo</h5>
                <div className="habito-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.alcoholismo.tiene === true ? 'active-si' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'alcoholismo', 'tiene', true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.alcoholismo.tiene === false ? 'active-no' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'alcoholismo', 'tiene', false)}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="habito-detalles">
                <div className="detalle-row">
                  <div className="form-group">
                    <label>Frecuencia:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={data.habitos_perniciosos.alcoholismo.frecuencia || ''}
                      onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'alcoholismo', 'frecuencia', e.target.value)}
                      placeholder="Diario, semanal, etc."
                    />
                  </div>
                  <div className="form-group">
                    <label>Cantidad:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={data.habitos_perniciosos.alcoholismo.cantidad || ''}
                      onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'alcoholismo', 'cantidad', e.target.value)}
                      placeholder="Copas, cervezas, etc."
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tipo de bebida:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={data.habitos_perniciosos.alcoholismo.tipo || ''}
                    onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'alcoholismo', 'tipo', e.target.value)}
                    placeholder="Cerveza, vino, destilados, etc."
                  />
                </div>
              </div>
            </div>

            {/* Tabaquismo */}
            <div className={`habito-card ${data.habitos_perniciosos.tabaquismo.tiene ? 'tiene-habito' : ''}`}>
              <div className="habito-header">
                <h5 className="habito-titulo">🚬 Tabaquismo</h5>
                <div className="habito-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.tabaquismo.tiene === true ? 'active-si' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'tabaquismo', 'tiene', true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.tabaquismo.tiene === false ? 'active-no' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'tabaquismo', 'tiene', false)}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="habito-detalles">
                <div className="detalle-row">
                  <div className="form-group">
                    <label>Frecuencia:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={data.habitos_perniciosos.tabaquismo.frecuencia || ''}
                      onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'tabaquismo', 'frecuencia', e.target.value)}
                      placeholder="Cigarrillos por día"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiempo fumando:</label>
                    <input
                      type="text"
                      className="form-input"
                      value={data.habitos_perniciosos.tabaquismo.cantidad || ''}
                      onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'tabaquismo', 'cantidad', e.target.value)}
                      placeholder="Años fumando"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Tipo de tabaco:</label>
                  <input
                    type="text"
                    className="form-input"
                    value={data.habitos_perniciosos.tabaquismo.tipo || ''}
                    onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'tabaquismo', 'tipo', e.target.value)}
                    placeholder="Cigarrillos, puros, pipa, etc."
                  />
                </div>
              </div>
            </div>

            {/* Otras adicciones */}
            <div className={`habito-card ${data.habitos_perniciosos.otras_adicciones.tiene ? 'tiene-habito' : ''}`}>
              <div className="habito-header">
                <h5 className="habito-titulo">💊 Otras Adicciones</h5>
                <div className="habito-toggle">
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.otras_adicciones.tiene === true ? 'active-si' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'otras_adicciones', 'tiene', true)}
                  >
                    Sí
                  </button>
                  <button
                    type="button"
                    className={`toggle-btn ${data.habitos_perniciosos.otras_adicciones.tiene === false ? 'active-no' : ''}`}
                    onClick={() => handleDeepNestedChange('habitos_perniciosos', 'otras_adicciones', 'tiene', false)}
                  >
                    No
                  </button>
                </div>
              </div>
              <div className="habito-detalles">
                <div className="form-group">
                  <label>Descripción:</label>
                  <textarea
                    className="form-textarea-enhanced"
                    value={data.habitos_perniciosos.otras_adicciones.descripcion || ''}
                    onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'otras_adicciones', 'descripcion', e.target.value)}
                    placeholder="Describe las adicciones y su frecuencia..."
                    rows="3"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Hábitos orales */}
          <h5 className="form-label-enhanced" style={{marginTop: '30px'}}>🦷 Hábitos Orales:</h5>
          <div className="riesgos-grid">
            {habitosOrales.map(habito => (
              <div 
                key={habito.key}
                className={`riesgo-item ${data.habitos_perniciosos.habitos_orales[habito.key] ? 'selected' : ''}`}
                onClick={() => handleDeepNestedChange('habitos_perniciosos', 'habitos_orales', habito.key, !data.habitos_perniciosos.habitos_orales[habito.key])}
              >
                <input
                  type="checkbox"
                  checked={data.habitos_perniciosos.habitos_orales[habito.key] || false}
                  onChange={() => {}}
                />
                <label>{habito.label}</label>
              </div>
            ))}
          </div>

          <div className="form-group" style={{marginTop: '20px'}}>
            <label className="form-label-enhanced">Otros hábitos orales:</label>
            <input
              type="text"
              className="form-input"
              value={data.habitos_perniciosos.habitos_orales.otros || ''}
              onChange={(e) => handleDeepNestedChange('habitos_perniciosos', 'habitos_orales', 'otros', e.target.value)}
              placeholder="Especifica otros hábitos orales..."
            />
          </div>
        </div>
      </div>

      {/* Antecedentes Médico Quirúrgicos */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🏥 Antecedentes Médico Quirúrgicos</h4>
          <span className="card-badge" style={{backgroundColor: '#17a2b8'}}>Médico</span>
        </div>

        <div className="form-group-enhanced">
          <div className="antecedentes-medicos">
            <div className="medicos-grid">
              <div className="medico-field">
                <label>💉 Inmunizaciones:</label>
                <textarea
                  value={data.antecedentes_medicos.inmunizaciones || ''}
                  onChange={(e) => handleNestedChange('antecedentes_medicos', 'inmunizaciones', e.target.value)}
                  placeholder="Lista de vacunas aplicadas y fechas..."
                  rows="3"
                />
              </div>

              <div className="medico-field">
                <label>🏥 Hospitalizaciones y Motivo:</label>
                <textarea
                  value={data.antecedentes_medicos.hospitalizaciones || ''}
                  onChange={(e) => handleNestedChange('antecedentes_medicos', 'hospitalizaciones', e.target.value)}
                  placeholder="Hospitalizaciones previas, fechas y motivos..."
                  rows="3"
                />
              </div>

              <div className="medico-field">
                <label>🦴 Fracturas:</label>
                <textarea
                  value={data.antecedentes_medicos.fracturas || ''}
                  onChange={(e) => handleNestedChange('antecedentes_medicos', 'fracturas', e.target.value)}
                  placeholder="Fracturas previas, fechas y tratamientos..."
                  rows="2"
                />
              </div>

              <div className="form-row">
                <div className="medico-field">
                  <label>🩸 Tipo de sangre:</label>
                  <select
                    className="form-select"
                    value={data.antecedentes_medicos.tipo_sangre || ''}
                    onChange={(e) => handleNestedChange('antecedentes_medicos', 'tipo_sangre', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="AB">AB</option>
                    <option value="O">O</option>
                  </select>
                </div>
                <div className="medico-field">
                  <label>Factor RH:</label>
                  <select
                    className="form-select"
                    value={data.antecedentes_medicos.factor_rh || ''}
                    onChange={(e) => handleNestedChange('antecedentes_medicos', 'factor_rh', e.target.value)}
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Positivo">Positivo (+)</option>
                    <option value="Negativo">Negativo (-)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="medico-field">
                  <label>Transfusiones - Fecha:</label>
                  <input
                    type="text"
                    value={data.antecedentes_medicos.transfusiones_fecha || ''}
                    onChange={(e) => handleNestedChange('antecedentes_medicos', 'transfusiones_fecha', e.target.value)}
                    placeholder="Fecha de transfusiones"
                  />
                </div>
                <div className="medico-field">
                  <label>Motivo:</label>
                  <input
                    type="text"
                    value={data.antecedentes_medicos.transfusiones_motivo || ''}
                    onChange={(e) => handleNestedChange('antecedentes_medicos', 'transfusiones_motivo', e.target.value)}
                    placeholder="Motivo de las transfusiones"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Antecedentes Sexuales */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>💕 Antecedentes Sexuales</h4>
          <span className="card-badge optional-badge">Personal</span>
        </div>

        <div className="form-group-enhanced">
          <div className="gineco-grid">
            <div className="gineco-field">
              <label className="form-label-enhanced">¿Tiene vida sexual activa?</label>
              <div className="gineco-toggle-group">
                <label>
                  <input
                    type="radio"
                    name="vida_sexual_activa"
                    checked={data.antecedentes_sexuales.vida_sexual_activa === true}
                    onChange={() => handleNestedChange('antecedentes_sexuales', 'vida_sexual_activa', true)}
                  />
                  Sí
                </label>
                <label>
                  <input
                    type="radio"
                    name="vida_sexual_activa"
                    checked={data.antecedentes_sexuales.vida_sexual_activa === false}
                    onChange={() => handleNestedChange('antecedentes_sexuales', 'vida_sexual_activa', false)}
                  />
                  No
                </label>
              </div>
            </div>

            <div className="gineco-field">
              <label className="form-label-enhanced">Número de parejas sexuales:</label>
              <select
                className="form-select"
                value={data.antecedentes_sexuales.numero_parejas || ''}
                onChange={(e) => handleNestedChange('antecedentes_sexuales', 'numero_parejas', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="uno">Una</option>
                <option value="dos">Dos</option>
                <option value="varias">Varias</option>
              </select>
            </div>

            <div className="gineco-field">
              <label className="form-label-enhanced">Orientación sexual:</label>
              <select
                className="form-select"
                value={data.antecedentes_sexuales.orientacion_sexual || ''}
                onChange={(e) => handleNestedChange('antecedentes_sexuales', 'orientacion_sexual', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="heterosexual">Heterosexual</option>
                <option value="homosexual">Homosexual</option>
                <option value="bisexual">Bisexual</option>
              </select>
            </div>

            <div className="gineco-field">
              <label className="form-label-enhanced">Método de protección:</label>
              <select
                className="form-select"
                value={data.antecedentes_sexuales.metodo_proteccion || ''}
                onChange={(e) => handleNestedChange('antecedentes_sexuales', 'metodo_proteccion', e.target.value)}
              >
                <option value="">Seleccionar...</option>
                <option value="condon">Condón</option>
                <option value="otros">Otros</option>
                <option value="ninguno">Ninguno</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Antecedentes Gineco-obstétricos - SOLO SI ES PACIENTE FEMENINO */}
      {esPacienteFemenino() && (
        <div className="form-section-card">
          <div className="card-header">
            <h4>🤱 Antecedentes Gineco-obstétricos</h4>
            <span className="card-badge" style={{backgroundColor: '#e83e8c'}}>Femenino</span>
          </div>

          <div className="form-group-enhanced">
            <div className="gineco-section">
              <div className="gineco-grid">
                <div className="gineco-field">
                  <label className="form-label-enhanced">Edad en la que se presentó la menarca:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={data.antecedentes_gineco.edad_menarca || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'edad_menarca', e.target.value)}
                    placeholder="Edad"
                    min="8"
                    max="18"
                  />
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">¿Presenta periodos regulares?</label>
                  <div className="gineco-toggle-group">
                    <label>
                      <input
                        type="radio"
                        name="periodos_regulares"
                        checked={data.antecedentes_gineco.periodos_regulares === true}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'periodos_regulares', true)}
                      />
                      Sí
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="periodos_regulares"
                        checked={data.antecedentes_gineco.periodos_regulares === false}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'periodos_regulares', false)}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">¿Presenta sangrados abundantes?</label>
                  <div className="gineco-toggle-group">
                    <label>
                      <input
                        type="radio"
                        name="sangrados_abundantes"
                        checked={data.antecedentes_gineco.sangrados_abundantes === true}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'sangrados_abundantes', true)}
                      />
                      Sí
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="sangrados_abundantes"
                        checked={data.antecedentes_gineco.sangrados_abundantes === false}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'sangrados_abundantes', false)}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">¿Utiliza algún método anticonceptivo?</label>
                  <div className="gineco-toggle-group">
                    <label>
                      <input
                        type="radio"
                        name="metodo_anticonceptivo"
                        checked={data.antecedentes_gineco.metodo_anticonceptivo === true}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'metodo_anticonceptivo', true)}
                      />
                      Sí
                    </label>
                    <label>
                      <input
                        type="radio"
                        name="metodo_anticonceptivo"
                        checked={data.antecedentes_gineco.metodo_anticonceptivo === false}
                        onChange={() => handleNestedChange('antecedentes_gineco', 'metodo_anticonceptivo', false)}
                      />
                      No
                    </label>
                  </div>
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">¿Cuál anticonceptivo utiliza?</label>
                  <input
                    type="text"
                    className="form-input"
                    value={data.antecedentes_gineco.cual_anticonceptivo || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'cual_anticonceptivo', e.target.value)}
                    placeholder="Nombre del anticonceptivo"
                  />
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">Número de embarazos:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={data.antecedentes_gineco.embarazos || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'embarazos', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">Abortos:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={data.antecedentes_gineco.abortos || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'abortos', e.target.value)}
                    placeholder="0"
                    min="0"
                  />
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">Edad a la que se presentó la menopausia:</label>
                  <input
                    type="number"
                    className="form-input"
                    value={data.antecedentes_gineco.edad_menopausia || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'edad_menopausia', e.target.value)}
                    placeholder="Edad (si aplica)"
                    min="40"
                    max="65"
                  />
                </div>

                <div className="gineco-field">
                  <label className="form-label-enhanced">Fecha de la última menstruación:</label>
                  <input
                    type="date"
                    className="form-input"
                    value={data.antecedentes_gineco.fecha_ultima_menstruacion || ''}
                    onChange={(e) => handleNestedChange('antecedentes_gineco', 'fecha_ultima_menstruacion', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mensaje informativo cuando es paciente masculino */}
      {!esPacienteFemenino() && datosPaciente?.genero && (
        <div style={{
          background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
          border: '1px solid #ffc107',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>👨‍⚕️</span>
          <div>
            <h6 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '600', color: '#856404' }}>
              Sección no aplicable
            </h6>
            <p style={{ margin: 0, fontSize: '13px', color: '#856404' }}>
              La sección de "Antecedentes Gineco-obstétricos" está oculta automáticamente 
              para pacientes masculinos.
            </p>
          </div>
        </div>
      )}

      {/* Padecimiento actual */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🩺 Padecimiento Actual</h4>
          <span className="card-badge" style={{backgroundColor: '#fd7e14'}}>Actual</span>
        </div>

        <div className="form-group-enhanced">
          <label className="form-label-enhanced">Medicamentos que toma actualmente:</label>
          <textarea
            className="form-textarea-enhanced"
            value={data.padecimiento_actual || ''}
            onChange={(e) => handleChange('padecimiento_actual', e.target.value)}
            placeholder="Lista de medicamentos actuales con dosis y frecuencia..."
            rows="4"
          />
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">🔒</div>
        <div className="info-content">
          <h6>Confidencialidad y privacidad</h6>
          <p>
            Toda la información proporcionada es estrictamente confidencial y será utilizada 
            únicamente para fines médicos. Esta información nos ayuda a brindarte una atención 
            más personalizada y detectar posibles riesgos o interacciones en tu tratamiento.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AntecedentesPersonalesNoPatologicos;