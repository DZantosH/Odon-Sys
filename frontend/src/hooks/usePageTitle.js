import { useLocation } from 'react-router-dom';

export const usePageTitle = () => {
  const location = useLocation();
  
  const titles = {
    '/': 'Panel de Control',
    '/panel': 'Panel de Control', 
    '/pacientes': 'Gestión de Pacientes',
    '/historial': 'Historial Clínico',
    '/citas': 'Gestión de Citas',
    '/agendar': 'Agendar Cita',
    '/usuarios': 'Gestión de Usuarios',
    '/reportes': 'Reportes',
    '/configuracion': 'Configuración'
  };
  
  return titles[location.pathname] || 'Odon-SISTEMA';
};