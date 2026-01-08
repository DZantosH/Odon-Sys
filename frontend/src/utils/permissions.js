export const PERMISSIONS = {
  // 👥 GESTIÓN DE USUARIOS (Solo admin desde HK)
  usuarios: {
    ver: ['Administrador'],
    crear: ['Administrador'],
    editar: ['Administrador'],
    eliminar: ['Administrador'],
  },

  // 🦷 GESTIÓN DE PACIENTES
  pacientes: {
    ver: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    crear: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    editar: ['Administrador', 'Doctor', 'Asistente'],
    eliminar: ['Administrador', 'Doctor'],
    ver_datos_completos: ['Administrador', 'Doctor'],
    ver_datos_basicos: ['Asistente', 'Secretaria'], // Solo nombre, teléfono, citas
    exportar: ['Administrador', 'Doctor'],
  },

  // 📅 GESTIÓN DE CITAS
  citas: {
    ver: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    crear: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    editar: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    eliminar: ['Administrador', 'Doctor', 'Asistente'],
    reagendar: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    cancelar: ['Administrador', 'Doctor', 'Asistente'],
    marcar_completada: ['Administrador', 'Doctor'],
    ver_todas_las_citas: ['Administrador', 'Doctor'],
    ver_solo_propias: ['Doctor'], // Solo sus citas asignadas
    gestionar_calendario: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
  },

  // 📋 HISTORIALES CLÍNICOS
  historiales: {
    ver: ['Administrador', 'Doctor'],
    crear: ['Administrador', 'Doctor'],
    editar: ['Administrador', 'Doctor'],
    eliminar: ['Administrador'],
    generar_pdf: ['Administrador', 'Doctor'],
    firmar: ['Doctor'], // Solo doctores pueden firmar
    ver_historiales_otros_doctores: ['Administrador'],
    ver_solo_propios: ['Doctor'],
  },

  // 🔬 RADIOGRAFÍAS Y ESTUDIOS
  radiografias: {
    ver: ['Administrador', 'Doctor'],
    crear: ['Administrador', 'Doctor'],
    editar: ['Administrador', 'Doctor'],
    eliminar: ['Administrador', 'Doctor'],
    subir_archivos: ['Administrador', 'Doctor'],
    descargar: ['Administrador', 'Doctor'],
  },

  estudios_laboratorio: {
    ver: ['Administrador', 'Doctor'],
    crear: ['Administrador', 'Doctor'],
    editar: ['Administrador', 'Doctor'],
    eliminar: ['Administrador', 'Doctor'],
    subir_resultados: ['Administrador', 'Doctor'],
  },

  // 🦷 ODONTOGRAMA
  odontograma: {
    ver: ['Administrador', 'Doctor'],
    editar: ['Administrador', 'Doctor'],
    crear: ['Administrador', 'Doctor'],
  },

  // 💰 FINANZAS (Solo desde panel HK)
  finanzas: {
    ver: ['Administrador'],
    crear: ['Administrador'],
    editar: ['Administrador'],
    eliminar: ['Administrador'],
    ver_reportes: ['Administrador'],
    exportar: ['Administrador'],
  },

  // 📦 INVENTARIO (Solo desde panel HK)
  inventario: {
    ver: ['Administrador'],
    crear: ['Administrador'],
    editar: ['Administrador'],
    eliminar: ['Administrador'],
    alertas: ['Administrador'],
    movimientos: ['Administrador'],
  },

  // ⚙️ CONFIGURACIÓN SISTEMA
  configuracion: {
    ver: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    editar_perfil: ['Administrador', 'Doctor', 'Asistente', 'Secretaria'],
    editar_sistema: ['Administrador'],
    acceder_panel_admin: ['Administrador'], // Solo admin puede ir al HK
  },

  // 📊 REPORTES
  reportes: {
    ver_basicos: ['Administrador', 'Doctor'],
    ver_financieros: ['Administrador'],
    ver_inventario: ['Administrador'],
    exportar: ['Administrador', 'Doctor'],
  }
};

// 2. FUNCIONES DE VERIFICACIÓN DE PERMISOS
// ==========================================

/**
 * Verifica si un usuario tiene un permiso específico
 * @param {string} userRole - Rol del usuario ('Administrador', 'Doctor', 'Asistente', 'Secretaria')
 * @param {string} module - Módulo (ej: 'pacientes', 'citas', etc.)
 * @param {string} action - Acción (ej: 'ver', 'crear', 'editar', 'eliminar')
 * @returns {boolean}
 */
export const hasPermission = (userRole, module, action) => {
  if (!userRole || !module || !action) {
    console.warn('❌ hasPermission: Parámetros faltantes', { userRole, module, action });
    return false;
  }

  const modulePermissions = PERMISSIONS[module];
  if (!modulePermissions) {
    console.warn(`❌ Módulo "${module}" no encontrado en permisos`);
    return false;
  }

  const actionPermissions = modulePermissions[action];
  if (!actionPermissions) {
    console.warn(`❌ Acción "${action}" no encontrada en módulo "${module}"`);
    return false;
  }

  const hasAccess = actionPermissions.includes(userRole);
  console.log(`🔐 Permiso ${module}.${action} para ${userRole}: ${hasAccess ? '✅ PERMITIDO' : '❌ DENEGADO'}`);
  
  return hasAccess;
};

/**
 * Obtiene todos los permisos de un usuario para un módulo
 * @param {string} userRole - Rol del usuario
 * @param {string} module - Módulo
 * @returns {object}
 */
