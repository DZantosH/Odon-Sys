// ==========================================
// CONTEXTO DE PERMISOS - IMPLEMENTACIÓN
// ==========================================
// Archivo: src/contexts/PermissionsContext.js

import React, { createContext, useContext } from 'react';
import { useAuth } from '../services/AuthContext';
import { hasPermission, getUserModulePermissions, ROLE_CONFIG } from '../utils/permissions';

// Crear el contexto
const PermissionsContext = createContext();

// ==========================================
// PROVEEDOR DE PERMISOS
// ==========================================

export const PermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  
  const permissions = {
    // Verificar permiso individual
    can: (module, action) => hasPermission(user?.rol, module, action),
    
    // Verificar si tiene ALGUNO de los permisos (OR)
    canAny: (module, actions) => actions.some(action => hasPermission(user?.rol, module, action)),
    
    // Verificar si tiene TODOS los permisos (AND)
    canAll: (module, actions) => actions.every(action => hasPermission(user?.rol, module, action)),
    
    // Obtener todos los permisos de un módulo
    getModulePermissions: (module) => getUserModulePermissions(user?.rol, module),
    
    // Datos del usuario
    userRole: user?.rol,
    user: user,
    
    // Configuración del rol actual
    roleConfig: ROLE_CONFIG[user?.rol] || {},
    
    // Verificar si es administrador
    isAdmin: () => user?.rol === 'Administrador',
    
    // Verificar si puede acceder al panel admin
    canAccessAdminPanel: () => hasPermission(user?.rol, 'configuracion', 'acceder_panel_admin')
  };
  
  return (
    <PermissionsContext.Provider value={permissions}>
      {children}
    </PermissionsContext.Provider>
  );
};

// ==========================================
// HOOK PERSONALIZADO
// ==========================================

export const usePermissions = () => {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }
  return context;
};

// ==========================================
// COMPONENTE DE PROTECCIÓN
// ==========================================

export const ProtectedComponent = ({ 
  module, 
  action, 
  children, 
  fallback = null,
  showMessage = false,
  requireAll = false // Si es true y action es array, requiere TODOS los permisos
}) => {
  const { can, userRole } = usePermissions();
  
  let hasAccess = false;

  if (Array.isArray(action)) {
    // Múltiples acciones
    hasAccess = requireAll 
      ? action.every(act => can(module, act))
      : action.some(act => can(module, act));
  } else {
    // Acción única
    hasAccess = can(module, action);
  }

  if (!hasAccess) {
    if (showMessage) {
      return (
        <div className="permission-denied-message">
          <p>🚫 No tienes permisos para realizar esta acción</p>
          <small>Rol actual: <strong>{userRole}</strong></small>
          <small>Permiso requerido: <strong>{module}.{Array.isArray(action) ? action.join(', ') : action}</strong></small>
        </div>
      );
    }
    return fallback;
  }
  
  return children;
};

// ==========================================
// COMPONENTE PARA MOSTRAR ROL ACTUAL
// ==========================================

export const UserRoleBadge = ({ showDescription = false, className = "" }) => {
  const { roleConfig, userRole } = usePermissions();
  
  if (!userRole) return null;
  
  return (
    <div 
      className={`user-role-badge ${className}`} 
      style={{ backgroundColor: roleConfig.color }}
      title={roleConfig.description}
    >
      <span className="role-icon">{roleConfig.icon}</span>
      <span className="role-name">{roleConfig.name}</span>
      {showDescription && (
        <small className="role-description">{roleConfig.description}</small>
      )}
    </div>
  );
};

// ==========================================
// HOOK PARA NAVEGACIÓN DINÁMICA
// ==========================================

export const useNavigationItems = () => {
  const { can } = usePermissions();
  
  const getNavigationItems = () => {
    const baseItems = [
      {
        name: 'Dashboard',
        path: '/dashboard',
        icon: '🏠',
        permission: null // Todos pueden acceder
      },
      {
        name: 'Pacientes',
        path: '/pacientes',
        icon: '👥',
        permission: 'pacientes.ver'
      },
      {
        name: 'Citas',
        path: '/citas',
        icon: '📅',
        permission: 'citas.ver'
      },
      {
        name: 'Historiales',
        path: '/historiales',
        icon: '📋',
        permission: 'historiales.ver'
      },
      {
        name: 'Radiografías',
        path: '/radiografias',
        icon: '🔬',
        permission: 'radiografias.ver'
      },
      {
        name: 'Configuración',
        path: '/configuracion',
        icon: '⚙️',
        permission: 'configuracion.ver'
      }
    ];
    
    // Filtrar items según permisos
    return baseItems.filter(item => {
      if (!item.permission) return true;
      
      const [module, action] = item.permission.split('.');
      return can(module, action);
    });
  };
  
  return { getNavigationItems };
};

