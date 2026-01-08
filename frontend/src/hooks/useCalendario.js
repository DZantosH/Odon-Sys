// hooks/useCalendario.js
import { useState, useEffect, useCallback } from 'react';

export const useCalendario = () => {
  const [citasPorFecha, setCitasPorFecha] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [mesActual, setMesActual] = useState(new Date().getMonth() + 1);
  const [anoActual, setAnoActual] = useState(new Date().getFullYear());

  // Función para cargar citas del calendario
  const cargarCitasCalendario = useCallback(async (mes = mesActual, ano = anoActual) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/citas/calendario/${mes}/${ano}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📅 Citas del calendario cargadas:', result.data);
        setCitasPorFecha(result.data);
        return result.data;
      } else {
        throw new Error('Error al cargar citas del calendario');
      }
    } catch (err) {
      console.error('❌ Error cargando calendario:', err);
      setError(err.message);
      setCitasPorFecha({});
    } finally {
      setLoading(false);
    }
  }, [mesActual, anoActual]);

  // Función para actualizar calendario después de agendar cita
  const actualizarDespuesDeAgendar = useCallback(async (fechaCita) => {
    console.log('🔄 Actualizando calendario después de agendar cita:', fechaCita);
    
    // Determinar mes y año de la fecha de la cita
    const fecha = new Date(fechaCita);
    const mes = fecha.getMonth() + 1;
    const ano = fecha.getFullYear();
    
    // Si la cita es del mes actual, recargar
    if (mes === mesActual && ano === anoActual) {
      await cargarCitasCalendario(mes, ano);
    }
  }, [mesActual, anoActual, cargarCitasCalendario]);

  // Función para cambiar mes/año
  const cambiarMes = useCallback(async (nuevoMes, nuevoAno) => {
    setMesActual(nuevoMes);
    setAnoActual(nuevoAno);
    await cargarCitasCalendario(nuevoMes, nuevoAno);
  }, [cargarCitasCalendario]);

  // Función para obtener información de un día específico
  const getInfoDia = useCallback((fecha) => {
    const fechaStr = fecha instanceof Date ? fecha.toISOString().split('T')[0] : fecha;
    return citasPorFecha[fechaStr] || { total: 0, activas: 0, estado: 'vacio', detalle: null };
  }, [citasPorFecha]);

  // Función para obtener clase CSS del día
  const getClaseDia = useCallback((fecha) => {
    const info = getInfoDia(fecha);
    return `estado-${info.estado}`;
  }, [getInfoDia]);

  // Cargar datos iniciales
  useEffect(() => {
    cargarCitasCalendario();
  }, [cargarCitasCalendario]);

  return {
    citasPorFecha,
    loading,
    error,
    mesActual,
    anoActual,
    cargarCitasCalendario,
    actualizarDespuesDeAgendar,
    cambiarMes,
    getInfoDia,
    getClaseDia
  };
};