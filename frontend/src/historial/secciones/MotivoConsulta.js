import React, { useState } from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const MotivoConsulta = ({ datos: externalFormData, onChange: externalHandleChange, errores = {} }) => {
  // Estado local si no se pasan props externas
  const [localFormData, setLocalFormData] = useState({
    motivo: '',
    escalaDolor: 0,
    nivelUrgencia: '',
    duracionSintomas: '',
    tratamientoPrevio: ''
  });

  // Usar datos externos si están disponibles, sino usar estado local
  const formData = externalFormData || localFormData;
  
  // Función handleChange local si no se pasa una externa
  const handleChange = externalHandleChange || ((event) => {
    const { name, value } = event.target;
    setLocalFormData(prev => ({
      ...prev,
      [name]: value
    }));
    console.log('Campo actualizado:', name, value); // Para debugging
  });

  // Si viene onChange de las props, adaptarlo al formato que espera el componente
  const adaptedHandleChange = externalHandleChange ? 
    (event) => {
      const { name, value } = event.target;
      externalHandleChange(name, value); // HistorialClinico espera (campo, valor)
    } : handleChange;

  const motivos = [
    { text: "Dolor de muelas", icon: "🦷", category: "dolor" },
    { text: "Revisión general", icon: "👨‍⚕️", category: "revision" },
    { text: "Limpieza dental", icon: "🧽", category: "limpieza" },
    { text: "Sangrado de encías", icon: "🩸", category: "encias" },
    { text: "Caries", icon: "🕳️", category: "caries" },
    { text: "Mal aliento", icon: "💨", category: "aliento" },
    { text: "Problemas de mordida", icon: "😬", category: "mordida" },
    { text: "Inflamación", icon: "🔴", category: "inflamacion" },
    { text: "Dolor al masticar", icon: "🍎", category: "masticar" },
    { text: "Dientes flojos", icon: "🦷", category: "movilidad" },
    { text: "Encías retraídas", icon: "📉", category: "retraccion" },
    { text: "Emergencia dental", icon: "🚨", category: "emergencia" }
  ];

  const urgenciaLevels = [
    { value: 'baja', label: 'Baja', color: '#28a745', description: 'Puede esperar algunos días' },
    { value: 'media', label: 'Media', color: '#ffc107', description: 'Requiere atención esta semana' },
    { value: 'alta', label: 'Alta', color: '#fd7e14', description: 'Necesita atención pronto' },
    { value: 'urgente', label: 'Urgente', color: '#dc3545', description: 'Requiere atención inmediata' }
  ];

  const getDolorDescription = (valor) => {
    if (valor <= 2) return { text: 'Dolor leve', color: '#28a745' };
    if (valor <= 4) return { text: 'Dolor moderado', color: '#ffc107' };
    if (valor <= 6) return { text: 'Dolor considerable', color: '#fd7e14' };
    if (valor <= 8) return { text: 'Dolor intenso', color: '#dc3545' };
    return { text: 'Dolor severo', color: '#721c24' };
  };

  const dolorInfo = getDolorDescription(formData.escalaDolor || 0);

  return (
    <div className="motivo-consulta-container">
      {/* Header de la sección */}
      <div className="seccion-header-custom">
        <div className="header-content">
          <h3>🗣️ Motivo de Consulta</h3>
          <p className="header-subtitle">Cuéntanos qué te trae hoy a la consulta</p>
        </div>
      </div>

      {/* Descripción principal */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>📝 Descripción del Problema</h4>
          <span className="card-badge">Principal</span>
        </div>
        
        <div className="form-group-enhanced">
          <label htmlFor="motivo" className="form-label-enhanced">
            Describe con tus propias palabras el motivo de tu visita:
          </label>
          <div className="textarea-container">
            <textarea
              id="motivo"
              name="motivo"
              className="form-textarea-enhanced"
              value={formData.motivo || ''}
              onChange={adaptedHandleChange}
              placeholder="Por ejemplo: 'Tengo dolor en la muela del lado derecho desde hace 3 días, especialmente cuando mastico alimentos fríos...'"
              rows="4"
            />
            <div className="textarea-counter">
              {(formData.motivo || '').length}/500 caracteres
            </div>
          </div>
        </div>

        {/* Motivos sugeridos */}
        <div className="motivos-sugeridos-container">
          <h5 className="suggestions-title">
            💡 O selecciona una opción rápida:
          </h5>
          <div className="motivos-grid-enhanced">
            {motivos.map((motivo, index) => (
              <button
                type="button"
                key={index}
                className={`motivo-btn-enhanced ${formData.motivo === motivo.text ? 'selected' : ''}`}
                onClick={() => adaptedHandleChange({
                  target: {
                    name: 'motivo',
                    value: motivo.text
                  }
                })}
              >
                <span className="motivo-icon">{motivo.icon}</span>
                <span className="motivo-text">{motivo.text}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Evaluación del dolor */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>🎯 Evaluación del Dolor</h4>
          <span className="card-badge dolor-badge" style={{backgroundColor: dolorInfo.color}}>
            Nivel {formData.escalaDolor || 0}
          </span>
        </div>
        
        <div className="dolor-assessment">
          <div className="dolor-scale-container">
            <label htmlFor="escalaDolor" className="form-label-enhanced">
              Escala del Dolor (0 = Sin dolor, 10 = Dolor insoportable):
            </label>
            
            <div className="dolor-slider-wrapper">
              <input
                type="range"
                id="escalaDolor"
                name="escalaDolor"
                min="0"
                max="10"
                value={formData.escalaDolor || 0}
                onChange={adaptedHandleChange}
                className="dolor-slider-enhanced"
                style={{'--slider-color': dolorInfo.color}}
              />
              
              <div className="dolor-scale-labels">
                <span className="scale-label">0<br/>Sin dolor</span>
                <span className="scale-label">2<br/>Leve</span>
                <span className="scale-label">4<br/>Moderado</span>
                <span className="scale-label">6<br/>Considerable</span>
                <span className="scale-label">8<br/>Intenso</span>
                <span className="scale-label">10<br/>Insoportable</span>
              </div>
            </div>
            
            <div className="dolor-display">
              <div className="dolor-value-display" style={{backgroundColor: dolorInfo.color}}>
                <span className="dolor-number">{formData.escalaDolor || 0}</span>
                <span className="dolor-description">{dolorInfo.text}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Nivel de urgencia */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>⚡ Nivel de Urgencia</h4>
          <span className="card-badge urgencia-badge">
            {formData.nivelUrgencia ? urgenciaLevels.find(u => u.value === formData.nivelUrgencia)?.label || 'No definido' : 'No definido'}
          </span>
        </div>
        
        <div className="urgencia-selection">
          <p className="urgencia-description">
            Ayúdanos a priorizar tu atención seleccionando el nivel de urgencia:
          </p>
          
          <div className="urgencia-grid">
            {urgenciaLevels.map((nivel) => (
              <div
                key={nivel.value}
                className={`urgencia-option ${formData.nivelUrgencia === nivel.value ? 'selected' : ''}`}
                onClick={() => adaptedHandleChange({
                  target: {
                    name: 'nivelUrgencia',
                    value: nivel.value
                  }
                })}
                style={{'--urgencia-color': nivel.color}}
              >
                <div className="urgencia-indicator"></div>
                <div className="urgencia-content">
                  <h6 className="urgencia-label">{nivel.label}</h6>
                  <p className="urgencia-desc">{nivel.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="form-section-card">
        <div className="card-header">
          <h4>📋 Información Adicional</h4>
          <span className="card-badge optional-badge">Opcional</span>
        </div>
        
        <div className="additional-info">
          <div className="form-group-enhanced">
            <label htmlFor="duracionSintomas" className="form-label-enhanced">
              ¿Desde cuándo tienes estos síntomas?
            </label>
            <select
              id="duracionSintomas"
              name="duracionSintomas"
              className="form-select-enhanced"
              value={formData.duracionSintomas || ''}
              onChange={adaptedHandleChange}
            >
              <option value="">Selecciona una opción</option>
              <option value="hoy">Hoy mismo</option>
              <option value="ayer">Desde ayer</option>
              <option value="dias">Pocos días</option>
              <option value="semana">Una semana</option>
              <option value="semanas">Varias semanas</option>
              <option value="mes">Un mes</option>
              <option value="meses">Varios meses</option>
              <option value="años">Años</option>
            </select>
          </div>

          <div className="form-group-enhanced">
            <label htmlFor="tratamientoPrevio" className="form-label-enhanced">
              ¿Has tomado algún medicamento o tratamiento para este problema?
            </label>
            <textarea
              id="tratamientoPrevio"
              name="tratamientoPrevio"
              className="form-textarea-enhanced small"
              value={formData.tratamientoPrevio || ''}
              onChange={adaptedHandleChange}
              placeholder="Ej: Ibuprofeno, enjuagues con agua salada, etc."
              rows="2"
            />
          </div>
        </div>
      </div>

      {/* Nota informativa */}
      <div className="info-note-enhanced">
        <div className="info-icon">ℹ️</div>
        <div className="info-content">
          <h6>¿Por qué es importante esta información?</h6>
          <p>
            Esta información nos ayuda a entender mejor tu situación y priorizar tu atención. 
            Mientras más detalles proporciones, mejor podremos prepararnos para tu cita y 
            ofrecerte el tratamiento más adecuado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default MotivoConsulta;