// ==========================================
// HOOK PARA BOTONES DE ACCIÓN DINÁMICOS
// ==========================================

export const useActionButtons = (module) => {
  const { getModulePermissions } = usePermissions();
  
  const getActionButtons = () => {
    const permissions = getModulePermissions(module);
    const buttons = [];
    
    if (permissions.ver) {
      buttons.push({ 
        action: 'ver', 
        label: 'Ver', 
        icon: '👁️', 
        color: 'info',
        className: 'btn-info'
      });
    }
    
    if (permissions.crear) {
      buttons.push({ 
        action: 'crear', 
        label: 'Crear', 
        icon: '➕', 
        color: 'primary',
        className: 'btn-primary'
      });
    }
    
    if (permissions.editar) {
      buttons.push({ 
        action: 'editar', 
        label: 'Editar', 
        icon: '✏️', 
        color: 'secondary',
        className: 'btn-secondary'
      });
    }
    
    if (permissions.eliminar) {
      buttons.push({ 
        action: 'eliminar', 
        label: 'Eliminar', 
        icon: '🗑️', 
        color: 'danger',
        className: 'btn-danger'
      });
    }
    
    if (permissions.exportar) {
      buttons.push({ 
        action: 'exportar', 
        label: 'Exportar', 
        icon: '📤', 
        color: 'info',
        className: 'btn-info'
      });
    }
    
    return buttons;
  };
  
  return { getActionButtons, permissions: getModulePermissions(module) };
};

// ==========================================
// COMPONENTE PARA DEBUG (SOLO DESARROLLO)
// ==========================================

export const PermissionsDebug = () => {
  const { userRole, roleConfig, can, getModulePermissions } = usePermissions();
  
  // Solo mostrar en desarrollo
  if (process.env.NODE_ENV !== 'development') return null;
  
  const testPermissions = [
    ['pacientes', 'ver'],
    ['pacientes', 'crear'],
    ['pacientes', 'editar'],
    ['pacientes', 'eliminar'],
    ['pacientes', 'ver_datos_completos'],
    ['citas', 'ver'],
    ['citas', 'crear'],
    ['citas', 'marcar_completada'],
    ['historiales', 'ver'],
    ['historiales', 'crear'],
    ['configuracion', 'acceder_panel_admin'],
    ['finanzas', 'ver'],
    ['inventario', 'ver']
  ];
  
  return (
    <div style={{ 
      position: 'fixed', 
      bottom: 20, 
      right: 20, 
      background: 'white', 
      padding: 20, 
      border: '2px solid #e5e7eb',
      borderRadius: 12,
      fontSize: 12,
      zIndex: 9999,
      maxWidth: 300,
      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 12px 0', color: '#374151' }}>🔐 Debug Permisos</h4>
      
      <div style={{ marginBottom: 12 }}>
        <strong>Rol:</strong> 
        <span style={{ 
          color: roleConfig.color, 
          marginLeft: 8,
          fontWeight: 'bold'
        }}>
          {roleConfig.icon} {userRole}
        </span>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        <strong>Descripción:</strong><br />
        <small style={{ color: '#6b7280' }}>{roleConfig.description}</small>
      </div>
      
      <h5 style={{ margin: '12px 0 8px 0', color: '#374151' }}>Permisos:</h5>
      <div style={{ maxHeight: 200, overflowY: 'auto' }}>
        {testPermissions.map(([module, action]) => (
          <div key={`${module}.${action}`} style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            marginBottom: 4,
            fontSize: 11
          }}>
            <span>{module}.{action}</span>
            <span>{can(module, action) ? '✅' : '❌'}</span>
          </div>
        ))}
      </div>
      
      <div style={{ 
        marginTop: 12, 
        padding: 8, 
        background: '#f3f4f6', 
        borderRadius: 6,
        fontSize: 10,
        color: '#6b7280'
      }}>
        <strong>Widgets permitidos:</strong><br />
        {roleConfig.dashboard_widgets?.join(', ') || 'Ninguno'}
      </div>
    </div>
  );
};

// ==========================================
// EXPORTACIONES
// ==========================================

export default {
  PermissionsProvider,
  usePermissions,
  ProtectedComponent,
  UserRoleBadge,
  useNavigationItems,
  useActionButtons,
  PermissionsDebug
};