import React, { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../../config/config.js';
import { useAuth } from '../../../services/AuthContext.js';
import '../../../css/ModalEditarPaciente.css';
import { toast } from 'react-toastify';

const ModalEditarPaciente = ({ isOpen, onClose, paciente, onPacienteActualizado }) => {
  // 🔑 USAR HOOK DE AUTENTICACIÓN
  const { getAuthHeaders } = useAuth();

  // Estados para el formulario
  const [formData, setFormData] = useState({
    // Información Personal
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    sexo: '',
    
    // Información de Contacto
    telefono: '',
    correo_electronico: '',
    direccion: '', // Se envía como calle_numero
    
    // Información Adicional
    lugar_nacimiento: '',
    lugar_procedencia: '',
    grupo_etnico: '',
    religion: '',
    rfc: '',
    numero_seguridad_social: '',
    derecho_habiente: false,
    nombre_institucion: '',
    
    // Observaciones
    observaciones_internas: ''
  });

  const [loading, setLoading] = useState(false);
  const [errores, setErrores] = useState({});

  // 🔑 FUNCIÓN ACTUALIZADA: Obtener token de sessionStorage con fallback
  const getAuthHeadersLocal = useCallback(() => {
    // Intentar obtener token de sessionStorage primero, luego localStorage como fallback
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    
    if (!token) {
      console.warn('⚠️ No se encontró token de autenticación');
      return {
        'Content-Type': 'application/json'
      };
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Función para formatear RFC (sin validación estricta)
  const formatearRFC = useCallback((rfc) => {
    return rfc.replace(/[^A-ZÑ&0-9X]/gi, '').toUpperCase().substring(0, 13);
  }, []);

  // 🔥 FUNCIÓN CORREGIDA PARA FORMATEAR FECHA
  const formatearFecha = useCallback((fecha) => {
    if (!fecha) {
      return '1900-01-01';
    }
    
    // Si ya está en formato YYYY-MM-DD
    if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return fecha;
    }
    
    try {
      const fechaObj = new Date(fecha);
      
      if (isNaN(fechaObj.getTime())) {
        return '1900-01-01';
      }
      
      // Formatear a YYYY-MM-DD
      const año = fechaObj.getFullYear();
      const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
      const dia = String(fechaObj.getDate()).padStart(2, '0');
      
      const fechaFormateada = `${año}-${mes}-${dia}`;
      
      return fechaFormateada;
      
    } catch (error) {
      return '1900-01-01';
    }
  }, []);

  // Llenar formulario cuando se selecciona un paciente
  useEffect(() => {
    if (paciente && isOpen) {
      // 🔥 FORMATEAR FECHA CORRECTAMENTE AL CARGAR
      const fechaFormateada = formatearFecha(paciente.fecha_nacimiento);
      const nuevoFormData = {
        nombre: paciente.nombre || '',
        apellido_paterno: paciente.apellido_paterno || '',
        apellido_materno: paciente.apellido_materno || '',
        fecha_nacimiento: fechaFormateada,
        sexo: paciente.sexo || '',
        telefono: paciente.telefono || '',
        correo_electronico: paciente.correo_electronico || '',
        // ✅ CORRECCIÓN: Buscar dirección en ambos campos posibles
        direccion: paciente.calle_numero || paciente.direccion || '',
        lugar_nacimiento: paciente.lugar_nacimiento || '',
        lugar_procedencia: paciente.lugar_procedencia || '',
        grupo_etnico: paciente.grupo_etnico || '',
        religion: paciente.religion || '',
        rfc: paciente.rfc || '',
        numero_seguridad_social: paciente.numero_seguridad_social || '',
        derecho_habiente: Boolean(paciente.derecho_habiente),
        nombre_institucion: paciente.nombre_institucion || '',
        observaciones_internas: paciente.observaciones_internas || ''
      };
      
      setFormData(nuevoFormData);
      setErrores({});
    }
  }, [paciente, isOpen, formatearFecha]);

  // Validaciones del formulario
  const validarFormulario = useCallback(() => {
    const nuevosErrores = {};

    // Campos obligatorios
    if (!formData.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    }
    if (!formData.apellido_paterno.trim()) {
      nuevosErrores.apellido_paterno = 'El apellido paterno es obligatorio';
    }
    if (!formData.fecha_nacimiento) {
      nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento es obligatoria';
    }
    if (!formData.sexo) {
      nuevosErrores.sexo = 'El sexo es obligatorio';
    }

    // Validación de fecha
    if (formData.fecha_nacimiento && formData.fecha_nacimiento !== '1900-01-01') {
      const fechaNacimiento = new Date(formData.fecha_nacimiento);
      const hoy = new Date();
      if (fechaNacimiento >= hoy) {
        nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento debe ser anterior a hoy';
      }
    }

    // Validación de email
    if (formData.correo_electronico && !/\S+@\S+\.\S+/.test(formData.correo_electronico)) {
      nuevosErrores.correo_electronico = 'El correo electrónico no es válido';
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }, [formData]);

  // Manejar cambios en los campos
  const handleInputChange = useCallback((campo, valor) => {
    setFormData(prev => ({
      ...prev,
      [campo]: valor
    }));
    
    // Limpiar error del campo al escribir
    if (errores[campo]) {
      setErrores(prev => ({
        ...prev,
        [campo]: ''
      }));
    }
  }, [errores]);

  // Función para manejar cambios en RFC (SIN validación)
  const handleRFCChange = useCallback((valor) => {
    const rfcFormateado = formatearRFC(valor);
    handleInputChange('rfc', rfcFormateado);
    
    // Limpiar cualquier error previo del RFC
    setErrores(prev => ({
      ...prev,
      rfc: ''
    }));
  }, [formatearRFC, handleInputChange]);

  // 🔥 FUNCIÓN CORREGIDA PARA ENVIAR DATOS CON SINCRONIZACIÓN
const handleSubmit = async (e) => {
  e.preventDefault();
  if (!validarFormulario()) {
    toast.error('❌ Formulario tiene errores. Revisa los campos requeridos.');
    return;
  }

  try {
    setLoading(true);
    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) throw new Error('No se encontró token de autenticación');

    const fechaFormateada = formatearFecha(formData.fecha_nacimiento);

    const datosEnvio = {
      nombre: formData.nombre?.trim(),
      apellido_paterno: formData.apellido_paterno?.trim(),
      apellido_materno: formData.apellido_materno?.trim() || null,
      fecha_nacimiento: fechaFormateada,
      sexo: formData.sexo,
      telefono: formData.telefono?.trim() || null,
      correo_electronico: formData.correo_electronico?.trim() || null,
      calle_numero: formData.direccion?.trim() || null,
      lugar_nacimiento: formData.lugar_nacimiento?.trim() || null,
      lugar_procedencia: formData.lugar_procedencia?.trim() || null,
      grupo_etnico: formData.grupo_etnico?.trim() || null,
      religion: formData.religion?.trim() || null,
      rfc: formData.rfc ? formData.rfc.trim().toUpperCase() : null,
      numero_seguridad_social: formData.numero_seguridad_social?.trim() || null,
      derecho_habiente: formData.derecho_habiente ? 1 : 0,
      nombre_institucion: formData.nombre_institucion?.trim() || null,
      observaciones_internas: formData.observaciones_internas?.trim() || null
    };

    // Limpiar campos vacíos
    Object.keys(datosEnvio).forEach(key => {
      if (datosEnvio[key] === '') datosEnvio[key] = null;
    });

    const urlEndpoint = buildApiUrl(`/pacientes/${paciente.id}`);
    const headers = getAuthHeadersLocal();

    const response = await fetch(urlEndpoint, {
      method: 'PUT',
      headers,
      body: JSON.stringify(datosEnvio)
    });

    const responseText = await response.text();

    let resultado;
    try {
      resultado = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Error parseando respuesta:', parseError);
      throw new Error(`Respuesta no válida del servidor. Status: ${response.status}`);
    }

    if (!response.ok) {
      throw new Error(resultado.message || resultado.error || `Error ${response.status}: ${response.statusText}`);
    }

    // 🔑 CREAR OBJETO PACIENTE ACTUALIZADO PARA SINCRONIZACIÓN
    const pacienteActualizado = {
      ...paciente, // Mantener datos originales
      ...datosEnvio, // Sobrescribir con nuevos datos
      id: paciente.id, // Asegurar que se mantenga el ID
      // Mapear campos que pueden tener nombres diferentes
      direccion: datosEnvio.calle_numero,
      calle_numero: datosEnvio.calle_numero
    };

    // 🔑 NOTIFICAR AL COMPONENTE PADRE CON DATOS COMPLETOS
    if (onPacienteActualizado) {
      onPacienteActualizado({
        success: true,
        id: resultado.id || paciente.id,
        campos_actualizados: resultado.campos_actualizados || Object.keys(datosEnvio),
        datos_actualizados: datosEnvio,
        paciente_completo: pacienteActualizado // 🔑 DATOS COMPLETOS PARA SINCRONIZACIÓN
      });
    }

    onClose();

  } catch (error) {
    console.error('❌ Error completo:', error);
    toast.error(`❌ Error al actualizar paciente: ${error.message}`);

    if (onPacienteActualizado) {
      onPacienteActualizado({
        success: false,
        error: error.message,
        id: paciente.id
      });
    }
  } finally {
    setLoading(false);
  }
};

  // No renderizar si no está abierto
  if (!isOpen || !paciente) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-editar-paciente" onClick={e => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="modal-header">
          <h2>✏️ Editar Paciente</h2>
          <div className="paciente-info">
            {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno}
            {paciente.matricula && <span className="matricula">#{paciente.matricula}</span>}
            <small style={{ opacity: 0.8, fontSize: '12px' }}>ID: {paciente.id}</small>
          </div>
          <button 
            className="modal-close-btn" 
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="modal-body">
          
          {/* Sección: Información Personal */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">👤</span>
              Información Personal
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="nombre">Nombre *</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className={errores.nombre ? 'error' : ''}
                  disabled={loading}
                  required
                />
                {errores.nombre && <span className="error-text">{errores.nombre}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="apellido_paterno">Apellido Paterno *</label>
                <input
                  type="text"
                  id="apellido_paterno"
                  value={formData.apellido_paterno}
                  onChange={(e) => handleInputChange('apellido_paterno', e.target.value)}
                  className={errores.apellido_paterno ? 'error' : ''}
                  disabled={loading}
                  required
                />
                {errores.apellido_paterno && <span className="error-text">{errores.apellido_paterno}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="apellido_materno">Apellido Materno</label>
                <input
                  type="text"
                  id="apellido_materno"
                  value={formData.apellido_materno}
                  onChange={(e) => handleInputChange('apellido_materno', e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="fecha_nacimiento">Fecha de Nacimiento *</label>
                <input
                  type="date"
                  id="fecha_nacimiento"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => handleInputChange('fecha_nacimiento', e.target.value)}
                  className={errores.fecha_nacimiento ? 'error' : ''}
                  disabled={loading}
                  required
                />
                {errores.fecha_nacimiento && <span className="error-text">{errores.fecha_nacimiento}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="sexo">Sexo *</label>
                <select
                  id="sexo"
                  value={formData.sexo}
                  onChange={(e) => handleInputChange('sexo', e.target.value)}
                  className={errores.sexo ? 'error' : ''}
                  disabled={loading}
                  required
                >
                  <option value="">Seleccionar...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Femenino</option>
                </select>
                {errores.sexo && <span className="error-text">{errores.sexo}</span>}
              </div>
            </div>
          </div>

          {/* Sección: Información de Contacto */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📞</span>
              Información de Contacto
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="telefono">Teléfono</label>
                <input
                  type="tel"
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  placeholder="Ej: 5512345678"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="correo_electronico">Correo Electrónico</label>
                <input
                  type="email"
                  id="correo_electronico"
                  value={formData.correo_electronico}
                  onChange={(e) => handleInputChange('correo_electronico', e.target.value)}
                  className={errores.correo_electronico ? 'error' : ''}
                  placeholder="ejemplo@correo.com"
                  disabled={loading}
                />
                {errores.correo_electronico && <span className="error-text">{errores.correo_electronico}</span>}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección Completa</label>
              <input
                type="text"
                id="direccion"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                placeholder="Calle, número, colonia, ciudad"
                disabled={loading}
              />
            </div>
          </div>

          {/* Sección: Información Adicional */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📋</span>
              Información Adicional
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="lugar_nacimiento">Lugar de Nacimiento</label>
                <input
                  type="text"
                  id="lugar_nacimiento"
                  value={formData.lugar_nacimiento}
                  onChange={(e) => handleInputChange('lugar_nacimiento', e.target.value)}
                  placeholder="Ciudad, Estado, País"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="lugar_procedencia">Lugar de Procedencia</label>
                <input
                  type="text"
                  id="lugar_procedencia"
                  value={formData.lugar_procedencia}
                  onChange={(e) => handleInputChange('lugar_procedencia', e.target.value)}
                  placeholder="Ciudad actual de residencia"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="grupo_etnico">Grupo Étnico</label>
                <input
                  type="text"
                  id="grupo_etnico"
                  value={formData.grupo_etnico}
                  onChange={(e) => handleInputChange('grupo_etnico', e.target.value)}
                  placeholder="Ej: Mestizo, Indígena, etc."
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="religion">Religión</label>
                <input
                  type="text"
                  id="religion"
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  placeholder="Ej: Católica, Cristiana, etc."
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="rfc">RFC</label>
                <input
                  type="text"
                  id="rfc"
                  value={formData.rfc}
                  onChange={(e) => handleRFCChange(e.target.value)}
                  className={errores.rfc ? 'error' : ''}
                  placeholder="Cualquier formato de RFC"
                  maxLength="13"
                  disabled={loading}
                  style={{
                    fontFamily: 'Courier New, monospace',
                    letterSpacing: '1px',
                    textTransform: 'uppercase'
                  }}
                />
                {errores.rfc && <span className="error-text">{errores.rfc}</span>}
                
                <div className="rfc-help">
                  <small style={{ color: '#87CEEB', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                    📝 Campo libre - acepta cualquier formato de RFC
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="numero_seguridad_social">Número de Seguridad Social</label>
                <input
                  type="text"
                  id="numero_seguridad_social"
                  value={formData.numero_seguridad_social}
                  onChange={(e) => handleInputChange('numero_seguridad_social', e.target.value)}
                  placeholder="Número de seguridad social"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Derecho habiente */}
            <div className="form-row">
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.derecho_habiente}
                    onChange={(e) => handleInputChange('derecho_habiente', e.target.checked)}
                    disabled={loading}
                  />
                  <span className="checkmark"></span>
                  ¿Es derecho habiente de alguna institución?
                </label>
              </div>

              {formData.derecho_habiente && (
                <div className="form-group">
                  <label htmlFor="nombre_institucion">Nombre de la Institución</label>
                  <input
                    type="text"
                    id="nombre_institucion"
                    value={formData.nombre_institucion}
                    onChange={(e) => handleInputChange('nombre_institucion', e.target.value)}
                    placeholder="Ej: IMSS, ISSSTE, etc."
                    disabled={loading}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Sección: Observaciones */}
          <div className="form-section">
            <h3 className="section-title">
              <span className="section-icon">📝</span>
              Observaciones Internas
            </h3>

            <div className="form-group">
              <label htmlFor="observaciones_internas">Notas internas del personal</label>
              <textarea
                id="observaciones_internas"
                value={formData.observaciones_internas}
                onChange={(e) => handleInputChange('observaciones_internas', e.target.value)}
                placeholder="Observaciones o notas internas sobre el paciente..."
                rows="3"
                disabled={loading}
              />
            </div>
          </div>

          {/* Botones del formulario */}
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onClose}
              className="btn-cancelar"
              disabled={loading}
            >
              ❌ Cancelar
            </button>
            <button 
              type="submit" 
              className="btn-guardar"
              disabled={loading}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ModalEditarPaciente;