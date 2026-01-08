import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, Home, Users, DollarSign, Package,
  FileText, Settings, LogOut, Shield, Bell,
  CheckCircle, AlertTriangle, Info, User
} from 'lucide-react';
import { buildApiUrl, getAuthHeaders } from '../config';

const Layout = ({ children, user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const notificationRef = useRef(null);

  // --- ESTADO DE NOTIFICACIONES ---
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Cargar notificaciones al iniciar
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  // Cerrar menú al cambiar de ruta
  useEffect(() => {
    setSidebarOpen(false);
    setShowNotifications(false);
  }, [location]);

  // Cerrar notificaciones al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notificationRef]);

  const fetchNotifications = async () => {
    try {
      const response = await fetch(buildApiUrl('admin/notifications'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        const formattedData = data.map(notif => ({
          ...notif,
          time: getTimeAgo(new Date(notif.fecha))
        }));
        setNotifications(formattedData);
        setUnreadCount(formattedData.length);
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " años";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " meses";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " días";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " horas";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " min";
    return "Hace un momento";
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: location.pathname === '/dashboard' || location.pathname === '/' },
    { name: 'Usuarios', href: '/users', icon: Users, current: location.pathname === '/users' },
    { name: 'Finanzas', href: '/finanzas', icon: DollarSign, current: location.pathname === '/finanzas' },
    { name: 'Inventario', href: '/inventario', icon: Package, current: location.pathname === '/inventario' },
    { name: 'Reportes', href: '/reports', icon: FileText, current: location.pathname === '/reports', disabled: true },
    { name: 'Configuración', href: '/settings', icon: Settings, current: location.pathname === '/settings' }
  ];

  const handleLogout = () => {
    if (window.confirm('¿Desea cerrar sesión?')) {
      onLogout();
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'warning': return <AlertTriangle size={18} className="text-orange-500" />;
      case 'user':    return <User size={18} className="text-blue-500" />;
      case 'system':  return <CheckCircle size={18} className="text-green-500" />;
      case 'money':   return <DollarSign size={18} className="text-emerald-600" />;
      default:        return <Info size={18} className="text-gray-500" />;
    }
  };

  const getNotificationColor = (type) => {
    switch(type) {
      case 'warning': return 'bg-orange-50 dark:bg-orange-900/30';
      case 'user':    return 'bg-blue-50 dark:bg-blue-900/30';
      case 'system':  return 'bg-green-50 dark:bg-green-900/30';
      case 'money':   return 'bg-emerald-50 dark:bg-emerald-900/30';
      default:        return 'bg-gray-50 dark:bg-gray-700';
    }
  };

  return (
    // FONDO PRINCIPAL: bg-gray-50 en claro, dark:bg-gray-900 en oscuro
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 overflow-hidden font-sans transition-colors duration-300">
      
      {/* --- BACKDROP MÓVIL --- */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* --- SIDEBAR --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 
        bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 shadow-2xl 
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} 
        lg:translate-x-0 lg:static lg:shadow-none
      `}>
        <div className="flex flex-col h-full">
          {/* Header Sidebar */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-1.5 rounded-lg text-white shadow-lg shadow-blue-500/30">
                <Shield size={24} />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">OdontoSys</h1>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Panel Admin</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-2 text-gray-400 hover:text-red-500">
              <X size={24} />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
            <p className="px-4 text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 mt-2">Menú Principal</p>
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={!item.disabled ? item.href : '#'}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 mb-1 group
                  ${item.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                  ${item.current 
                    ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 font-bold' 
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white font-medium'
                  }
                `}
              >
                <item.icon size={20} className={item.current ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'} />
                <span className="flex-1">{item.name}</span>
                {item.disabled && <span className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-0.5 rounded font-bold uppercase">Pronto</span>}
              </Link>
            ))}
          </nav>

          {/* Footer Sidebar */}
          <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
            <div className="flex items-center gap-3 mb-3 px-2">
               <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-700 dark:text-blue-300 font-bold text-lg border-2 border-white dark:border-gray-600 shadow-sm">
                 {user?.nombre?.charAt(0)?.toUpperCase()}
               </div>
               <div className="flex-1 min-w-0">
                 <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{user?.nombre}</p>
                 <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.rol}</p>
               </div>
            </div>
            <button onClick={handleLogout} className="flex items-center justify-center gap-2 w-full px-4 py-2 text-red-600 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors text-sm font-bold">
               <LogOut size={18} /> <span>Salir</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50 dark:bg-gray-900">
        
        {/* HEADER SUPERIOR */}
        <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8 shrink-0 relative z-20 transition-colors duration-300">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <Menu size={24} />
            </button>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden sm:block text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium capitalize">
                  {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
             </div>

             {/* === CAMPANA DE NOTIFICACIONES === */}
             <div className="relative" ref={notificationRef}>
               <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`relative p-2 rounded-full transition-colors ${showNotifications ? 'bg-blue-50 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-blue-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
               >
                 <Bell size={20} />
                 {/* Badge Rojo */}
                 {unreadCount > 0 && (
                   <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800 animate-pulse"></span>
                 )}
               </button>

               {/* === MODAL FLOTANTE === */}
               {showNotifications && (
                 <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 origin-top-right z-50">
                    
                    {/* Header del Modal */}
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 flex justify-between items-center">
                       <h3 className="font-bold text-gray-800 dark:text-white text-sm">Notificaciones</h3>
                       <button onClick={() => setNotifications([])} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline">
                         Marcar todas leídas
                       </button>
                    </div>

                    {/* Lista */}
                    <div className="max-h-80 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-800">
                       {notifications.length > 0 ? (
                         notifications.map((notif) => (
                           <div key={notif.id} className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-50 dark:border-gray-700 last:border-0 flex gap-3">
                              <div className={`mt-1 p-2 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${getNotificationColor(notif.type)}`}>
                                 {getNotificationIcon(notif.type)}
                              </div>
                              <div>
                                 <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{notif.title}</p>
                                 <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug">{notif.message}</p>
                                 <p className="text-[10px] text-gray-400 mt-1 font-medium">{notif.time}</p>
                              </div>
                           </div>
                         ))
                       ) : (
                         <div className="py-8 text-center">
                            <Bell size={32} className="mx-auto text-gray-200 dark:text-gray-600 mb-2"/>
                            <p className="text-sm text-gray-400">No tienes notificaciones nuevas</p>
                         </div>
                       )}
                    </div>

                    <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-center">
                       <Link to="/admin/logs" className="text-xs font-bold text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 block py-1">
                          Ver historial completo
                       </Link>
                    </div>
                 </div>
               )}
             </div>
          </div>
        </header>

        {/* ÁREA DE CONTENIDO */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
           <div className="max-w-7xl mx-auto">
             {children}
           </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;