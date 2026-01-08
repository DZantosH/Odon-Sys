import React, { useState, useEffect, useRef, useMemo } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import esLocale from '@fullcalendar/core/locales/es';
import axios from 'axios';
import { API_BASE_URL, getAuthHeaders } from '../config/config'; 
import '../css/Calendario.css';

const Calendario = () => {
  const [eventos, setEventos] = useState([]);
  const [esMovil, setEsMovil] = useState(window.innerWidth < 768);
  const calendarRef = useRef(null);

  // ESTADOS PARA EL MODAL
  const [modalOpen, setModalOpen] = useState(false);
  const [citasDelDia, setCitasDelDia] = useState([]);
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date());

  // 1. DETECTOR DE PANTALLA
  useEffect(() => {
    const handleResize = () => {
      setEsMovil(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 2. LOGICA DE DENSIDAD (COLORES)
  const conteoPorDia = useMemo(() => {
    const conteo = {};
    eventos.forEach(evento => {
      if (evento.start) {
        const fecha = evento.start.split('T')[0]; 
        conteo[fecha] = (conteo[fecha] || 0) + 1;
      }
    });
    return conteo;
  }, [eventos]);

  const obtenerClaseDelDia = (arg) => {
    // Solo aplicamos colores en vista de Mes y en Móvil
    if (!esMovil || arg.view.type !== 'dayGridMonth') return ''; 
    
    const fechaCelda = arg.date.toISOString().split('T')[0];
    const cantidad = conteoPorDia[fechaCelda] || 0;

    if (cantidad === 0) return '';
    if (cantidad >= 1 && cantidad <= 3) return 'dia-nivel-bajo';     
    if (cantidad >= 4 && cantidad <= 6) return 'dia-nivel-medio';    
    if (cantidad >= 7) return 'dia-nivel-alto';                      
    return '';
  };

  // 3. CARGA DE DATOS
  const cargarCitas = async () => {
    try {
      const url = `${API_BASE_URL}/citas`; 
      const response = await axios.get(url, { headers: getAuthHeaders() });
      const listaCitas = response.data.data || response.data || [];

      if(!Array.isArray(listaCitas)) return;

      const eventosFormateados = listaCitas.map(cita => {
        let fechaLimpia = cita.fecha_cita ? cita.fecha_cita.split('T')[0] : '';
        let horaLimpia = cita.hora_cita || '00:00:00';
        if (horaLimpia.length === 5) horaLimpia += ':00'; 
        const startLocal = `${fechaLimpia}T${horaLimpia}`;

        return {
          id: cita.id,
          title: `${cita.paciente_nombre_completo || 'Paciente'}`, 
          start: startLocal, 
          color: cita.estado === 'Cancelada' ? '#ef4444' : '#3b82f6',
          extendedProps: { ...cita } 
        };
      });
      setEventos(eventosFormateados);
    } catch (error) {
      console.error("Error cargando citas:", error);
    }
  };

  useEffect(() => {
    cargarCitas();
  }, []);

  // 4. ABRIR MODAL
  const abrirModalDia = (date) => {
    const fechaStr = date.toISOString().split('T')[0];
    
    const citasFiltradas = eventos.filter(evento => 
      evento.start.startsWith(fechaStr)
    );

    citasFiltradas.sort((a, b) => new Date(a.start) - new Date(b.start));

    setFechaSeleccionada(date);
    setCitasDelDia(citasFiltradas);
    setModalOpen(true);
  };

  return (
    <div className="calendario-wrapper">
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        
        // --- AQUÍ ESTÁ LA CORRECCIÓN DE LA BARRA ---
        headerToolbar={{
          left: 'prev,next today', // Navegación y Hoy juntos
          center: 'title',         // Título al centro
          right: 'dayGridMonth,timeGridWeek,timeGridDay' // Vistas siempre visibles
        }}
        
        dayCellClassNames={obtenerClaseDelDia}
        locale={esLocale}
        slotMinTime="07:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={false}
        
        // Ocultar eventos SOLO en vista de mes móvil (para ver colores)
        // En semana/día sí queremos ver las barras
        eventDisplay="block"
        
        events={eventos}
        
        navLinks={true}
        navLinkDayClick={(date, jsEvent) => {
          jsEvent.preventDefault();
          abrirModalDia(date);
        }}
        dateClick={(arg) => {
          // Solo abrir modal si estamos en vista de mes (donde no se ven los eventos)
          if (arg.view.type === 'dayGridMonth') {
             abrirModalDia(arg.date);
          }
        }}
        eventClick={(info) => {
           // Si dan click directo al evento (en vista semana/día)
           abrirModalDia(info.event.start);
        }}

        height="100%"
        contentHeight="auto"
      />
      
      {/* LEYENDA (Solo visible en vista Mes Móvil) */}
      {esMovil && (
        <div className="calendario-leyenda-movil">
          <div className="item-leyenda"><span className="punto verde"></span> 1-3</div>
          <div className="item-leyenda"><span className="punto amarillo"></span> 4-6</div>
          <div className="item-leyenda"><span className="punto naranja"></span> 7+</div>
        </div>
      )}

      {/* VENTANA MODAL */}
      {modalOpen && (
        <div className="modal-calendario-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-calendario-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {fechaSeleccionada.toLocaleDateString('es-MX', { 
                  weekday: 'long', day: 'numeric', month: 'long' 
                })}
              </h3>
              <button className="modal-close-btn" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div className="modal-body">
              {citasDelDia.length > 0 ? (
                citasDelDia.map(cita => (
                  <div key={cita.id} className="modal-cita-item" style={{ borderLeftColor: cita.color }}>
                    <div className="cita-hora">
                      {new Date(cita.start).toLocaleTimeString('es-MX', {hour: '2-digit', minute:'2-digit'})}
                    </div>
                    <div className="cita-info">
                      <span className="cita-paciente">{cita.title}</span>
                      <span className="cita-tipo">
                        {cita.extendedProps.tipo_consulta_nombre || 'Consulta'}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="modal-empty-state">
                  <span>☕</span>
                  <p>Sin citas</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
               <button className="btn-cerrar" onClick={() => setModalOpen(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Calendario;