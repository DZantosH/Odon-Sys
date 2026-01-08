import React, { useState, useEffect, useCallback } from 'react';
import { buildApiUrl } from '../../../config/config.js';
import { useAuth } from '../../../services/AuthContext.js';
import '../../../css/ModalEditarPaciente.css';

const ModalEditarPaciente = ({ isOpen, onClose, paciente, onPacienteActualizado }) => {
  // Estados para el formulario - TODOS LOS CAMPOS NUEVOS INCLUIDOS
  const [formulario, setFormulario] = useState({
    // Campos básicos
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    telefono: '',
    sexo: '',
    correo_electronico: '',
    
    // Campos de ubicación
    lugar_nacimiento: '',
    lugar_procedencia: '',
    calle_numero: '', // Campo principal para dirección
    
    // Campos culturales/sociales
    grupo_etnico: '',
    religion: '',
    
    // Campos administrativos
    rfc: '',
    numero_seguridad_social: '',
    derecho_habiente: false,
    nombre_institucion: '',
    
    // Observaciones
    observaciones_internas: ''
  });

  // Estados de control
  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');

  // Función para obtener headers de autenticación
  const getAuthHeaders = useCallback(() => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }, []);

  // Función para cargar datos del paciente en el formulario
  const cargarDatosFormulario = useCallback(() => {
    if (!paciente) return;

    console.log('📋 Cargando datos del paciente en formulario:', paciente);

    // Cargar todos los campos del paciente
    setFormulario({
      // Campos básicos
      nombre: paciente.nombre || '',
      apellido_paterno: paciente.apellido_paterno || '',
      apellido_materno: paciente.apellido_materno || '',
      fecha_nacimiento: paciente.fecha_nacimiento || '',
      telefono: paciente.telefono || '',
      sexo: paciente.sexo || '',
      correo_electronico: paciente.correo_electronico || '',
      
      // Campos de ubicación
      lugar_nacimiento: paciente.lugar_nacimiento || '',
      lugar_procedencia: paciente.lugar_procedencia || '',
      calle_numero: paciente.calle_numero || paciente.direccion || '',
      
      // Campos culturales/sociales
      grupo_etnico: paciente.grupo_etnico || '',
      religion: paciente.religion || '',
      
      // Campos administrativos
      rfc: paciente.rfc || '',
      numero_seguridad_social: paciente.numero_seguridad_social || '',
      derecho_habiente: Boolean(paciente.derecho_habiente),
      nombre_institucion: paciente.nombre_institucion || '',
      
      // Observaciones
      observaciones_internas: paciente.observaciones_internas || ''
    });

    console.log('✅ Formulario cargado con datos del paciente');
  }, [paciente]);

  // useEffect para cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen && paciente) {
      console.log('🔄 Modal abierto, cargando datos...');
      cargarDatosFormulario();
      setErrores({});
      setErrorGeneral('');
    }
  }, [isOpen, paciente, cargarDatosFormulario]);

  // Función para manejar cambios en los inputs
  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;
    
    // Limpiar error específico del campo
    if (errores[name]) {
      setErrores(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Limpiar error general
    if (errorGeneral) {
      setErrorGeneral('');
    }
    
    setFormulario(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  }, [errores, errorGeneral]);

  // Función para validar el formulario
  const validarFormulario = useCallback(() => {
    const nuevosErrores = {};

    // Validaciones básicas
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formulario.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!formulario.apellido_paterno.trim()) {
      nuevosErrores.apellido_paterno = 'El apellido paterno es obligatorio';
    } else if (formulario.apellido_paterno.trim().length < 2) {
      nuevosErrores.apellido_paterno = 'El apellido paterno debe tener al menos 2 caracteres';
    }

    // Validar teléfono si se proporciona
    if (formulario.telefono.trim() && !/^\d{10}$/.test(formulario.telefono.replace(/\s/g, ''))) {
      nuevosErrores.telefono = 'El teléfono debe tener 10 dígitos';
    }

    // Validar email si se proporciona
    if (formulario.correo_electronico.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.correo_electronico.trim())) {
      nuevosErrores.correo_electronico = 'Formato de email inválido';
    }

    // Validar RFC si se proporciona
    if (formulario.rfc.trim() && !/^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/.test(formulario.rfc.trim().toUpperCase())) {
      nuevosErrores.rfc = 'Formato de RFC inválido';
    }

    // Validar NSS si se proporciona
    if (formulario.numero_seguridad_social.trim() && !/^\d{11}$/.test(formulario.numero_seguridad_social.replace(/\s/g, ''))) {
      nuevosErrores.numero_seguridad_social = 'El NSS debe tener 11 dígitos';
    }

    // Validar fecha de nacimiento si se proporciona
    if (formulario.fecha_nacimiento) {
      const fechaNacimiento = new Date(formulario.fecha_nacimiento);
      const hoy = new Date();
      
      if (fechaNacimiento > hoy) {
        nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
      }
    }

    return nuevosErrores;
  }, [formulario]);

  // Función para enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Enviando actualización de paciente...');
    
    // Validar formulario
    const nuevosErrores = validarFormulario();
    
    if (Object.keys(nuevosErrores).length > 0) {
      console.log('❌ Errores de validación:', nuevosErrores);
      setErrores(nuevosErrores);
      return;
    }

    try {
      setEnviando(true);
      setErrorGeneral('');

      // Preparar datos para envío
      const datosActualizacion = {
        ...formulario,
        telefono: formulario.telefono.replace(/\s/g, ''), // Quitar espacios
        rfc: formulario.rfc.trim().toUpperCase(),
        numero_seguridad_social: formulario.numero_seguridad_social.replace(/\s/g, ''),
        correo_electronico: formulario.correo_electronico.trim().toLowerCase(),
        // Asegurar que los campos de texto estén limpios
        nombre: formulario.nombre.trim(),
        apellido_paterno: formulario.apellido_paterno.trim(),
        apellido_materno: formulario.apellido_materno.trim(),
        lugar_nacimiento: formulario.lugar_nacimiento.trim(),
        lugar_procedencia: formulario.lugar_procedencia.trim(),
        calle_numero: formulario.calle_numero.trim(),
        grupo_etnico: formulario.grupo_etnico.trim(),
        religion: formulario.religion.trim(),
        nombre_institucion: formulario.nombre_institucion.trim(),
        observaciones_internas: formulario.observaciones_internas.trim()
      };

      console.log('📡 Datos a enviar:', datosActualizacion);

      const response = await fetch(buildApiUrl(`/pacientes/${paciente.id}`), {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(datosActualizacion)
      });

      console.log('📊 Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = 'Error al actualizar el paciente';
        
        if (response.status === 400) {
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || 'Datos inválidos';
          } catch (e) {
            errorMessage = 'Datos inválidos. Por favor, revisa la información';
          }
        } else if (response.status === 401) {
          errorMessage = 'Sesión expirada. Por favor, inicia sesión nuevamente';
        } else if (response.status === 403) {
          errorMessage = 'No tienes permisos para editar este paciente';
        } else if (response.status === 404) {
          errorMessage = 'Paciente no encontrado';
        } else if (response.status === 409) {
          errorMessage = 'Conflicto con los datos. Verifique que no exista duplicado';
        }
        
        throw new Error(errorMessage);
      }

      const resultado = await response.json();

      // Llamar callback para notificar actualización
      if (onPacienteActualizado) {
        onPacienteActualizado(resultado);
      }

      // El modal se cerrará desde el componente padre

    } catch (error) {
      console.error('❌ Error al actualizar paciente:', error);
      setErrorGeneral(error.message || 'Error desconocido al actualizar el paciente');
    } finally {
      setEnviando(false);
    }
  };

  // Función para cerrar el modal
  const handleClose = useCallback(() => {
    if (enviando) {
      return; // No permitir cerrar mientras se envía
    }
    
    setErrores({});
    setErrorGeneral('');
    onClose();
  }, [enviando, onClose]);

  // Función para calcular edad
  const calcularEdad = useCallback((fechaNacimiento) => {
    if (!fechaNacimiento) return null;
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }, []);

  // No renderizar si no está abierto
  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-editar-overlay" onClick={handleClose}>
      <div className="modal-editar-container" onClick={(e) => e.stopPropagation()}>
        {/* Header del modal */}
        <div className="modal-editar-header">
          <h2 className="modal-editar-title">
            ✏️ Editar Paciente
          </h2>
          <div className="paciente-info-header">
            {paciente && (
              <span className="paciente-id">ID: #{paciente.id}</span>
            )}
          </div>
          <button
            onClick={handleClose}
            className="modal-editar-close-btn"
            disabled={enviando}
            title="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Contenido del modal */}
        <div className="modal-editar-content">
          {/* Error general */}
          {errorGeneral && (
            <div className="error-general">
              <span className="error-icon">⚠️</span>
              <span>{errorGeneral}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="formulario-editar">
            {/* SECCIÓN 1: INFORMACIÓN BÁSICA */}
            <div className="seccion-formulario">
              <h3 className="seccion-titulo">👤 Información Básica</h3>
              
              <div className="campos-grid">
                {/* Nombre */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Nombre *</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formulario.nombre}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.nombre ? 'campo-error' : ''}`}
                    placeholder="Nombre del paciente"
                    disabled={enviando}
                    maxLength={50}
                  />
                  {errores.nombre && (
                    <span className="mensaje-error">{errores.nombre}</span>
                  )}
                </div>

                {/* Apellido Paterno */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Apellido Paterno *</span>
                  </label>
                  <input
                    type="text"
                    name="apellido_paterno"
                    value={formulario.apellido_paterno}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.apellido_paterno ? 'campo-error' : ''}`}
                    placeholder="Apellido paterno"
                    disabled={enviando}
                    maxLength={50}
                  />
                  {errores.apellido_paterno && (
                    <span className="mensaje-error">{errores.apellido_paterno}</span>
                  )}
                </div>

                {/* Apellido Materno */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Apellido Materno</span>
                  </label>
                  <input
                    type="text"
                    name="apellido_materno"
                    value={formulario.apellido_materno}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.apellido_materno ? 'campo-error' : ''}`}
                    placeholder="Apellido materno (opcional)"
                    disabled={enviando}
                    maxLength={50}
                  />
                  {errores.apellido_materno && (
                    <span className="mensaje-error">{errores.apellido_materno}</span>
                  )}
                </div>

                {/* Fecha de Nacimiento */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Fecha de Nacimiento</span>
                  </label>
                  <input
                    type="date"
                    name="fecha_nacimiento"
                    value={formulario.fecha_nacimiento}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.fecha_nacimiento ? 'campo-error' : ''}`}
                    disabled={enviando}
                    max={new Date().toISOString().split('T')[0]}
                    min="1900-01-01"
                  />
                  {formulario.fecha_nacimiento && (
                    <span className="campo-ayuda">
                      Edad: {calcularEdad(formulario.fecha_nacimiento)} años
                    </span>
                  )}
                  {errores.fecha_nacimiento && (
                    <span className="mensaje-error">{errores.fecha_nacimiento}</span>
                  )}
                </div>

                {/* Sexo */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Sexo</span>
                  </label>
                  <select
                    name="sexo"
                    value={formulario.sexo}
                    onChange={handleInputChange}
                    className={`campo-select ${errores.sexo ? 'campo-error' : ''}`}
                    disabled={enviando}
                  >
                    <option value="">Seleccionar sexo</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Femenino">Femenino</option>
                    <option value="Otro">Otro</option>
                  </select>
                  {errores.sexo && (
                    <span className="mensaje-error">{errores.sexo}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 2: INFORMACIÓN DE CONTACTO */}
            <div className="seccion-formulario">
              <h3 className="seccion-titulo">📞 Información de Contacto</h3>
              
              <div className="campos-grid">
                {/* Teléfono */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Teléfono</span>
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formulario.telefono}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.telefono ? 'campo-error' : ''}`}
                    placeholder="5512345678"
                    disabled={enviando}
                    maxLength={15}
                  />
                  {errores.telefono && (
                    <span className="mensaje-error">{errores.telefono}</span>
                  )}
                </div>

                {/* Email */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Correo Electrónico</span>
                  </label>
                  <input
                    type="email"
                    name="correo_electronico"
                    value={formulario.correo_electronico}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.correo_electronico ? 'campo-error' : ''}`}
                    placeholder="ejemplo@correo.com"
                    disabled={enviando}
                    maxLength={100}
                  />
                  {errores.correo_electronico && (
                    <span className="mensaje-error">{errores.correo_electronico}</span>
                  )}
                </div>

                {/* Dirección */}
                <div className="campo-grupo campo-full">
                  <label className="campo-label">
                    <span className="label-texto">Dirección</span>
                  </label>
                  <input
                    type="text"
                    name="calle_numero"
                    value={formulario.calle_numero}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.calle_numero ? 'campo-error' : ''}`}
                    placeholder="Calle, número, colonia, ciudad"
                    disabled={enviando}
                    maxLength={200}
                  />
                  {errores.calle_numero && (
                    <span className="mensaje-error">{errores.calle_numero}</span>
                  )}
                </div>
              </div>
            </div>

            {/* SECCIÓN 3: INFORMACIÓN DEMOGRÁFICA */}
            <div className="seccion-formulario">
              <h3 className="seccion-titulo">🌍 Información Demográfica</h3>
              
              <div className="campos-grid">
                {/* Lugar de Nacimiento */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Lugar de Nacimiento</span>
                  </label>
                  <input
                    type="text"
                    name="lugar_nacimiento"
                    value={formulario.lugar_nacimiento}
                    onChange={handleInputChange}
                    className="campo-input"
                    placeholder="Ciudad, Estado, País"
                    disabled={enviando}
                    maxLength={100}
                  />
                </div>

                {/* Lugar de Procedencia */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Lugar de Procedencia</span>
                  </label>
                  <input
                    type="text"
                    name="lugar_procedencia"
                    value={formulario.lugar_procedencia}
                    onChange={handleInputChange}
                    className="campo-input"
                    placeholder="Lugar de residencia actual"
                    disabled={enviando}
                    maxLength={100}
                  />
                </div>

                {/* Grupo Étnico */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Grupo Étnico</span>
                  </label>
                  <input
                    type="text"
                    name="grupo_etnico"
                    value={formulario.grupo_etnico}
                    onChange={handleInputChange}
                    className="campo-input"
                    placeholder="Grupo étnico (opcional)"
                    disabled={enviando}
                    maxLength={50}
                  />
                </div>

                {/* Religión */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Religión</span>
                  </label>
                  <input
                    type="text"
                    name="religion"
                    value={formulario.religion}
                    onChange={handleInputChange}
                    className="campo-input"
                    placeholder="Religión (opcional)"
                    disabled={enviando}
                    maxLength={50}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 4: INFORMACIÓN ADMINISTRATIVA */}
            <div className="seccion-formulario">
              <h3 className="seccion-titulo">📋 Información Administrativa</h3>
              
              <div className="campos-grid">
                {/* RFC */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">RFC</span>
                  </label>
                  <input
                    type="text"
                    name="rfc"
                    value={formulario.rfc}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.rfc ? 'campo-error' : ''}`}
                    placeholder="ABCD123456XXX"
                    disabled={enviando}
                    maxLength={13}
                    style={{ textTransform: 'uppercase' }}
                  />
                  {errores.rfc && (
                    <span className="mensaje-error">{errores.rfc}</span>
                  )}
                </div>

                {/* Número de Seguridad Social */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Número de Seguridad Social</span>
                  </label>
                  <input
                    type="text"
                    name="numero_seguridad_social"
                    value={formulario.numero_seguridad_social}
                    onChange={handleInputChange}
                    className={`campo-input ${errores.numero_seguridad_social ? 'campo-error' : ''}`}
                    placeholder="12345678901"
                    disabled={enviando}
                    maxLength={15}
                  />
                  {errores.numero_seguridad_social && (
                    <span className="mensaje-error">{errores.numero_seguridad_social}</span>
                  )}
                </div>

                {/* Derecho Habiente */}
                <div className="campo-grupo">
                  <label className="campo-label checkbox-label">
                    <input
                      type="checkbox"
                      name="derecho_habiente"
                      checked={formulario.derecho_habiente}
                      onChange={handleInputChange}
                      disabled={enviando}
                    />
                    <span className="label-texto">Es Derecho Habiente</span>
                  </label>
                </div>

                {/* Nombre de Institución */}
                <div className="campo-grupo">
                  <label className="campo-label">
                    <span className="label-texto">Institución Médica</span>
                  </label>
                  <input
                    type="text"
                    name="nombre_institucion"
                    value={formulario.nombre_institucion}
                    onChange={handleInputChange}
                    className="campo-input"
                    placeholder="IMSS, ISSSTE, etc."
                    disabled={enviando}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN 5: OBSERVACIONES */}
            <div className="seccion-formulario">
              <h3 className="seccion-titulo">📝 Observaciones</h3>
              
              <div className="campo-grupo">
                <label className="campo-label">
                  <span className="label-texto">Observaciones Internas</span>
                </label>
                <textarea
                  name="observaciones_internas"
                  value={formulario.observaciones_internas}
                  onChange={handleInputChange}
                  className="campo-textarea"
                  placeholder="Notas internas sobre el paciente (no visibles para el usuario)"
                  disabled={enviando}
                  rows="3"
                  maxLength={500}
                />
                <span className="campo-ayuda">
                  {formulario.observaciones_internas.length}/500 caracteres
                </span>
              </div>
            </div>
          </form>
        </div>

        {/* Footer del modal */}
        <div className="modal-editar-footer">
          <button
            type="button"
            onClick={handleClose}
            className="btn-cancelar"
            disabled={enviando}
          >
            ❌ Cancelar
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            className="btn-guardar"
            disabled={enviando}
          >
            {enviando ? (
              <>
                <span className="loading-spinner-small"></span>
                Guardando...
              </>
            ) : (
              <>
                💾 Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModalEditarPaciente;