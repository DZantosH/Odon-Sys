import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/config.js';
import { useAuth } from '../services/AuthContext';
import Sidebar from '../components/Sidebar'; // ✅ NUEVO: Importar Sidebar
import ModalEditarPaciente from '../components/modals/pacientes/ModalEditarPaciente';
import ModalRegistrarPaciente from '../components/modals/pacientes/ModalRegistrarPaciente';
import { ConfirmModal, PacienteConvertidoSuccessModal } from '../components/modals/ModalSystem';
import { PacienteRegistradoModal } from '../components/modals/AlertaSystem';
import '../css/Pacientes.css';
import '../css/SidebarModerno.css'; // ✅ NUEVO: Estilos del Layout

const Pacientes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // --- ESTADOS DE DATOS ---
  const [pacientes, setPacientes] = useState([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [ordenPor, setOrdenPor] = useState('nombre');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // --- ESTADO SIDEBAR MÓVIL ---
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // --- ESTADOS MODALES ---
  const [modalEditarOpen, setModalEditarOpen] = useState(false);
  const [modalRegistrarOpen, setModalRegistrarOpen] = useState(false);
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [accionEnProceso, setAccionEnProceso] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [pacienteParaConvertir, setPacienteParaConvertir] = useState(null);
  
  // Modales de Éxito
  const [modalExito, setModalExito] = useState({ isOpen: false, pacienteData: {} });
  const [modalConversionExito, setModalConversionExito] = useState({ isOpen: false, pacienteData: {} });

  // --- LÓGICA SIDEBAR ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  
  // Handlers del Sidebar
  const handleAgendarCita = () => navigate('/dashboard'); 
  const handleAbrirPanelControl = () => window.open('/hk/', '_blank');

  // --- HELPERS ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const handleMostrarExito = (pacienteData) => setModalExito({ isOpen: true, pacienteData });
  const handleCerrarExito = () => setModalExito({ isOpen: false, pacienteData: {} });

  const calcularEdad = useCallback((fechaNacimiento) => {
    if (!fechaNacimiento || fechaNacimiento === '1900-01-01') return 'N/A';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) { edad--; }
    return edad > 0 ? edad : 'N/A';
  }, []);

  // --- CARGA DE DATOS ---
  const cargarPacientes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const apiUrl = buildApiUrl('/pacientes');
      const response = await fetch(apiUrl, { headers: getAuthHeaders() });
      
      if (!response.ok) throw new Error('Error al cargar pacientes');
      
      const data = await response.json();
      const pacientesProcesados = data.map((paciente) => ({
          ...paciente,
          edad: calcularEdad(paciente.fecha_nacimiento),
          es_temporal: paciente.estado === 'Temporal',
          tipo_paciente: paciente.estado === 'Temporal' ? 'Temporal' : 'Activo',
          matricula: paciente.matricula || null
      }));
      
      setPacientes(pacientesProcesados);
      setPacientesFiltrados(pacientesProcesados);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [calcularEdad]);

  // --- FILTROS Y ORDENAMIENTO ---
  useEffect(() => {
    let resultado = [...pacientes];
    
    // Búsqueda
    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase().trim();
      resultado = resultado.filter(p => 
        `${p.nombre || ''} ${p.apellido_paterno || ''} ${p.apellido_materno || ''}`.toLowerCase().includes(termino) ||
        (p.telefono && p.telefono.includes(termino)) ||
        (p.matricula && p.matricula.toLowerCase().includes(termino))
      );
    }

    // Ordenamiento
    resultado.sort((a, b) => {
      switch (ordenPor) {
        case 'nombre': return (a.nombre || '').localeCompare(b.nombre || '');
        case 'apellido': return (a.apellido_paterno || '').localeCompare(b.apellido_paterno || '');
        case 'edad': 
           const edadA = typeof a.edad === 'number' ? a.edad : 999;
           const edadB = typeof b.edad === 'number' ? b.edad : 999;
           return edadA - edadB;
        default: return 0;
      }
    });

    setPacientesFiltrados(resultado);
  }, [busqueda, pacientes, ordenPor]);

  useEffect(() => { cargarPacientes(); }, [cargarPacientes]);

  // --- ACCIONES ---
  const verHistorialClinico = (pacienteId) => {
     const pacienteActualizado = pacientes.find(p => p.id === pacienteId);
     if (pacienteActualizado) {
        navigate(`/pacientes/${pacienteId}/historial`, { state: { paciente: pacienteActualizado } });
     }
  };

  const handleEditarPaciente = (paciente) => {
      setPacienteSeleccionado(paciente);
      setModalEditarOpen(true);
  };

  const handleConvertirClick = (paciente) => {
      setPacienteParaConvertir(paciente);
      setConfirmModalOpen(true);
  };

  const confirmarConversion = async () => {
      // Aquí iría tu lógica de conversión (fetch)
      // Simulamos éxito para el ejemplo:
      setConfirmModalOpen(false);
      setModalConversionExito({ isOpen: true, pacienteData: pacienteParaConvertir });
      setTimeout(cargarPacientes, 1000); 
  };

  // ====================================================================
  // RENDERIZADO PRINCIPAL
  // ====================================================================
  return (
    <div className="app-layout">
      {/* 1. SIDEBAR */}
      <Sidebar 
        onAgendarClick={handleAgendarCita}
        onPanelClick={handleAbrirPanelControl}
        isAdmin={user?.rol === 'admin'}
        user={user}
        isOpen={isMobileMenuOpen}
        onClose={closeMobileMenu}
      />

      {/* Backdrop Móvil */}
      {isMobileMenuOpen && <div className="mobile-backdrop" onClick={closeMobileMenu}></div>}

      {/* 2. CONTENIDO PRINCIPAL */}
      <div className="main-content-wrapper">
        
        <div className="pacientes-container-moderno">
          
          {/* HEADER */}
          <div className="pacientes-header-moderno">
            <div className="header-left">
              {/* Botón menú solo móvil */}
              <button className="mobile-menu-btn" onClick={toggleMobileMenu}>☰</button>
              <button onClick={() => navigate('/dashboard')} className="btn-regresar-panel" title="Ir al Dashboard">
                ←
              </button>
              <h1>Pacientes</h1>
            </div>
            
            <div className="header-right">
              <button onClick={() => setModalRegistrarOpen(true)} className="btn-registrar-paciente">
                👤 Registrar
              </button>
              <div className="estadisticas-header">
                <span className="estadistica-item estadistica-total">Total: {pacientes.length}</span>
              </div>
            </div>
          </div>

          {/* FILTROS */}
          <div className="controles-pacientes">
            <div className="busqueda-container-moderno">
              <div className="busqueda-icon">🔍</div>
              <input
                type="text"
                placeholder="Buscar por nombre, matrícula..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="busqueda-input-moderno"
              />
            </div>
            <div className="orden-container">
              <select value={ordenPor} onChange={(e) => setOrdenPor(e.target.value)} className="orden-select">
                <option value="nombre">A-Z Nombre</option>
                <option value="apellido">A-Z Apellido</option>
                <option value="edad">Edad</option>
              </select>
            </div>
          </div>

          {/* TABLA RESPONSIVE */}
          <div className="tabla-container">
            {/* Encabezados (Solo PC) */}
            <div className="tabla-header">
              <div>Nombre</div>
              <div>Apellidos</div>
              <div>Edad</div>
              <div>Teléfono</div>
              <div>Tipo</div>
              <div className="header-centrado">Acciones</div>
            </div>

            <div className="tabla-scroll">
              {loading ? (
                 <div className="loading-moderno"><div className="loading-spinner"></div><p>Cargando...</p></div>
              ) : pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((paciente) => (
                  <div key={paciente.id} className="tabla-fila">
                    
                    {/* DATOS (Con data-label para móvil) */}
                    <div className="celda-nombre" data-label="Nombre">
                      {paciente.nombre}
                    </div>
                    <div className="celda-apellido" data-label="Apellidos">
                      {paciente.apellido_paterno} {paciente.apellido_materno}
                    </div>
                    <div className="celda-edad" data-label="Edad">
                      {paciente.edad !== 'N/A' ? `${paciente.edad} años` : 'N/A'}
                    </div>
                    <div className="celda-telefono" data-label="Teléfono">
                      {paciente.telefono || '-'}
                    </div>
                    <div className="celda-tipo" data-label="Estado">
                      <span className={`badge-tipo ${paciente.es_temporal ? 'badge-temporal' : 'badge-activo'}`}>
                        {paciente.es_temporal ? 'Temporal' : 'Activo'}
                      </span>
                    </div>
                    
                    {/* ACCIONES */}
                    <div className="celda-accion">
                      <button onClick={() => verHistorialClinico(paciente.id)} className="btn-icon btn-historial" title="Historial">📋</button>
                      <button onClick={() => handleEditarPaciente(paciente)} className="btn-icon btn-editar" title="Editar">✏️</button>
                      {paciente.es_temporal && (
                        <button onClick={() => handleConvertirClick(paciente)} className="btn-icon btn-convertir" title="Activar">🔄</button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="tabla-vacia">No se encontraron pacientes.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODALES */}
      <ModalEditarPaciente isOpen={modalEditarOpen} onClose={() => setModalEditarOpen(false)} paciente={pacienteSeleccionado} />
      <ModalRegistrarPaciente isOpen={modalRegistrarOpen} onClose={() => setModalRegistrarOpen(false)} onPacienteCreado={() => { cargarPacientes(); setModalRegistrarOpen(false); }} onMostrarExito={handleMostrarExito} />
      <ConfirmModal isOpen={confirmModalOpen} onClose={() => setConfirmModalOpen(false)} onConfirm={confirmarConversion} title="Convertir Paciente" message={`¿Convertir a ${pacienteParaConvertir?.nombre}?`} confirmText="Sí, convertir" />
      <PacienteRegistradoModal isOpen={modalExito.isOpen} onClose={handleCerrarExito} pacienteData={modalExito.pacienteData} autoClose={true} />
      <PacienteConvertidoSuccessModal isOpen={modalConversionExito.isOpen} onClose={() => setModalConversionExito({ isOpen: false })} pacienteData={modalConversionExito.pacienteData} autoClose={true} />
    </div>
  );
};

export default Pacientes;