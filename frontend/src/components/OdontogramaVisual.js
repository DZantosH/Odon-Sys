import React, { useState } from 'react';
// ✅ CORRECCIÓN: Ruta correcta hacia la carpeta CSS desde 'components'
import '../css/HistorialFormularios.css'; 

// Componente de un Diente Individual Geométrico (SVG)
const DienteGeometrico = ({ numero, estado, onSurfaceClick, herramienta }) => {
  // Definir colores según el estado de cada superficie
  const getColor = (superficie) => {
    const estadoSup = estado[superficie];
    if (estadoSup === 'caries') return '#ef4444'; // Rojo
    if (estadoSup === 'obturacion') return '#3b82f6'; // Azul
    if (estadoSup === 'ausente') return '#1f2937'; // Negro (todo el diente)
    if (estadoSup === 'corona') return '#fbbf24'; // Dorado
    return 'white'; // Sano
  };

  // Si el diente está marcado como "Ausente" (extracción), se pinta todo oscuro
  const esAusente = estado.general === 'ausente';

  return (
    <div className="diente-wrapper">
      <span className="diente-numero">{numero}</span>
      <svg width="40" height="40" viewBox="0 0 100 100" className="diente-svg">
        {/* Si es ausente, tachamos o pintamos todo */}
        {esAusente ? (
          <g onClick={() => onSurfaceClick(numero, 'general')}>
             <circle cx="50" cy="50" r="48" fill="#e5e7eb" stroke="#374151" strokeWidth="2"/>
             <line x1="20" y1="20" x2="80" y2="80" stroke="#ef4444" strokeWidth="8" />
             <line x1="80" y1="20" x2="20" y2="80" stroke="#ef4444" strokeWidth="8" />
          </g>
        ) : (
          <g stroke="#333" strokeWidth="2">
            {/* Vestibular (Arriba) */}
            <path 
              d="M0,0 L100,0 L80,20 L20,20 Z" 
              fill={getColor('vestibular')}
              onClick={() => onSurfaceClick(numero, 'vestibular')}
              className="superficie-interactiva"
            />
            {/* Distal (Derecha) */}
            <path 
              d="M100,0 L100,100 L80,80 L80,20 Z" 
              fill={getColor('distal')}
              onClick={() => onSurfaceClick(numero, 'distal')}
              className="superficie-interactiva"
            />
            {/* Lingual/Palatino (Abajo) */}
            <path 
              d="M100,100 L0,100 L20,80 L80,80 Z" 
              fill={getColor('lingual')}
              onClick={() => onSurfaceClick(numero, 'lingual')}
              className="superficie-interactiva"
            />
            {/* Mesial (Izquierda) */}
            <path 
              d="M0,100 L0,0 L20,20 L20,80 Z" 
              fill={getColor('mesial')}
              onClick={() => onSurfaceClick(numero, 'mesial')}
              className="superficie-interactiva"
            />
            {/* Oclusal (Centro) */}
            <rect 
              x="20" y="20" width="60" height="60" 
              fill={getColor('oclusal')}
              onClick={() => onSurfaceClick(numero, 'oclusal')}
              className="superficie-interactiva"
            />
          </g>
        )}
      </svg>
    </div>
  );
};

// Componente Principal
const OdontogramaVisual = ({ datos, onChange }) => {
  // Estado de la herramienta seleccionada
  const [herramienta, setHerramienta] = useState('caries'); 

  // Estructura de dientes (FDI)
  const arcadaSuperior = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const arcadaInferior = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  // Manejador de clics
  const handleDienteClick = (numeroDiente, superficie) => {
    // Copiar estado actual
    const estadoActual = datos?.estados_dientes?.[numeroDiente] || {};
    let nuevoEstadoDiente = { ...estadoActual };

    if (herramienta === 'ausente') {
      // Si marcamos ausente, es un estado general del diente
      nuevoEstadoDiente.general = nuevoEstadoDiente.general === 'ausente' ? null : 'ausente';
    } else if (herramienta === 'borrador') {
      if (superficie === 'general') nuevoEstadoDiente.general = null;
      else nuevoEstadoDiente[superficie] = null;
    } else {
      // Pintar superficie
      nuevoEstadoDiente[superficie] = nuevoEstadoDiente[superficie] === herramienta ? null : herramienta;
      // Si pintamos, quitamos el estado de ausente
      nuevoEstadoDiente.general = null;
    }

    // Actualizar datos globales
    const nuevosDatos = {
      ...datos,
      estados_dientes: {
        ...datos?.estados_dientes,
        [numeroDiente]: nuevoEstadoDiente
      }
    };
    
    onChange('estados_dientes', nuevosDatos.estados_dientes);
  };

  return (
    <div className="odontograma-visual-container">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="odontograma-toolbar">
        <span className="toolbar-label">Selecciona herramienta:</span>
        <div className="toolbar-buttons">
          <button 
            className={`tool-btn caries ${herramienta === 'caries' ? 'active' : ''}`}
            onClick={() => setHerramienta('caries')}
            type="button"
          >
            🔴 Caries
          </button>
          <button 
            className={`tool-btn obturacion ${herramienta === 'obturacion' ? 'active' : ''}`}
            onClick={() => setHerramienta('obturacion')}
            type="button"
          >
            🔵 Obturación
          </button>
          <button 
            className={`tool-btn corona ${herramienta === 'corona' ? 'active' : ''}`}
            onClick={() => setHerramienta('corona')}
            type="button"
          >
            👑 Corona
          </button>
          <button 
            className={`tool-btn ausente ${herramienta === 'ausente' ? 'active' : ''}`}
            onClick={() => setHerramienta('ausente')}
            type="button"
          >
            ❌ Ausente
          </button>
          <button 
            className={`tool-btn borrador ${herramienta === 'borrador' ? 'active' : ''}`}
            onClick={() => setHerramienta('borrador')}
            type="button"
          >
            ⚪ Borrar
          </button>
        </div>
        <div className="toolbar-instruction">
          {herramienta === 'ausente' ? 'Toca el centro del diente para marcar extracción.' : 
           herramienta === 'borrador' ? 'Toca cualquier zona para limpiar.' :
           `Toca las zonas del diente para marcar ${herramienta}.`}
        </div>
      </div>

      {/* ÁREA DE DIENTES */}
      <div className="odontograma-scroll-area">
        <div className="arcada">
          <div className="arcada-label">Superior</div>
          <div className="dientes-flex">
            {arcadaSuperior.map(diente => (
              <DienteGeometrico 
                key={diente} 
                numero={diente} 
                estado={datos?.estados_dientes?.[diente] || {}}
                onSurfaceClick={handleDienteClick}
                herramienta={herramienta}
              />
            ))}
          </div>
        </div>

        <div className="arcada">
          <div className="dientes-flex">
            {arcadaInferior.map(diente => (
              <DienteGeometrico 
                key={diente} 
                numero={diente} 
                estado={datos?.estados_dientes?.[diente] || {}}
                onSurfaceClick={handleDienteClick}
                herramienta={herramienta}
              />
            ))}
          </div>
          <div className="arcada-label">Inferior</div>
        </div>
      </div>

    </div>
  );
};

export default OdontogramaVisual;