export const getUserModulePermissions = (userRole, module) => {
  const modulePermissions = PERMISSIONS[module];
  if (!modulePermissions) return {};

  const userPermissions = {};
  Object.keys(modulePermissions).forEach(action => {
    userPermissions[action] = modulePermissions[action].includes(userRole);
  });

  return userPermissions;
};

// 3. CONFIGURACIÓN ESPECÍFICA POR ROL
// ==========================================

export const ROLE_CONFIG = {
  'Administrador': {
    name: 'Administrador',
    description: 'Acceso completo al sistema y panel administrativo',
    dashboard_widgets: ['citas', 'pacientes', 'finanzas', 'inventario', 'usuarios'],
    can_access_admin_panel: true,
    restricted_hours: false, // Sin restricción de horario
    color: '#dc2626', // Rojo
    icon: '👑'
  },

  'Doctor': {
    name: 'Doctor',
    description: 'Gestión clínica completa de pacientes',
    dashboard_widgets: ['mis_citas', 'pacientes', 'historiales'],
    can_access_admin_panel: false,
    restricted_hours: true, // Sí tiene restricción de horario
    color: '#2563eb', // Azul
    icon: '👨‍⚕️'
  },

  'Asistente': {
    name: 'Asistente',
    description: 'Apoyo en citas y gestión básica de pacientes',
    dashboard_widgets: ['citas', 'pacientes_basico'],
    can_access_admin_panel: false,
    restricted_hours: true,
    color: '#059669', // Verde
    icon: '👩‍💼'
  },

  'Secretaria': {
    name: 'Secretaria',
    description: 'Gestión de citas y recepción',
    dashboard_widgets: ['citas', 'agenda'],
    can_access_admin_panel: false,
    restricted_hours: true,
    color: '#7c2d12', // Café
    icon: '📋'
  }
};

// 4. UTILIDADES ADICIONALES
// ==========================================

/**
 * Filtra menús de navegación basado en permisos
 */
export const filterNavigation = (navigation, userRole) => {
  return navigation.filter(item => {
    if (!item.permission) return true; // Items sin restricción
    
    const [module, action] = item.permission.split('.');
    return hasPermission(userRole, module, action);
  });
};

/**
 * Genera configuración de botones basada en permisos
 */
export const getActionButtons = (userRole, module) => {
  const permissions = getUserModulePermissions(userRole, module);
  
  const buttons = [];
  
  if (permissions.crear) {
    buttons.push({ action: 'crear', label: 'Crear', icon: '➕', color: 'primary' });
  }
  
  if (permissions.editar) {
    buttons.push({ action: 'editar', label: 'Editar', icon: '✏️', color: 'secondary' });
  }
  
  if (permissions.eliminar) {
    buttons.push({ action: 'eliminar', label: 'Eliminar', icon: '🗑️', color: 'danger' });
  }
  
  if (permissions.exportar) {
    buttons.push({ action: 'exportar', label: 'Exportar', icon: '📤', color: 'info' });
  }
  
  return buttons;
};

/**
 * Filtra datos de pacientes según el rol
 */
export const filterPacienteData = (paciente, userRole) => {
  const permissions = getUserModulePermissions(userRole, 'pacientes');
  
  // Si puede ver datos completos, devolver todo
  if (permissions.ver_datos_completos) {
    return paciente;
  }
  
  // Si solo puede ver datos básicos
  if (permissions.ver_datos_basicos) {
    return {
      id: paciente.id,
      nombre: paciente.nombre,
      apellido_paterno: paciente.apellido_paterno,
      apellido_materno: paciente.apellido_materno,
      telefono: paciente.telefono,
      edad: paciente.edad,
      sexo: paciente.sexo,
      fecha_registro: paciente.fecha_registro,
      estado: paciente.estado,
      // Ocultar datos sensibles
      correo_electronico: '[OCULTO]',
      rfc: '[OCULTO]',
      fecha_nacimiento: '[OCULTO]',
      calle_numero: '[OCULTO]'
    };
  }
  
  return null; // Sin acceso
};

// 5. CONFIGURACIÓN DE CAMPOS POR ROL
// ==========================================

export const FIELD_PERMISSIONS = {
  pacientes: {
    'Administrador': ['*'], // Todos los campos
    'Doctor': ['*'], // Todos los campos
    'Asistente': [
      'nombre', 'apellido_paterno', 'apellido_materno', 
      'telefono', 'edad', 'sexo', 'observaciones_internas'
    ],
    'Secretaria': [
      'nombre', 'apellido_paterno', 'apellido_materno', 
      'telefono', 'edad'
    ]
  },
  
  citas: {
    'Administrador': ['*'],
    'Doctor': ['*'],
    'Asistente': [
      'fecha_cita', 'hora_cita', 'tipo_consulta', 
      'estado', 'observaciones', 'paciente_info'
    ],
    'Secretaria': [
      'fecha_cita', 'hora_cita', 'tipo_consulta', 
      'estado', 'paciente_info'
    ]
  }
};

/**
 * Verifica si un usuario puede ver/editar un campo específico
 */
export const canAccessField = (userRole, module, fieldName) => {
  const moduleFields = FIELD_PERMISSIONS[module];
  if (!moduleFields) return false;
  
  const userFields = moduleFields[userRole];
  if (!userFields) return false;
  
  return userFields.includes('*') || userFields.includes(fieldName);
};

// Exportar todo como default también
export default {
  PERMISSIONS,
  ROLE_CONFIG,
  FIELD_PERMISSIONS,
  hasPermission,
  getUserModulePermissions,
  filterNavigation,
  getActionButtons,
  filterPacienteData,
  canAccessField
};