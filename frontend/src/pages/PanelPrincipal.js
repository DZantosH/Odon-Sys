// pages/PanelPrincipal.js

import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar'; 
import { useNavigate } from 'react-router-dom';
import AgendarCitasSidebar from '../components/AgendarCitasSidebar';
import Calendario from '../components/Calendario';
import DentalLoading from '../components/DentalLoading';
import ReagendarCita from '../components/ReagendarCita';
import { useAuth } from '../services/AuthContext';
import { esAdministrador } from '../utils/horarioUtils';
import {
  CitaCanceladaSuccessModal,
  CitaAgendadaSuccessModal,
  useModal,
} from '../components/modals/ModalSystem';
import {
  CancelCitaModal,
  ConsultaModal,
} from '../components/modals/AlertaSystem';
import '../css/PanelPrincipal.css';
import '../css/SidebarModerno.css';

const PanelPrincipal = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Estados para modales y datos
  const [showAgendarCitas, setShowAgendarCitas] = useState(false);
  const [showReagendarCita, setShowReagendarCita] = useState(false);
  const [citaParaReagendar, setCitaParaReagendar] = useState(null);
  const [citasHoy, setCitasHoy] = useState([]);
  const [loadingCitas, setLoadingCitas] = useState(true);
  const [showTransitionLoading, setShowTransitionLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // NUEVO ESTADO PARA MENÚ MÓVIL
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const cancelarModal = useModal();
  const [successModal, setSuccessModal] = useState({ isOpen: false, citaData: {} });
  const [modalCitaAgendada, setModalCitaAgendada] = useState({ isOpen: false, citaData: {} });
  const [consultaModal, setConsultaModal] = useState({ isOpen: false, citaData: {}, pacienteNombre: '' });

  // --- LÓGICA DE CARGA Y VERIFICACIÓN ---
  useEffect(() => {
    const verificarRolAdmin = () => {
      try {
        const esAdminUtil = esAdministrador();
        const rolUsuario = user?.rol || user?.role || user?.tipo_usuario || '';
        const esAdminContext = rolUsuario.toLowerCase() === 'administrador' || rolUsuario.toLowerCase() === 'admin';
        setIsAdmin(esAdminUtil || esAdminContext);
      } catch (error) { setIsAdmin(false); }
    };
    verificarRolAdmin();
  }, [user]);

  useEffect(() => { cargarDatosDashboard(); }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  };

  const cargarDatosDashboard = async () => { await cargarCitasHoy(); };

  const cargarCitasHoy = async () => {
    try {
      setLoadingCitas(true);
      const ahora = new Date();
      const fechaHoy = `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`;
      const response = await fetch(`/api/citas/fecha/${fechaHoy}`, { headers: getAuthHeaders() });
      if (response.ok) {
        const result = await response.json();
        let citasData = result.data || result || [];
        if (!Array.isArray(citasData)) citasData = [];
        setCitasHoy(citasData.filter(cita => cita.estado !== 'Cancelada' && cita.estado !== 'No_Asistio'));
      } else { setCitasHoy([]); }
    } catch (error) { setCitasHoy([]); } finally { setLoadingCitas(false); }
  };

  // --- HANDLERS DE ACCIONES ---
  const handleAgendarCita = () => setShowAgendarCitas(true);
  const handleCerrarSidebar = () => setShowAgendarCitas(false);
  
  const handleReagendarCita = (cita) => { setCitaParaReagendar(cita); setShowReagendarCita(true); };
  const handleCerrarReagendar = () => { setShowReagendarCita(false); setCitaParaReagendar(null); };
  
  const handleCitaReagendada = (citaActualizada) => {
    cargarDatosDashboard();
    setModalCitaAgendada({ isOpen: true, citaData: citaActualizada });
  };

  const handleAbrirPanelControl = () => {
    const isLocalhost = window.location.hostname === 'localhost';
    window.open(isLocalhost ? 'http://localhost:3001/' : '/hk/', '_blank', 'noopener,noreferrer');
  };

  const handleCitaAgendada = (citaData) => {
    cargarDatosDashboard();
    if (citaData) setTimeout(() => setModalCitaAgendada({ isOpen: true, citaData: {} }), 500);
  };

  const handleCancelarCita = (cita) => {
    cancelarModal.openModal({
      citaId: cita.id,
      pacienteNombre: cita.paciente_nombre_completo || cita.nombre_paciente || 'Paciente',
      fechaCita: cita.fecha_cita,
      horaCita: cita.hora_cita,
      tipoCita: cita.tipo_consulta || 'Consulta',
      precio: cita.precio
    });
  };

  const confirmarCancelarCita = async () => {
    try {
      const { citaId, pacienteNombre } = cancelarModal.modalData;
      const response = await fetch(`/api/citas/${citaId}`, { method: 'DELETE', headers: getAuthHeaders() });
      if (response.ok) {
        setSuccessModal({ isOpen: true, citaData: { pacienteNombre, ...cancelarModal.modalData } });
        cargarDatosDashboard();
      }
    } catch (error) { alert('Error al cancelar'); }
  };

  const handleCloseSuccessModal = () => setSuccessModal({ isOpen: false, citaData: {} });
  const handleCloseModalCitaAgendada = () => setModalCitaAgendada({ isOpen: false, citaData: {} });

  const handleIniciarConsulta = (cita) => {
    const pacienteNombre = cita.paciente_nombre_completo || cita.nombre_paciente || 'Paciente';
    setConsultaModal({ isOpen: true, citaData: cita, pacienteNombre });
  };

  const handleConfirmarIrHistorial = async () => {
    const { citaData } = consultaModal;
    try {
      await fetch(`/api/citas/${citaData.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ estado: 'En_Proceso', notas: `Iniciada el ${new Date().toLocaleString()}` })
      });
      cargarDatosDashboard();
      setConsultaModal({ isOpen: false, citaData: {}, pacienteNombre: '' });
      setShowTransitionLoading(true);
      
      setTimeout(() => {
        navigate(`/pacientes/${citaData.paciente_id}/historial`, {
          state: {
            paciente: { id: citaData.paciente_id, nombre: citaData.paciente_nombre || '' },
            origen: 'citas-del-dia',
            consultaIniciada: true,
            citaId: citaData.id
          },
          replace: true
        });
        setTimeout(() => setShowTransitionLoading(false), 500);
      }, 2000);
    } catch (error) { setShowTransitionLoading(false); }
  };

  const handleCerrarConsultaModal = () => setConsultaModal({ isOpen: false, citaData: {}, pacienteNombre: '' });
  
  const handleContinuarConsulta = (cita) => {
    navigate(`/pacientes/${cita.paciente_id}/historial`, {
      state: { paciente: { id: cita.paciente_id }, origen: 'citas-del-dia', consultaEnProceso: true, citaId: cita.id }
    });
  };

  const handleTransitionLoadingComplete = () => setShowTransitionLoading(false);

  // --- LÓGICA MÓVIL ---
  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const getEstadoIcon = (estado) => ({ 'Programada': '⏳', 'Confirmada': '✅', 'Completada': '🟢', 'Cancelada': '❌', 'En_Proceso': '🔄' }[estado] || '📅');
  const getEstadoColor = (estado) => ({ 'Programada': '#f59e0b', 'Confirmada': '#3b82f6', 'Completada': '#10b981', 'Cancelada': '#ef4444', 'En_Proceso': '#8b5cf6' }[estado] || '#6b7280');
  const formatTime = (time) => time ? time.slice(0, 5) : 'N/A';

  return (
    <>
      {showTransitionLoading && (
        <DentalLoading isLoading={showTransitionLoading} message="Iniciando consulta..." duration={3000} onComplete={handleTransitionLoadingComplete} />
      )}

      {/* Contenedor Principal */}
      <div className="app-layout">
        
        {/* SIDEBAR INTELIGENTE (Pasamos props para móvil) */}
        <Sidebar 
          onAgendarClick={handleAgendarCita}
          onPanelClick={handleAbrirPanelControl}
          isAdmin={isAdmin}
          user={user}
          isOpen={isMobileMenuOpen}
          onClose={closeMobileMenu}
        />

        {/* FONDO OSCURO PARA MÓVIL (Solo visible cuando menú abierto) */}
        {isMobileMenuOpen && (
          <div className="mobile-backdrop" onClick={closeMobileMenu}></div>
        )}

        {/* CONTENIDO DERECHO */}
        <div className="main-content-wrapper">
          
          {/* HEADER MODERNO CON BOTÓN HAMBURGUESA */}
          <div className="dashboard-header-modern">
            <div className="header-left-group">
               {/* Botón visible solo en celular/tablet */}
               <button className="mobile-menu-btn" onClick={toggleMobileMenu} aria-label="Abrir menú">
                  ☰
               </button>

               <div className="header-welcome">
                  <h1>Hola, {user?.nombre || 'Doctor'} 👋</h1>
                  <p>Resumen del día</p>
               </div>
            </div>

            <div className="header-date">
               <span className="date-icon">📆</span>
               <span>{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>

          <div className="panels-grid">
            {/* PANEL DE CITAS */}
            <div className="content-panel citas-panel">
              <div className="panel-header">
                <div className="panel-title"><span>🗓️</span><span>Citas de Hoy</span></div>
                <button onClick={cargarCitasHoy} className="refresh-btn">🔄</button>
              </div>
              
              <div className="panel-content">
                {loadingCitas ? (
                   <div className="loading-container"><div className="loading-spinner"></div></div>
                ) : citasHoy.length > 0 ? (
                  <div className="citas-list">
                    {citasHoy.map((cita) => (
                      <div key={cita.id} className="cita-card">
                        <div className="cita-time">{formatTime(cita.hora_cita)}</div>
                        <div className="cita-info">
                          <span className="patient-name">{cita.paciente_nombre_completo || cita.nombre_paciente}</span>
                          <span className="cita-type">{cita.tipo_consulta || 'Consulta'}</span>
                        </div>
                        <div className="cita-actions">
                          <button className="icon-btn delete" onClick={() => handleCancelarCita(cita)}>🗑️</button>
                          <button className="icon-btn reschedule" onClick={() => handleReagendarCita(cita)}>🔄</button>
                          {(cita.estado === 'Programada' || cita.estado === 'Confirmada') && (
                            <button className="icon-btn start" onClick={() => handleIniciarConsulta(cita)}>👤</button>
                          )}
                           {cita.estado === 'En_Proceso' && (
                            <button className="icon-btn continue" onClick={() => handleContinuarConsulta(cita)}>🩺</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">☕</div>
                    <p>No hay citas pendientes por hoy</p>
                    <button onClick={handleAgendarCita} className="btn-agendar-empty">Agendar Cita</button>
                  </div>
                )}
              </div>
            </div>

            {/* PANEL DE CALENDARIO */}
            <div className="content-panel calendar-panel">
              <div className="panel-header">
                <div className="panel-title"><span>📅</span><span>Calendario</span></div>
              </div>
              <div className="panel-content-calendar">
                <Calendario />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALES FLOTANTES */}
      <AgendarCitasSidebar isOpen={showAgendarCitas} onClose={handleCerrarSidebar} onCitaCreated={handleCitaAgendada} />
      <ReagendarCita isOpen={showReagendarCita} onClose={handleCerrarReagendar} citaData={citaParaReagendar} onCitaReagendada={handleCitaReagendada} />
      <CancelCitaModal isOpen={cancelarModal.isOpen} onClose={cancelarModal.closeModal} onConfirm={confirmarCancelarCita} citaData={cancelarModal.modalData} />
      <CitaCanceladaSuccessModal isOpen={successModal.isOpen} onClose={handleCloseSuccessModal} citaData={successModal.citaData} autoClose={true} />
      <CitaAgendadaSuccessModal isOpen={modalCitaAgendada.isOpen} onClose={handleCloseModalCitaAgendada} autoClose={true} />
      <ConsultaModal isOpen={consultaModal.isOpen} onClose={handleCerrarConsultaModal} onConfirm={handleConfirmarIrHistorial} title="Iniciar Consulta" message="¿Ir al historial?" />
    </>
  );
};

export default PanelPrincipal;