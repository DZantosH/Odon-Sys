// Citas.js - Componente para gestionar citas (Frontend)
import React, { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/config.js';


const Citas = () => {
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarCitas();
  }, []);

  const cargarCitas = async () => {
    try {
      setLoading(true);
      const response = await fetch(buildApiUrl('/citas'));
      if (response.ok) {
        const data = await response.json();
        setCitas(data);
      } else {
        console.error('Error al cargar citas:', response.status);
      }
    } catch (error) {
      console.error('Error al cargar citas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-ES');
  };

  const formatearHora = (hora) => {
    return hora ? hora.slice(0, 5) : 'N/A';
  };

  if (loading) {
    return (
      <div className="citas-container">
        <h2>Gestión de Citas</h2>
        <p>Cargando citas...</p>
      </div>
    );
  }

  return (
    <div className="citas-container">
      <h2>Gestión de Citas</h2>
      
      {citas.length === 0 ? (
        <p>No hay citas registradas</p>
      ) : (
        <div className="citas-lista">
          {citas.map(cita => (
            <div key={cita.id} className="cita-item">
              <div className="cita-fecha">
                {formatearFecha(cita.fecha_cita)} - {formatearHora(cita.hora_cita)}
              </div>
              <div className="cita-paciente">
                {cita.paciente_nombre} {cita.paciente_apellido}
              </div>
              <div className="cita-tipo">
                {cita.tipo_cita}
              </div>
              <div className="cita-estado">
                {cita.estado}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Citas;