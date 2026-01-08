import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios'; // Asegúrate de tener axios importado
import { API_BASE_URL, getAuthHeaders } from '../config/config'; // Ajusta la ruta a tu config
import '../css/SidebarModerno.css';

const Sidebar = ({ onAgendarClick, onPanelClick, isAdmin, user, isOpen, onClose }) => {
  const navigate = useNavigate();
  
  // ESTADOS PARA NOTIFICACIONES
  const [showNotis, setShowNotis] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [conteoSinLeer, setConteoSinLeer] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleOpenManual = () => {
    navigate('/ManualUsuario');
  };

  const handleLinkClick = () => {
    if (window.innerWidth <= 768 && onClose) onClose();
  };

  // --- LÓGICA DE NOTIFICACIONES ---
  const cargarNotificaciones = async () => {
    try {
      // 1. Obtener fecha de hoy (YYYY-MM-DD)
      const hoy = new Date();
      const fechaHoy = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
      
      // 2. Cargar citas de hoy
      // (Usamos el mismo endpoint que en el Panel Principal)
      const response = await axios.get(`${API_BASE_URL}/citas/fecha/${fechaHoy}`, { headers: getAuthHeaders() });
      const citas = response.data.data || response.data || [];

      // 3. Generar notificaciones basadas en el estado de las citas
      const nuevasNotis = [];

      citas.forEach(cita => {
        const hora = cita.hora_cita ? cita.hora_cita.slice(0, 5) : '00:00';
        const paciente = cita.paciente_nombre_completo || 'Paciente';

        // Notificación de Cancelación
        if (cita.estado === 'Cancelada') {
          nuevasNotis.push({
            id: `cancel-${cita.id}`,
            tipo: 'cancelacion',
            titulo: 'Cita Cancelada',
            mensaje: `${paciente} canceló su cita de las ${hora}.`,
            hora: hora,
            icono: '❌'
          });
        }
        
        // Notificación de Nueva Cita / Confirmada
        else if (cita.estado === 'Programada' || cita.estado === 'Confirmada') {
          nuevasNotis.push({
            id: `new-${cita.id}`,
            tipo: 'cita',
            titulo: 'Cita Programada',
            mensaje: `Cita con ${paciente} a las ${hora}.`,
            hora: hora,
            icono: '📅'
          });
        }
      });

      // 4. ALERTA DE INVENTARIO (Solo para Doctores o Admins)
      // Como no tenemos endpoint de inventario aún, simulamos una alerta si eres Admin/Doctor
      const rol = (user?.rol || '').toLowerCase();
      if (rol.includes('admin') || rol.includes('doctor') || rol.includes('dr')) {
         // AQUÍ CONECTARÍAS TU API REAL DE INVENTARIO
         // Ejemplo simulado:
         nuevasNotis.unshift({
            id: 'inv-1',
            tipo: 'inventario',
            titulo: 'Inventario Bajo',
            mensaje: 'Quedan pocas unidades de: Anestesia Local (2 ampollas).',
            hora: 'Ahora',
            icono: '⚠️'
         });
      }

      setNotificaciones(nuevasNotis);
      setConteoSinLeer(nuevasNotis.length);

    } catch (error) {
      console.error("Error cargando notificaciones", error);
    }
  };

  // Cargar notificaciones al iniciar
  useEffect(() => {
    cargarNotificaciones();
    // Opcional: Recargar cada 60 segundos
    const intervalo = setInterval(cargarNotificaciones, 60000);
    return () => clearInterval(intervalo);
  }, [user]); // Recargar si cambia el usuario

  return (
    <div className={`sidebar-container ${isOpen ? 'mobile-open' : ''}`}>
      
      <button className="mobile-close-btn" onClick={onClose}>✕</button>

      <div className="sidebar-logo">
        <span className="logo-icon">🦷</span>
      </div>

      <div className="sidebar-menu">
        <Link to="/pacientes" className="menu-item" onClick={handleLinkClick} title="Pacientes">
          <div className="icon">👥</div>
          <span className="label">Pacientes</span>
        </Link>

        <button onClick={() => { onAgendarClick(); handleLinkClick(); }} className="menu-item" title="Agendar Cita">
          <div className="icon">📅</div>
          <span className="label">Agendar Cita</span>
        </button>

        {isAdmin && (
          <button onClick={() => { onPanelClick(); handleLinkClick(); }} className="menu-item" title="Panel de Control">
            <div className="icon">⚙️</div>
            <span className="label">Administración</span>
          </button>
        )}
      </div>

      <div className="sidebar-spacer"></div>

      <div className="sidebar-actions">
        {/* BOTÓN DE NOTIFICACIONES CON ACCIÓN REAL */}
        <button 
          className="menu-item" 
          title="Notificaciones" 
          onClick={() => setShowNotis(true)}
        >
          <div className="icon">
            🔔
            {/* Solo mostramos el badge si hay notificaciones */}
            {conteoSinLeer > 0 && (
              <div className="notification-badge">{conteoSinLeer}</div>
            )}
          </div>
          <span className="label">Notificaciones</span>
        </button>
        
        <button onClick={() => { handleOpenManual(); handleLinkClick(); }} className="menu-item" title="Manual de Usuario">
          <div className="icon">❓</div>
          <span className="label">Ayuda</span>
        </button>
      </div>

      <div className="sidebar-profile">
        <div className="profile-content">
          <div className="avatar">
            {user?.nombre ? user.nombre.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="user-info">
            <p className="user-name">{user?.nombre?.split(' ')[0] || 'Usuario'}</p>
            <p className="user-role">{user?.rol || 'Doctor'}</p>
          </div>
          <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
            ↪️
          </button>
        </div>
      </div>

      {/* === MODAL DE NOTIFICACIONES === */}
      {showNotis && (
        <>
          {/* Fondo oscuro para cerrar al hacer clic afuera */}
          <div className="noti-overlay" onClick={() => setShowNotis(false)}></div>
          
          <div className="noti-modal">
            <div className="noti-header">
              <h3>🔔 Notificaciones de Hoy</h3>
              <button className="noti-close-btn" onClick={() => setShowNotis(false)}>✕</button>
            </div>
            
            <div className="noti-body">
              {notificaciones.length > 0 ? (
                notificaciones.map((noti) => (
                  <div key={noti.id} className={`noti-item tipo-${noti.tipo}`}>
                    <div className="noti-icon">{noti.icono}</div>
                    <div className="noti-info">
                      <span className="noti-titulo">{noti.titulo}</span>
                      <p className="noti-mensaje">{noti.mensaje}</p>
                      <span className="noti-hora">{noti.hora}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="noti-empty">
                  <span>✨</span>
                  <p>Todo está tranquilo por ahora.</p>
                </div>
              )}
            </div>

            {isAdmin && (
               <div className="noti-footer">
                  <small>Ver inventario completo en Panel</small>
               </div>
            )}
          </div>
        </>
      )}

    </div>
  );
};

export default Sidebar;