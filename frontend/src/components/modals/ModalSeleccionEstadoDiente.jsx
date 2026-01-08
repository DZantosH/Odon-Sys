import React, { useState, useEffect } from 'react';
import '../../css/ModalSystem.css'

const estados = [
  { nombre: 'Sano', color: '#2ecc71', icono: '🦷' },
  { nombre: 'Cariado', color: '#e74c3c', icono: '🕳️' },
  { nombre: 'Obturado', color: '#3498db', icono: '🧱' },
  { nombre: 'Ausente', color: '#7f8c8d', icono: '❌' },
  { nombre: 'Corona', color: '#f1c40f', icono: '👑' },
  { nombre: 'Endodoncia', color: '#9b59b6', icono: '💉' },
  { nombre: 'Implante', color: '#16a085', icono: '🔩' },
  { nombre: 'Sellante', color: '#f39c12', icono: '🛡️' }
];

const superficies = ['Oclusal', 'Mesial', 'Distal', 'Lingual', 'Vestibular'];

const ModalSeleccionEstadoDiente = ({ pieza, estadoActual, onSeleccionar, onCerrar }) => {
  const [estado, setEstado] = useState(estadoActual?.estado || 'Sano');
  const [superficie, setSuperficie] = useState(estadoActual?.superficie || '');
  const [observacion, setObservacion] = useState(estadoActual?.observacion || '');

  useEffect(() => {
    setEstado(estadoActual?.estado || 'Sano');
    setSuperficie(estadoActual?.superficie || '');
    setObservacion(estadoActual?.observacion || '');
  }, [pieza]);

  const handleGuardar = () => {
    onSeleccionar({
      estado,
      superficie,
      observacion
    });
  };

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>🦷 Estado de la pieza {pieza}</h2>
        <p className="modal-sub">Selecciona el estado, superficie y añade observaciones</p>

        <div className="estado-grid">
          {estados.map(({ nombre, color, icono }) => (
            <button
              key={nombre}
              className={`estado-btn ${estado === nombre ? 'selected' : ''}`}
              style={{ backgroundColor: color }}
              onClick={() => setEstado(nombre)}
            >
              <span style={{ fontSize: '18px' }}>{icono}</span><br />
              {nombre}
            </button>
          ))}
        </div>

        <div className="form-group-modal">
          <label>Superficie Afectada:</label>
          <select value={superficie} onChange={(e) => setSuperficie(e.target.value)}>
            <option value="">Seleccionar superficie</option>
            {superficies.map((sup) => (
              <option key={sup} value={sup}>{sup}</option>
            ))}
          </select>
        </div>

        <div className="form-group-modal">
          <label>Observación:</label>
          <textarea
            rows={2}
            placeholder="Detalle clínico u observación libre"
            value={observacion}
            onChange={(e) => setObservacion(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button className="btn-guardar" onClick={handleGuardar}>Guardar</button>
          <button className="btn-cancelar" onClick={onCerrar}>Cancelar</button>
        </div>
      </div>
    </div>
  );
};

export default ModalSeleccionEstadoDiente;
