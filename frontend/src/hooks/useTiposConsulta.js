// hooks/useTiposConsulta.js
import { useState, useEffect } from 'react';
import { buildApiUrl } from '../config/config';

export const useTiposConsulta = () => {
  const [tiposConsulta, setTiposConsulta] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTiposConsulta = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/tipos-consulta'), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTiposConsulta(data.data || []);
      } else {
        throw new Error('Error al cargar tipos de consulta');
      }
    } catch (err) {
      console.error('Error fetching tipos consulta:', err);
      setError(err.message);
      setTiposConsulta([]);
    } finally {
      setLoading(false);
    }
  };

  const createTipoConsulta = async (tipoData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl('/tipos-consulta'), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tipoData)
      });

      if (response.ok) {
        await fetchTiposConsulta(); // Recargar lista
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear tipo de consulta');
      }
    } catch (err) {
      console.error('Error creating tipo consulta:', err);
      return { success: false, error: err.message };
    }
  };

  const updateTipoConsulta = async (id, tipoData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/tipos-consulta/${id}`), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tipoData)
      });

      if (response.ok) {
        await fetchTiposConsulta(); // Recargar lista
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al actualizar tipo de consulta');
      }
    } catch (err) {
      console.error('Error updating tipo consulta:', err);
      return { success: false, error: err.message };
    }
  };

  const deleteTipoConsulta = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(buildApiUrl(`/tipos-consulta/${id}`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await fetchTiposConsulta(); // Recargar lista
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar tipo de consulta');
      }
    } catch (err) {
      console.error('Error deleting tipo consulta:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchTiposConsulta();
  }, []);

  return {
    tiposConsulta,
    loading,
    error,
    fetchTiposConsulta,
    createTipoConsulta,
    updateTipoConsulta,
    deleteTipoConsulta
  };
};