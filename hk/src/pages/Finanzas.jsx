import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  Activity,
  Clock,
  UserCheck,
  Stethoscope,
  AlertTriangle,
  Package
} from 'lucide-react';
import { getAdminToken, getAuthHeaders, buildApiUrl } from '../config';

const Dashboard = () => {
  // --- ESTADOS ---
  const [stats, setStats] = useState({
    usuarios: { total_usuarios: 0, administradores: 0, doctores: 0, secretarias: 0 },
    pacientes: { total_pacientes: 0, pacientes_hoy: 0, pacientes_mes: 0 },
    citas: { total_citas: 0, citas_hoy: 0, citas_pendientes: 0 },
    historiales: { total_consultas: 0, consultas_mes: 0 }
  });
  const [inventoryAlerts, setInventoryAlerts] = useState([]);
  const [movementAlerts, setMovementAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- EFECTOS ---
  useEffect(() => {
    fetchStats();
    fetchInventoryAlerts();
    fetchMovementAlerts();
  }, []);

  const fetchStats = async () => {
    try {
      const token = getAdminToken();
      if (!token) return;
      
      const response = await fetch(buildApiUrl('admin/stats/overview'), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInventoryAlerts = async () => {
    try {
      const response = await fetch(buildApiUrl('admin/alerts/inventory'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setInventoryAlerts(data);
      }
    } catch (error) { console.error(error); }
  };

  const fetchMovementAlerts = async () => {
    try {
      const response = await fetch(buildApiUrl('admin/alerts/movements'), {
        headers: getAuthHeaders()
      });
      if (response.ok) {
        const data = await response.json();
        setMovementAlerts(data);
      }
    } catch (error) { console.error(error); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 lg:p-8 max-w-7xl mx-auto space-y-4 lg:space-y-6">
      
      {/* --- ENCABEZADO --- */}
      <div className="mb-2">
        <h1 className="text-xl lg:text-2xl font-bold text-gray-800 dark:text-white">Dashboard</h1>
        <p className="text-xs lg:text-sm text-gray-500 dark:text-gray-400">Resumen general del sistema</p>
      </div>

      {/* --- GRID DE ESTADÍSTICAS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        
        <StatCard 
          title="Usuarios" 
          value={stats.usuarios.total_usuarios}
          icon={<Users size={20} />} 
          color="blue"
          footer={
            <div className="flex flex-wrap gap-1 text-[9px] lg:text-[10px] font-bold uppercase tracking-wide">
              <span className="text-red-500 bg-red-50 dark:bg-red-900/30 px-1 rounded">A:{stats.usuarios.administradores}</span>
              <span className="text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-1 rounded">D:{stats.usuarios.doctores}</span>
            </div>
          }
        />

        <StatCard 
          title="Pacientes" 
          value={stats.pacientes.total_pacientes}
          icon={<UserCheck size={20} />}
          color="green"
          footer={
            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-green-600 dark:text-green-400 font-bold">
              <TrendingUp size={12} />
              <span>+{stats.pacientes.pacientes_hoy} Hoy</span>
            </div>
          }
        />

        <StatCard 
          title="Citas" 
          value={stats.citas.total_citas}
          icon={<Calendar size={20} />}
          color="purple"
          footer={
            <div className="flex items-center gap-1 text-[10px] lg:text-xs text-purple-600 dark:text-purple-400 font-bold">
              <Clock size={12} />
              <span>{stats.citas.citas_pendientes} Pendientes</span>
            </div>
          }
        />

        <StatCard 
          title="Consultas" 
          value={stats.historiales.total_consultas}
          icon={<Stethoscope size={20} />}
          color="orange"
          footer={
            <div className="text-[10px] lg:text-xs text-gray-400 dark:text-gray-500 font-medium">
              Mes: <span className="text-orange-600 dark:text-orange-400 font-bold">{stats.historiales.consultas_mes}</span>
            </div>
          }
        />
      </div>

      {/* --- SECCIÓN INFERIOR --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        
        {/* ALERTAS DE INVENTARIO */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-3 lg:p-4 border-b border-gray-50 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/30">
            <h3 className="text-sm lg:text-base font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <AlertTriangle size={16} className="text-orange-500" /> Alertas Stock
            </h3>
            <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full font-bold">
              {inventoryAlerts.length}
            </span>
          </div>
          <div className="p-2 lg:p-4 space-y-2 max-h-60 lg:max-h-80 overflow-y-auto custom-scrollbar">
            {inventoryAlerts.length > 0 ? (
              inventoryAlerts.map((alert, index) => (
                <div key={index} className="flex items-center justify-between p-2 lg:p-3 bg-white dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className={`p-1.5 lg:p-2 rounded-lg ${alert.tipo_alerta === 'danger' ? 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-500 dark:text-amber-400'}`}>
                      <Package size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs lg:text-sm font-bold text-gray-800 dark:text-gray-200 truncate max-w-[120px]">{alert.nombre_producto}</p>
                      <p className="text-[10px] lg:text-xs text-gray-400">{alert.categoria}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`text-xs lg:text-sm font-bold ${alert.tipo_alerta === 'danger' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {alert.stock_actual}
                    </p>
                    <p className="text-[9px] lg:text-[10px] text-gray-400">Min: {alert.stock_minimo}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">Todo en orden ✅</div>
            )}
          </div>
        </div>

        {/* MOVIMIENTOS RECIENTES */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
          <div className="p-3 lg:p-4 border-b border-gray-50 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30">
            <h3 className="text-sm lg:text-base font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
              <Activity size={16} className="text-blue-500" /> Movimientos
            </h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-60 lg:max-h-80 overflow-y-auto custom-scrollbar">
            {movementAlerts.length > 0 ? (
              movementAlerts.map((mov, index) => (
                <div key={index} className="p-3 lg:p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex justify-between items-center">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className={`w-2 h-2 rounded-full ${mov.tipo_alerta === 'danger' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                    <div className="min-w-0">
                      <p className="text-xs lg:text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">{mov.descripcion}</p>
                      <p className="text-[10px] lg:text-xs text-gray-400">{mov.usuario || 'Sistema'}</p>
                    </div>
                  </div>
                  <span className="text-[10px] lg:text-xs text-gray-400 font-mono">
                    {new Date(mov.fecha_hora).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-gray-400 dark:text-gray-500 text-xs">Sin movimientos recientes</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

// --- COMPONENTE TARJETA OPTIMIZADO PARA MÓVIL Y DARK MODE ---
const StatCard = ({ title, value, icon, color, footer }) => {
  const colors = {
    blue:   'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green:  'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-3 lg:p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group flex flex-col justify-between h-full">
        <div className="flex justify-between items-start mb-2">
            <div>
                <p className="text-[10px] lg:text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{title}</p>
                <h3 className="text-xl lg:text-3xl font-extrabold text-gray-800 dark:text-white mt-0.5 lg:mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-2 lg:p-3 rounded-lg lg:rounded-xl ${colors[color]}`}>
                {icon}
            </div>
        </div>
        <div className="pt-2 border-t border-gray-50 dark:border-gray-700 mt-auto">
            {footer}
        </div>
    </div>
  );
};

export default Dashboard;