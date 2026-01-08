import React, { useState, useEffect } from 'react';
import '../css/PanelPrincipal.css';

const AgendarCitasSidebar = ({ isOpen, onClose, onCitaCreated }) => {
  const [formData, setFormData] = useState({
    busqueda_paciente: '',
    paciente_seleccionado: null,
    nombre: '',
    apellido_paterno: '',
    edad: '',
    telefono: '',
    tipo_consulta_id: '',
    fecha_consulta: '',
    horario_consulta: '',
    doctor_id: '',
    observaciones: '',
    precio: ''
  });

  const [pacientesEncontrados, setPacientesEncontrados] = useState([]);
  const [mostrarResultados, setMostrarResultados] = useState(false);
  const [doctores, setDoctores] = useState([]);
  const [tiposConsulta, setTiposConsulta] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingTipos, setLoadingTipos] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [esTemporal, setEsTemporal] = useState(false);
  
  // Estados para horarios dinámicos
  const [horariosOcupados, setHorariosOcupados] = useState([]);
  const [citasDelDia, setCitasDelDia] = useState([]);
  
  // 🆕 NUEVO: Estado para horarios disponibles desde BD
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);
  const [loadingHorariosTrabajo, setLoadingHorariosTrabajo] = useState(true);

  // ✅ FUNCIÓN AUXILIAR PARA OBTENER FECHA ACTUAL CORRECTA
  const obtenerFechaHoy = () => {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = String(hoy.getMonth() + 1).padStart(2, '0');
    const dia = String(hoy.getDate()).padStart(2, '0');
    return `${año}-${mes}-${dia}`;
  };

  // 🆕 CARGAR HORARIOS DE TRABAJO DESDE BD
  const cargarHorariosTrabajo = async () => {
    try {
      setLoadingHorariosTrabajo(true);
      console.log('⏰ [AGENDAR] Cargando horarios de trabajo desde BD...');
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/citas/horarios/trabajo', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ [AGENDAR] Horarios de trabajo recibidos:', data);
        
        setHorariosDisponibles(data.horarios || []);
        
        if (data.horarios && data.horarios.length > 0) {
          console.log(`📅 [AGENDAR] ${data.horarios.length} horarios cargados desde ${data.horarios[0]} hasta ${data.horarios[data.horarios.length - 1]}`);
        }
      } else {
        console.error('❌ [AGENDAR] Error al cargar horarios de trabajo:', response.status);
        // Fallback con horarios extendidos desde 8:30
        setHorariosDisponibles([
          '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
          '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
          '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
          '19:00', '19:30', '20:00'
        ]);
      }
    } catch (error) {
      console.error('❌ [AGENDAR] Error de conexión al cargar horarios:', error);
      // Fallback
      setHorariosDisponibles([
        '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
        '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
        '19:00', '19:30', '20:00'
      ]);
    } finally {
      setLoadingHorariosTrabajo(false);
    }
  };

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      cargarDoctores();
      cargarTiposConsulta();
      cargarHorariosTrabajo(); // 🆕 CARGAR HORARIOS DE TRABAJO
      resetForm();
    }
  }, [isOpen]);

  // Efecto para cargar horarios ocupados cuando cambie la fecha o doctor
  useEffect(() => {
    if (formData.fecha_consulta && formData.doctor_id) {
      cargarHorariosOcupados(formData.fecha_consulta, formData.doctor_id);
    } else {
      setHorariosOcupados([]);
      setCitasDelDia([]);
    }
  }, [formData.fecha_consulta, formData.doctor_id]);

  const resetForm = () => {
    setFormData({
      busqueda_paciente: '',
      paciente_seleccionado: null,
      nombre: '',
      apellido_paterno: '',
      edad: '',
      telefono: '',
      tipo_consulta_id: '',
      fecha_consulta: obtenerFechaHoy(),
      horario_consulta: '',
      doctor_id: '',
      observaciones: '',
      precio: ''
    });
    setPacientesEncontrados([]);
    setMostrarResultados(false);
    setEsTemporal(false);
    setError('');
    setSuccess('');
    setHorariosOcupados([]);
    setCitasDelDia([]);
  };

  // Función para cargar horarios ocupados
  const cargarHorariosOcupados = async (fecha, doctorId) => {
    try {
      setLoadingHorarios(true);
      const token = localStorage.getItem('token');
            
      const response = await fetch(`/api/citas/fecha/${fecha}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        let citas = result.data || result || [];
        
        const citasDelDoctor = citas.filter(cita => {
          const citaDoctorId = cita.doctor_id?.toString();
          const doctorSeleccionado = doctorId?.toString();
          return citaDoctorId === doctorSeleccionado;
        });
                
        const horariosOcupadosArray = citasDelDoctor.map(cita => {
          let horario = cita.hora_cita || cita.horario_consulta;
          
          if (horario && horario.length > 5) {
            horario = horario.substring(0, 5);
          }
                    
          return horario;
        }).filter(Boolean);
                
        setHorariosOcupados(horariosOcupadosArray);
        setCitasDelDia(citasDelDoctor);
      } else {
        console.error('❌ Error al consultar horarios:', response.status);
        setHorariosOcupados([]);
        setCitasDelDia([]);
      }
    } catch (error) {
      console.error('❌ Error al cargar horarios ocupados:', error);
      setHorariosOcupados([]);
      setCitasDelDia([]);
    } finally {
      setLoadingHorarios(false);
    }
  };

  const isHorarioOcupado = (horario) => {
    const ocupado = horariosOcupados.includes(horario);
    return ocupado;
  };

  const getInfoCitaEnHorario = (horario) => {
    const cita = citasDelDia.find(c => c.hora_cita === horario);
    if (cita) {
      return `Ocupado: ${cita.paciente_nombre_completo || cita.nombre_paciente || 'Paciente'} - ${cita.tipo_consulta_nombre || cita.tipo_consulta || 'Consulta'}`;
    }
    return '';
  };

  const cargarDoctores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/usuarios/doctores', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDoctores(data);
      } else {
        console.error('Error al cargar doctores');
      }
    } catch (error) {
      console.error('Error al cargar doctores:', error);
    }
  };

  const cargarTiposConsulta = async () => {
    try {
      setLoadingTipos(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('/api/tipos-consulta', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        setTiposConsulta(result.data || []);
      } else {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
      }
    } catch (error) {
      console.error('❌ Error fetch:', error);
    } finally {
      setLoadingTipos(false);
    }
  };

  // Buscar pacientes
  const buscarPacientes = async (termino) => {
    if (!termino || termino.length < 2) {
      setPacientesEncontrados([]);
      setMostrarResultados(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/pacientes/buscar?q=${encodeURIComponent(termino)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPacientesEncontrados(data);
        setMostrarResultados(true);
      } else {
        setPacientesEncontrados([]);
        setMostrarResultados(false);
      }
    } catch (error) {
      console.error('Error al buscar pacientes:', error);
      setPacientesEncontrados([]);
      setMostrarResultados(false);
    }
  };

  // Calcular edad desde fecha de nacimiento
  const calcularEdadDesdeFecha = (fechaNacimiento) => {
    if (!fechaNacimiento || fechaNacimiento === '1900-01-01') return '';
    
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad > 0 ? edad.toString() : '';
  };

  // Manejar cambio en búsqueda
  const handleBusquedaChange = (e) => {
    const valor = e.target.value;
    setFormData(prev => ({
      ...prev,
      busqueda_paciente: valor,
      paciente_seleccionado: null,
      nombre: '',
      apellido_paterno: '',
      edad: '',
      telefono: ''
    }));
    
    buscarPacientes(valor);
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Seleccionar paciente existente
  const seleccionarPaciente = (paciente) => {
    const edadCalculada = calcularEdadDesdeFecha(paciente.fecha_nacimiento);
    
    setFormData(prev => ({
      ...prev,
      busqueda_paciente: `${paciente.nombre} ${paciente.apellido_paterno} ${paciente.apellido_materno || ''}`.trim(),
      paciente_seleccionado: paciente,
      nombre: paciente.nombre,
      apellido_paterno: paciente.apellido_paterno,
      edad: edadCalculada,
      telefono: paciente.telefono || ''
    }));
    setMostrarResultados(false);
    setEsTemporal(false);
  };

  // Crear nuevo paciente (temporal)
  const crearNuevoPaciente = () => {
    const termino = formData.busqueda_paciente.trim();
    
    const palabras = termino.split(' ');
    let nombre = '';
    let apellido = '';
    
    if (palabras.length >= 2) {
      nombre = palabras[0];
      apellido = palabras.slice(1).join(' ');
    } else if (palabras.length === 1) {
      nombre = palabras[0];
    }

    setFormData(prev => ({
      ...prev,
      paciente_seleccionado: null,
      nombre: nombre,
      apellido_paterno: apellido,
      edad: '',
      telefono: ''
    }));
    setMostrarResultados(false);
    setEsTemporal(true);
  };

  // Manejar checkbox temporal
  const handleTemporalChange = (e) => {
    const checked = e.target.checked;
    setEsTemporal(checked);
    
    if (!checked) {
      setFormData(prev => ({
        ...prev,
        paciente_seleccionado: null,
        nombre: '',
        apellido_paterno: '',
        edad: '',
        telefono: ''
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'edad') {
      if (value === '' || (/^\d{1,3}$/.test(value) && parseInt(value) <= 150)) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  // Manejar cambio de tipo de consulta
  const handleTipoConsultaChange = (e) => {
    const tipoId = e.target.value;
    setFormData(prev => ({ ...prev, tipo_consulta_id: tipoId }));
    
    if (tipoId === 'personalizada') {
      setFormData(prev => ({ 
        ...prev, 
        tipo_consulta_id: tipoId,
        precio: ''
      }));
    } else if (tipoId) {
      const tipoSeleccionado = tiposConsulta.find(tipo => tipo.id.toString() === tipoId);
      if (tipoSeleccionado) {
        setFormData(prev => ({ 
          ...prev, 
          tipo_consulta_id: tipoId,
          precio: tipoSeleccionado.precio 
        }));
      }
    } else {
      setFormData(prev => ({ ...prev, precio: '' }));
    }
    
    if (error) setError('');
    if (success) setSuccess('');
  };

  // ✅ FUNCIÓN ACTUALIZADA PARA USAR HORARIOS DINÁMICOS
  const getHorariosDisponiblesParaFecha = () => {
    const fechaSeleccionada = formData.fecha_consulta;
    if (!fechaSeleccionada) return horariosDisponibles;
    
    const hoyString = obtenerFechaHoy();
    
    console.log('🔍 DEBUG - Horarios dinámicos:');
    console.log('Hoy (LOCAL):', hoyString);
    console.log('Fecha seleccionada:', fechaSeleccionada);
    console.log('Horarios base desde BD:', horariosDisponibles.length);
    console.log('Primer horario:', horariosDisponibles[0]);
    console.log('Último horario:', horariosDisponibles[horariosDisponibles.length - 1]);
    
    // Si es el mismo día, filtrar horarios que ya pasaron
    if (fechaSeleccionada === hoyString) {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutosActuales = ahora.getMinutes();
      
      console.log('⏰ ES EL MISMO DÍA - Filtrando horarios pasados');
      console.log('Hora actual:', `${horaActual}:${String(minutosActuales).padStart(2, '0')}`);
      
      const horariosFiltrados = horariosDisponibles.filter(horario => {
        const [hora, minutos] = horario.split(':').map(Number);
        const horarioEnMinutos = (hora * 60) + minutos;
        const ahoraEnMinutos = (horaActual * 60) + minutosActuales;
        
        const disponible = horarioEnMinutos > ahoraEnMinutos;
        console.log(`Horario ${horario}: ${disponible ? 'DISPONIBLE' : 'PASADO'} (${horarioEnMinutos} > ${ahoraEnMinutos})`);
        
        return disponible;
      });
      
      console.log('Horarios filtrados para hoy:', horariosFiltrados.length);
      return horariosFiltrados;
    }
    
    console.log('📅 ES DÍA FUTURO - Mostrando TODOS los horarios disponibles');
    return horariosDisponibles;
  };

  const validarFormulario = () => {
    if (!formData.nombre.trim()) {
      setError('El nombre es requerido');
      return false;
    }

    if (!formData.apellido_paterno.trim()) {
      setError('El apellido paterno es requerido');
      return false;
    }

    if (!formData.edad || parseInt(formData.edad) < 1 || parseInt(formData.edad) > 150) {
      setError('La edad debe ser un número válido entre 1 y 150 años');
      return false;
    }

    if (!formData.tipo_consulta_id) {
      setError('El tipo de consulta es requerido');
      return false;
    }
    
    if (!formData.fecha_consulta) {
      setError('La fecha de consulta es requerida');
      return false;
    }
    
    if (!formData.horario_consulta) {
      setError('El horario de consulta es requerido');
      return false;
    }
    
    if (!formData.doctor_id) {
      setError('Debe seleccionar un doctor');
      return false;
    }

    const hoyString = obtenerFechaHoy();
    const fechaSeleccionada = formData.fecha_consulta;
    
    if (fechaSeleccionada < hoyString) {
      setError('La fecha de la cita no puede ser anterior a hoy');
      return false;
    }
    
    if (fechaSeleccionada === hoyString) {
      const ahora = new Date();
      const horaActual = ahora.getHours();
      const minutosActuales = ahora.getMinutes();
      const minutosActualesTotal = (horaActual * 60) + minutosActuales;
      
      const limiteCitasMismoDia = 1170; // 7:30 PM
      
      if (minutosActualesTotal >= limiteCitasMismoDia) {
        setError('⏰ Ya no es posible agendar citas para hoy después de las 7:30 PM');
        return false;
      }
      
      const [horaSeleccionada, minutosSeleccionados] = formData.horario_consulta.split(':').map(Number);
      const minutosSeleccionadosTotal = (horaSeleccionada * 60) + minutosSeleccionados;
      
      if (minutosSeleccionadosTotal <= minutosActualesTotal) {
        setError('⏰ La hora seleccionada ya ha pasado. Seleccione una hora futura.');
        return false;
      }
    }

    // ✅ VALIDACIÓN ACTUALIZADA PARA HORARIOS DINÁMICOS
    if (horariosDisponibles.length > 0) {
      const hora = formData.horario_consulta;
      const primerHorario = horariosDisponibles[0];
      const ultimoHorario = horariosDisponibles[horariosDisponibles.length - 1];
      
      if (hora < primerHorario || hora > ultimoHorario) {
        setError(`El horario debe ser entre ${primerHorario} y ${ultimoHorario}`);
        return false;
      }
    }

    if (isHorarioOcupado(formData.horario_consulta)) {
      setError('⚠️ El horario seleccionado ya está ocupado');
      return false;
    }

    console.log('✅ TODAS LAS VALIDACIONES PASARON');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const tipoSeleccionado = tiposConsulta.find(tipo => tipo.id.toString() === formData.tipo_consulta_id);
      const doctorSeleccionado = doctores.find(doctor => doctor.id.toString() === formData.doctor_id);
      
      const dataToSend = {
        paciente_id: formData.paciente_seleccionado ? formData.paciente_seleccionado.id : '',
        nombre_paciente: `${formData.nombre} ${formData.apellido_paterno}`.trim(),
        edad_paciente: parseInt(formData.edad),
        telefono_temporal: formData.telefono,
        tipo_consulta: formData.tipo_consulta_id === 'personalizada' 
          ? 'Consulta Personalizada' 
          : tipoSeleccionado?.nombre || '',
        tipo_consulta_id: formData.tipo_consulta_id === 'personalizada' 
          ? null 
          : formData.tipo_consulta_id,
        fecha_consulta: formData.fecha_consulta,
        horario_consulta: formData.horario_consulta,
        doctor_id: formData.doctor_id,
        observaciones: formData.observaciones,
        precio: parseFloat(formData.precio) || 0,
        es_temporal: esTemporal || !formData.paciente_seleccionado
      };

      const response = await fetch('/api/citas', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dataToSend)
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Cita agendada exitosamente');
        
        const citaDataParaModal = {
          pacienteNombre: `${formData.nombre} ${formData.apellido_paterno}`.trim(),
          fecha: formData.fecha_consulta,
          hora: formData.horario_consulta,
          tipoConsulta: formData.tipo_consulta_id === 'personalizada' 
            ? 'Consulta Personalizada' 
            : tipoSeleccionado?.nombre || 'Consulta',
          doctor: doctorSeleccionado 
            ? `Dr. ${doctorSeleccionado.nombre} ${doctorSeleccionado.apellido_paterno}`
            : 'Doctor asignado',
          precio: formData.precio
        };

        if (onCitaCreated) {
          onCitaCreated(citaDataParaModal);
        }

        resetForm();
        onClose();

      } else {
        setError(result.message || 'Error al agendar la cita');
      }

    } catch (error) {
      console.error('❌ Error al agendar cita:', error);
      setError('Error de conexión al agendar la cita');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(price);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="agendar-citas-sidebar-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div 
        className="agendar-citas-sidebar-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Moderno */}
        <div className="agendar-citas-header">
          <h2 className="agendar-citas-title">
            <span>📅</span>
            <span>Agendar Nueva Cita</span>
          </h2>
          <button
            onClick={onClose}
            className="agendar-citas-close-btn"
            type="button"
            title="Cerrar"
          >
            ✕
          </button>
        </div>

        {/* ✅ MOSTRAR INFO DE HORARIOS CARGADOS */}
        {!loadingHorariosTrabajo && horariosDisponibles.length > 0 && (
          <div style={{
            background: 'linear-gradient(135deg, #06D6A0 0%, #87CEEB 100%)',
            color: 'white',
            padding: '8px 16px',
            margin: '8px 16px',
            borderRadius: '6px',
            fontSize: '12px',
            textAlign: 'center'
          }}>
            ⏰ Horarios disponibles: {horariosDisponibles[0]} - {horariosDisponibles[horariosDisponibles.length - 1]}
          </div>
        )}

        {/* Contenido */}
        <div className="agendar-citas-content">
          {/* Mensajes de estado */}
          {error && (
            <div className="agendar-citas-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="agendar-citas-success">
              <span>✅</span>
              <span>{success}</span>
            </div>
          )}

          {/* ✅ MOSTRAR MENSAJE DE CARGA INICIAL */}
          {loadingHorariosTrabajo && (
            <div style={{
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              color: '#0369a1',
              padding: '12px',
              margin: '8px 0',
              borderRadius: '6px',
              textAlign: 'center'
            }}>
              🔄 Cargando configuración de horarios...
            </div>
          )}

          <form onSubmit={handleSubmit} className="agendar-citas-form">
            
            {/* 🔍 Búsqueda/Creación de Paciente */}
            <div className="form-group">
              <label className="field-label">
                <span>🔍</span>
                <span>Buscar Paciente o Crear Nuevo</span>
              </label>
              <input
                type="text"
                name="busqueda_paciente"
                value={formData.busqueda_paciente}
                onChange={handleBusquedaChange}
                className="form-control"
                placeholder="Escriba nombre, apellido o matrícula del paciente..."
                autoComplete="off"
              />
              
              {/* Resultados de búsqueda */}
              {mostrarResultados && pacientesEncontrados.length > 0 && (
                <div className="search-results-container">
                  {pacientesEncontrados.map(paciente => (
                    <div
                      key={paciente.id}
                      onClick={() => seleccionarPaciente(paciente)}
                      className="search-result-item"
                    >
                      <div className="search-result-name">
                        {paciente.nombre} {paciente.apellido_paterno} {paciente.apellido_materno || ''}
                      </div>
                      <div className="search-result-details">
                        <span>📋 {paciente.matricula || `ID: ${paciente.id}`}</span>
                        <span>📞 {paciente.telefono || 'Sin teléfono'}</span>
                        <span>🎂 {calcularEdadDesdeFecha(paciente.fecha_nacimiento) || 'Sin edad'} años</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Opción para crear nuevo */}
              {formData.busqueda_paciente.length >= 2 && mostrarResultados && (
                <div className="search-results-container" style={{ borderTop: pacientesEncontrados.length > 0 ? '1px solid #e5e7eb' : 'none' }}>
                  <div
                    onClick={crearNuevoPaciente}
                    className="create-new-patient"
                  >
                    ➕ Crear nuevo paciente: "{formData.busqueda_paciente}"
                  </div>
                </div>
              )}
            </div>

            {/* ✅ Checkbox Temporal */}
            <label className="agendar-checkbox-label">
              <input
                type="checkbox"
                checked={esTemporal}
                onChange={handleTemporalChange}
              />
              <span>
                <strong>⏱️ Crear paciente temporal (24h)</strong>
              </span>
            </label>
            
            {esTemporal && (
              <div className="agendar-warning">
                <span>⚠️</span>
                <span>Este paciente será temporal y se eliminará automáticamente en 24 horas.</span>
              </div>
            )}

            {/* 📝 Datos del Paciente */}
            {(esTemporal || formData.nombre || formData.apellido_paterno) && (
              <div className="agendar-temporal-section">
                <div className="form-group">
                  <label className="field-label">
                    <span>👤</span>
                    <span>Nombre *</span>
                  </label>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="field-label">
                    <span>👤</span>
                    <span>Apellido Paterno *</span>
                  </label>
                  <input
                    type="text"
                    name="apellido_paterno"
                    value={formData.apellido_paterno}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Ej: Pérez"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="field-label">
                    <span>🎂</span>
                    <span>Edad (años) *</span>
                  </label>
                  <input
                    type="number"
                    name="edad"
                    value={formData.edad}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Ej: 25"
                    min="1"
                    max="150"
                    required
                  />
                  {formData.edad && (parseInt(formData.edad) < 1 || parseInt(formData.edad) > 150) && (
                    <div className="age-validation-error">
                      <span>⚠️</span>
                      <span>La edad debe estar entre 1 y 150 años</span>
                    </div>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="field-label">
                    <span>📞</span>
                    <span>Teléfono (Opcional)</span>
                  </label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Ej: 5551234567"
                  />
                </div>
              </div>
            )}

            {/* Tipo de Consulta */}
            <div className="form-group">
              <label className="field-label">
                <span>📋</span>
                <span>Tipo de Consulta *</span>
              </label>
              {loadingTipos ? (
                <div className="loading-text">
                  <span>🔄</span>
                  <span>Cargando tipos de consulta...</span>
                </div>
              ) : (
                <select
                  name="tipo_consulta_id"
                  value={formData.tipo_consulta_id}
                  onChange={handleTipoConsultaChange}
                  className="form-control"
                  required
                >
                  <option value="">Seleccionar tipo de consulta...</option>
                  {tiposConsulta.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} - {formatPrice(tipo.precio)}
                    </option>
                  ))}
                  <option value="personalizada">
                    💰 Consulta Personalizada (Precio por definir)
                  </option>
                </select>
              )}
              
              {/* Información del precio */}
              {formData.tipo_consulta_id && formData.tipo_consulta_id !== 'personalizada' && tiposConsulta.length > 0 && (
                (() => {
                  const tipoSeleccionado = tiposConsulta.find(tipo => tipo.id.toString() === formData.tipo_consulta_id);
                  return tipoSeleccionado ? (
                    <div className="price-info-card">
                      <div className="price-info-price">
                        <span>💰</span>
                        <span>Precio: {formatPrice(tipoSeleccionado.precio)}</span>
                      </div>
                      {tipoSeleccionado.descripcion && (
                        <div className="price-info-description">
                          📝 {tipoSeleccionado.descripcion}
                        </div>
                      )}
                    </div>
                  ) : null;
                })()
              )}
              
              {formData.tipo_consulta_id === 'personalizada' && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: 'linear-gradient(135deg, #06D6A0 0%, #87CEEB 100%)',
                  color: 'white',
                  borderRadius: '6px',
                  fontSize: '13px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                    <span>💰</span>
                    <strong>Consulta Personalizada</strong>
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>
                    El doctor establecerá el precio según el tipo de tratamiento requerido.
                  </div>
                </div>
              )}
            </div>

           {/* Fecha */}
            <div className="form-group">
              <label className="field-label">
                <span>📅</span>
                <span>Fecha de la Cita *</span>
              </label>
              <input
                type="date"
                name="fecha_consulta"
                value={formData.fecha_consulta}
                onChange={handleInputChange}
                min={obtenerFechaHoy()}
                className="form-control"
                required
              />
            </div>

            {/* Doctor */}
            <div className="form-group">
              <label className="field-label">
                <span>👨‍⚕️</span>
                <span>Doctor *</span>
              </label>
              <select
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleInputChange}
                className="form-control"
                required
              >
                <option value="">Seleccionar doctor...</option>
                {doctores.map(doctor => (
                  <option key={doctor.id} value={doctor.id}>
                    Dr. {doctor.nombre} {doctor.apellido_paterno}
                  </option>
                ))}
              </select>
            </div>

            {/* ✅ HORARIO ACTUALIZADO CON HORARIOS DINÁMICOS */}
            <div className="form-group">
              <label className="field-label">
                <span>🕐</span>
                <span>Horario *</span>
                {loadingHorarios && <span style={{ color: '#06D6A0', fontSize: '12px' }}> (Consultando disponibilidad...)</span>}
                {loadingHorariosTrabajo && <span style={{ color: '#f59e0b', fontSize: '12px' }}> (Cargando horarios...)</span>}
              </label>
              
              {loadingHorariosTrabajo ? (
                <div style={{
                  padding: '12px',
                  background: '#fef3c7',
                  borderRadius: '8px',
                  color: '#92400e',
                  textAlign: 'center',
                  border: '2px solid #fbbf24'
                }}>
                  🔄 Cargando configuración de horarios desde base de datos...
                </div>
              ) : !formData.fecha_consulta || !formData.doctor_id ? (
                <div style={{
                  padding: '12px',
                  background: '#f3f4f6',
                  borderRadius: '8px',
                  color: '#6b7280',
                  textAlign: 'center',
                  border: '2px dashed #d1d5db'
                }}>
                  Seleccione fecha y doctor primero
                </div>
              ) : loadingHorarios ? (
                <div style={{
                  padding: '12px',
                  background: '#f0f9ff',
                  borderRadius: '8px',
                  color: '#0369a1',
                  textAlign: 'center',
                  border: '2px solid #bae6fd'
                }}>
                  🔄 Consultando disponibilidad...
                </div>
              ) : (
                <>
                  {/* Grid de botones de horarios */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                    gap: '8px',
                    marginTop: '8px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    padding: '8px',
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {getHorariosDisponiblesParaFecha().map(hora => {
                      const ocupado = isHorarioOcupado(hora);
                      const seleccionado = formData.horario_consulta === hora;
                      
                      const hoyString = obtenerFechaHoy();
                      const esHoy = formData.fecha_consulta === hoyString;
                      
                      let yaPaso = false;
                      if (esHoy) {
                        const ahora = new Date();
                        const [horaHorario, minutosHorario] = hora.split(':').map(Number);
                        const horarioEnMinutos = (horaHorario * 60) + minutosHorario;
                        const ahoraEnMinutos = (ahora.getHours() * 60) + ahora.getMinutes();
                        yaPaso = horarioEnMinutos <= ahoraEnMinutos;
                      }
                      
                      const disponible = !ocupado && !yaPaso;
                      
                      let backgroundColor, color, borderColor, icon, titulo;
                      
                      if (yaPaso) {
                        backgroundColor = '#fef3c7';
                        color = '#92400e';
                        borderColor = '#fbbf24';
                        icon = '⌛';
                        titulo = `Ya pasó: ${hora}`;
                      } else if (ocupado) {
                        backgroundColor = '#fee2e2';
                        color = '#dc2626';
                        borderColor = '#f87171';
                        icon = '❌';
                        titulo = `Ocupado: ${getInfoCitaEnHorario(hora)}`;
                      } else if (seleccionado) {
                        backgroundColor = '#06D6A0';
                        color = 'white';
                        borderColor = '#06D6A0';
                        icon = '✅';
                        titulo = `Seleccionado: ${hora}`;
                      } else {
                        backgroundColor = 'white';
                        color = '#1E3A8A';
                        borderColor = '#e2e8f0';
                        icon = '⏰';
                        titulo = `Disponible: ${hora}`;
                      }
                      
                      return (
                        <button
                          key={hora}
                          type="button"
                          disabled={!disponible}
                          onClick={() => {
                            if (disponible) {
                              setFormData(prev => ({ ...prev, horario_consulta: hora }));
                              if (error) setError('');
                            }
                          }}
                          style={{
                            padding: '8px 4px',
                            border: seleccionado ? '2px solid #06D6A0' : `1px solid ${borderColor}`,
                            borderRadius: '6px',
                            backgroundColor,
                            color,
                            fontSize: '12px',
                            fontWeight: seleccionado ? '700' : '500',
                            cursor: disponible ? 'pointer' : 'not-allowed',
                            transition: 'all 0.2s ease',
                            opacity: disponible ? 1 : 0.6,
                            textAlign: 'center',
                            fontFamily: 'Monaco, Menlo, monospace'
                          }}
                          title={titulo}
                        >
                          <div style={{ fontSize: '10px' }}>{icon}</div>
                          <div>{hora}</div>
                          {yaPaso && <div style={{ fontSize: '8px' }}>Pasado</div>}
                        </button>
                      );
                    })}
                  </div>
                  
                  {/* Horario seleccionado */}
                  {formData.horario_consulta && (
                    <div style={{
                      marginTop: '8px',
                      padding: '8px 12px',
                      background: 'linear-gradient(135deg, #06D6A0 0%, #87CEEB 100%)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textAlign: 'center'
                    }}>
                      ✅ Horario seleccionado: {formData.horario_consulta}
                    </div>
                  )}
                  
                  <input
                    type="hidden"
                    name="horario_consulta"
                    value={formData.horario_consulta}
                    required
                  />
                </>
              )}
              
              {/* Mostrar mensaje si no hay horarios disponibles */}
              {!loadingHorariosTrabajo && !loadingHorarios && formData.fecha_consulta && formData.doctor_id && 
               getHorariosDisponiblesParaFecha().length === 0 && (
                <div style={{
                  marginTop: '8px',
                  padding: '10px',
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.3)',
                  borderRadius: '6px',
                  color: '#a16207',
                  fontSize: '12px',
                  textAlign: 'center'
                }}>
                  <span>⏰</span>
                  <strong> No hay horarios disponibles.</strong>
                  <br />
                  Por favor seleccione otra fecha.
                </div>
              )}
            </div>

            {/* Precio */}
            <div className="form-group">
              <label className="field-label">
                <span>💰</span>
                <span>Precio {formData.tipo_consulta_id === 'personalizada' ? '*' : ''}</span>
                {formData.tipo_consulta_id !== 'personalizada' && formData.tipo_consulta_id && (
                  <span style={{ fontSize: '11px', color: '#6b7280', fontWeight: 'normal' }}>
                    (Precio automático del catálogo)
                  </span>
                )}
              </label>
              <input
                type="number"
                name="precio"
                value={formData.precio}
                onChange={handleInputChange}
                min="0"
                step="0.01"
                className="form-control"
                placeholder={formData.tipo_consulta_id === 'personalizada' ? 'Establecer precio...' : '0.00'}
                required={formData.tipo_consulta_id === 'personalizada'}
                disabled={formData.tipo_consulta_id !== 'personalizada' && formData.tipo_consulta_id !== ''}
                style={{
                  backgroundColor: formData.tipo_consulta_id === 'personalizada' 
                    ? 'white' 
                    : formData.tipo_consulta_id 
                      ? '#f3f4f6' 
                      : 'white',
                  color: formData.tipo_consulta_id === 'personalizada' 
                    ? 'inherit' 
                    : formData.tipo_consulta_id 
                      ? '#6b7280' 
                      : 'inherit',
                  borderColor: formData.tipo_consulta_id === 'personalizada' 
                    ? '#06D6A0' 
                    : undefined
                }}
              />
              
              {formData.tipo_consulta_id === 'personalizada' && (
                <div style={{
                  marginTop: '4px',
                  fontSize: '11px',
                  color: '#06D6A0',
                  fontStyle: 'italic'
                }}>
                  💡 Ingrese el precio según el diagnóstico y tratamiento necesario
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="form-group">
              <label className="field-label">
                <span>📝</span>
                <span>Observaciones</span>
              </label>
              <textarea
                name="observaciones"
                value={formData.observaciones}
                onChange={handleInputChange}
                rows="3"
                className="form-control"
                placeholder="Observaciones adicionales..."
              />
            </div>

            {/* Botones */}
            <div className="agendar-citas-buttons">
              <button
                type="button"
                onClick={onClose}
                className="btn-cancel-agendar"
                disabled={loading}
              >
                <span>❌</span>
                <span>Cancelar</span>
              </button>
              <button
                type="submit"
                className="btn-submit-agendar"
                disabled={loading || loadingTipos || loadingHorarios || loadingHorariosTrabajo ||
                         (formData.fecha_consulta && formData.doctor_id && 
                          getHorariosDisponiblesParaFecha().length === 0)}
              >
                {loading ? (
                  <>
                    <span>⏳</span>
                    <span>Agendando...</span>
                  </>
                ) : (
                  <>
                    <span>📅</span>
                    <span>Agendar Cita</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AgendarCitasSidebar;