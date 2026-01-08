import React, { useState, useCallback } from 'react';
import { buildApiUrl } from '../../../config/config.js';
import VentanaEmergente from '../VentanaEmergente';
import '../../../css/ModalRegistrarPacientes.css';

const ModalRegistrarPaciente = ({ isOpen, onClose, onPacienteCreado, onMostrarExito }) => {
  // Estados para el formulario
  const [formulario, setFormulario] = useState({
    nombre: '',
    apellido_paterno: '',
    apellido_materno: '',
    fecha_nacimiento: '',
    telefono: '',
    sexo: ''
  });

  // Estados para validación y control
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [errorGeneral, setErrorGeneral] = useState('');
  const [mostrarVentanaEmergente, setMostrarVentanaEmergente] = useState(false);

  // Función para obtener headers con autenticación
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Función para limpiar el formulario
  const limpiarFormulario = useCallback(() => {
    setFormulario({
      nombre: '',
      apellido_paterno: '',
      apellido_materno: '',
      fecha_nacimiento: '',
      telefono: '',
      sexo: ''
    });
    setErrores({});
    setErrorGeneral('');
  }, []);

  // Función para manejar cambios en los inputs
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    
    // Limpiar error específico del campo cuando el usuario empiece a escribir
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
      [name]: value
    }));
  }, [errores, errorGeneral]);

  // Función para validar el formulario
  const validarFormulario = useCallback(() => {
    const nuevosErrores = {};

    // Validar nombre (requerido)
    if (!formulario.nombre.trim()) {
      nuevosErrores.nombre = 'El nombre es obligatorio';
    } else if (formulario.nombre.trim().length < 2) {
      nuevosErrores.nombre = 'El nombre debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formulario.nombre.trim())) {
      nuevosErrores.nombre = 'El nombre solo puede contener letras y espacios';
    }

    // Validar apellido paterno (requerido)
    if (!formulario.apellido_paterno.trim()) {
      nuevosErrores.apellido_paterno = 'El apellido paterno es obligatorio';
    } else if (formulario.apellido_paterno.trim().length < 2) {
      nuevosErrores.apellido_paterno = 'El apellido paterno debe tener al menos 2 caracteres';
    } else if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formulario.apellido_paterno.trim())) {
      nuevosErrores.apellido_paterno = 'El apellido paterno solo puede contener letras y espacios';
    }

    // Validar apellido materno (opcional, pero si se proporciona debe ser válido)
    if (formulario.apellido_materno.trim() && formulario.apellido_materno.trim().length < 2) {
      nuevosErrores.apellido_materno = 'El apellido materno debe tener al menos 2 caracteres';
    } else if (formulario.apellido_materno.trim() && !/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(formulario.apellido_materno.trim())) {
      nuevosErrores.apellido_materno = 'El apellido materno solo puede contener letras y espacios';
    }

    // Validar fecha de nacimiento (opcional, pero si se proporciona debe ser válida)
    if (formulario.fecha_nacimiento) {
      const fechaNacimiento = new Date(formulario.fecha_nacimiento);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
      
      if (fechaNacimiento > hoy) {
        nuevosErrores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura';
      } else if (edad > 150) {
        nuevosErrores.fecha_nacimiento = 'Por favor, verifica la fecha de nacimiento';
      }
    }

    // Validar teléfono (requerido)
    if (!formulario.telefono.trim()) {
      nuevosErrores.telefono = 'El número telefónico es obligatorio';
    } else if (!/^\d{10}$/.test(formulario.telefono.replace(/\s/g, ''))) {
      nuevosErrores.telefono = 'El teléfono debe tener exactamente 10 dígitos';
    }

    // Validar sexo (requerido)
    if (!formulario.sexo) {
      nuevosErrores.sexo = 'El sexo es obligatorio';
    }

    return nuevosErrores;
  }, [formulario]);

  // Función de submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('📝 Iniciando registro de paciente...');
    console.log('📋 Datos del formulario:', formulario);
    
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
      const datosRegistro = {
        nombre: formulario.nombre.trim(),
        apellido_paterno: formulario.apellido_paterno.trim(),
        apellido_materno: formulario.apellido_materno.trim() || null,
        fecha_nacimiento: formulario.fecha_nacimiento || null,
        telefono: formulario.telefono.replace(/\s/g, ''), // Quitar espacios
        sexo: formulario.sexo,
        estado: 'Temporal' // Los pacientes nuevos empiezan como temporales
      };
      
      console.log('📡 Datos a enviar:', datosRegistro);
      
      const apiUrl = buildApiUrl('/pacientes');
      console.log('🔗 URL de la API:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(datosRegistro)
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        
        let errorMessage = 'Error al registrar el paciente';
        
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
          errorMessage = 'No tienes permisos para registrar pacientes';
        } else if (response.status === 409) {
          errorMessage = 'Ya existe un paciente con estos datos';
        } else if (response.status === 500) {
          errorMessage = 'Error interno del servidor. Intenta nuevamente';
        }
        
        throw new Error(errorMessage);
      }
      
      const resultado = await response.json();
      console.log('✅ Paciente registrado exitosamente:', resultado);
      
      // Limpiar formulario
      limpiarFormulario();
      
      // Llamar callback para actualizar la lista de pacientes
      if (onPacienteCreado) {
        onPacienteCreado(resultado);
      }
      
      // Cerrar modal de registro
      onClose();
      
      // Mostrar modal de éxito (manejado por el padre)
      if (onMostrarExito) {
        setTimeout(() => {
          onMostrarExito(resultado);
        }, 300); // Pequeño delay para que se cierre primero el modal
      }
      
    } catch (error) {
      console.error('❌ Error al registrar paciente:', error);
      setErrorGeneral(error.message || 'Error desconocido al registrar el paciente');
    } finally {
      setEnviando(false);
    }
  };

  // ✅ FUNCIÓN ACTUALIZADA PARA CERRAR EL MODAL
  const handleClose = useCallback(() => {
    if (enviando) {
      return; // No permitir cerrar mientras se envía
    }
    
    // Confirmar si hay datos sin guardar
    const tieneContenido = Object.values(formulario).some(valor => valor.trim() !== '');
    
    if (tieneContenido) {
      // ✅ MOSTRAR VENTANA EMERGENTE EN LUGAR DE window.confirm
      setMostrarVentanaEmergente(true);
      return;
    }
    
    // Si no hay contenido, cerrar directamente
    limpiarFormulario();
    onClose();
  }, [enviando, formulario, limpiarFormulario, onClose]);

  // ✅ FUNCIÓN PARA CONFIRMAR CIERRE CON DATOS SIN GUARDAR
  const confirmarCierre = useCallback(() => {
    console.log('✅ Usuario confirmó cerrar modal con datos sin guardar');
    limpiarFormulario();
    setMostrarVentanaEmergente(false);
    onClose();
  }, [limpiarFormulario, onClose]);

  // ✅ FUNCIÓN PARA CANCELAR CIERRE
  const cancelarCierre = useCallback(() => {
    console.log('❌ Usuario canceló cerrar modal');
    setMostrarVentanaEmergente(false);
  }, []);

  // No renderizar si el modal no está abierto
  if (!isOpen) {
    return null;
  }

  return (
    <>
      <div className="modal-registrar-overlay" onClick={handleClose}>
        <div className="modal-registrar-container" onClick={(e) => e.stopPropagation()}>
          {/* Header del modal */}
          <div className="modal-registrar-header">
            <h2 className="modal-registrar-title">
              👤 Registrar Nuevo Paciente
            </h2>
            <button
              onClick={handleClose}
              className="modal-registrar-close-btn"
              disabled={enviando}
              title="Cerrar modal"
            >
              ✕
            </button>
          </div>

          {/* Contenido del modal */}
          <div className="modal-registrar-content">
            {/* Error general */}
            {errorGeneral && (
              <div className="error-general">
                <span className="error-icon">⚠️</span>
                <span>{errorGeneral}</span>
              </div>
            )}

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="formulario-registrar">
              {/* Nombre */}
              <div className="campo-grupo">
                <label className="campo-label">
                  <span className="label-texto">Nombre *</span>
                  <span className="label-icon">👤</span>
                </label>
                <input
                  type="text"
                  name="nombre"
                  value={formulario.nombre}
                  onChange={handleInputChange}
                  className={`campo-input ${errores.nombre ? 'campo-error' : ''}`}
                  placeholder="Ingresa el nombre"
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
                  <span className="label-icon">👨‍👩‍👧‍👦</span>
                </label>
                <input
                  type="text"
                  name="apellido_paterno"
                  value={formulario.apellido_paterno}
                  onChange={handleInputChange}
                  className={`campo-input ${errores.apellido_paterno ? 'campo-error' : ''}`}
                  placeholder="Ingresa el apellido paterno"
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
                  <span className="label-icon">👨‍👩‍👧‍👦</span>
                </label>
                <input
                  type="text"
                  name="apellido_materno"
                  value={formulario.apellido_materno}
                  onChange={handleInputChange}
                  className={`campo-input ${errores.apellido_materno ? 'campo-error' : ''}`}
                  placeholder="Ingresa el apellido materno (opcional)"
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
                  <span className="label-icon">🎂</span>
                </label>
                <input
                  type="date"
                  name="fecha_nacimiento"
                  value={formulario.fecha_nacimiento}
                  onChange={handleInputChange}
                  className={`campo-input ${errores.fecha_nacimiento ? 'campo-error' : ''}`}
                  disabled={enviando}
                  max={new Date().toISOString().split('T')[0]} // No fechas futuras
                  min="1900-01-01" // No fechas muy antiguas
                />
                {errores.fecha_nacimiento && (
                  <span className="mensaje-error">{errores.fecha_nacimiento}</span>
                )}
              </div>

              {/* Número Telefónico */}
              <div className="campo-grupo">
                <label className="campo-label">
                  <span className="label-texto">Número Telefónico *</span>
                  <span className="label-icon">📞</span>
                </label>
                <input
                  type="tel"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={handleInputChange}
                  className={`campo-input ${errores.telefono ? 'campo-error' : ''}`}
                  placeholder="Ej: 5512345678"
                  disabled={enviando}
                  maxLength={15}
                />
                {errores.telefono && (
                  <span className="mensaje-error">{errores.telefono}</span>
                )}
                <span className="campo-ayuda">Ingresa 10 dígitos sin espacios</span>
              </div>

              {/* Sexo */}
              <div className="campo-grupo">
                <label className="campo-label">
                  <span className="label-texto">Sexo *</span>
                  <span className="label-icon">⚧️</span>
                </label>
                <select
                  name="sexo"
                  value={formulario.sexo}
                  onChange={handleInputChange}
                  className={`campo-select ${errores.sexo ? 'campo-error' : ''}`}
                  disabled={enviando}
                >
                  <option value="">Selecciona el sexo</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Femenino">Femenino</option>
                  <option value="Otro">Otro</option>
                </select>
                {errores.sexo && (
                  <span className="mensaje-error">{errores.sexo}</span>
                )}
              </div>

              {/* Información adicional */}
              <div className="info-temporal">
                <span className="info-icon">ℹ️</span>
                <span className="info-texto">
                  El paciente será registrado como <strong>temporal</strong> inicialmente. 
                  Podrás convertirlo a permanente desde la lista de pacientes.
                </span>
              </div>
            </form>
          </div>

          {/* Footer del modal */}
          <div className="modal-registrar-footer">
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
              className="btn-registrar"
              disabled={enviando}
            >
              {enviando ? (
                <>
                  <span className="loading-spinner-small"></span>
                  Registrando...
                </>
              ) : (
                <>
                  💾 Registrar Paciente
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ✅ VENTANA EMERGENTE PARA CONFIRMAR CIERRE CON DATOS */}
      <VentanaEmergente
        isOpen={mostrarVentanaEmergente}
        onClose={cancelarCierre}
        onConfirm={confirmarCierre}
        titulo="¿Cerrar sin guardar?"
        mensaje="Tienes datos sin guardar. Si cierras ahora, se perderán todos los cambios."
        textoConfirmar="Sí, cerrar"
        textoCancelar="Continuar editando"
        tipo="warning"
        autoClose={false}
      />
    </>
  );
};

export default ModalRegistrarPaciente;