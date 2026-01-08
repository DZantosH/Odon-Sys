// errorHandler.js - VERSIÓN CORREGIDA SIN ERRORES ESLint

/**
 * Maneja errores de red y servidor
 */
const manejarErrorRed = (error, contexto = '') => {
  console.error(`❌ Error de red en ${contexto}:`, error);
  
  // Determinar tipo de error
  if (error.name === 'TypeError' && error.message.includes('fetch')) {
    return {
      tipo: 'conexion',
      mensaje: 'No se pudo conectar con el servidor. Verifique su conexión a internet.',
      solucion: 'Intente nuevamente en unos momentos o contacte al administrador del sistema.'
    };
  }
  
  if (error.message.includes('404')) {
    return {
      tipo: 'no_encontrado',
      mensaje: 'El recurso solicitado no fue encontrado en el servidor.',
      solucion: 'Verifique que la URL del API sea correcta.'
    };
  }
  
  if (error.message.includes('500')) {
    return {
      tipo: 'servidor',
      mensaje: 'Error interno del servidor.',
      solucion: 'El servidor está experimentando problemas. Intente más tarde.'
    };
  }
  
  if (error.message.includes('403')) {
    return {
      tipo: 'permisos',
      mensaje: 'No tiene permisos para realizar esta acción.',
      solucion: 'Contacte al administrador para obtener los permisos necesarios.'
    };
  }
  
  // Error genérico
  return {
    tipo: 'generico',
    mensaje: error.message || 'Ocurrió un error inesperado.',
    solucion: 'Intente nuevamente. Si el problema persiste, contacte al soporte técnico.'
  };
};

/**
 * Maneja errores de validación de formularios
 */
const manejarErrorValidacion = (errores, seccion = '') => {
  const erroresFormateados = [];
  
  Object.entries(errores).forEach(([campo, mensaje]) => {
    erroresFormateados.push({
      campo: campo,
      mensaje: mensaje,
      seccion: seccion
    });
  });
  
  return {
    tipo: 'validacion',
    errores: erroresFormateados,
    total: erroresFormateados.length,
    mensaje: `Se encontraron ${erroresFormateados.length} error(es) de validación${seccion ? ` en ${seccion}` : ''}.`
  };
};

/**
 * Maneja errores de guardado
 */
const manejarErrorGuardado = (error, tipoGuardado = 'datos') => {
  console.error(`❌ Error de guardado (${tipoGuardado}):`, error);
  
  let mensaje = '';
  let solucion = '';
  
  switch (tipoGuardado) {
    case 'baseDatos':
      mensaje = 'No se pudo guardar en la base de datos.';
      solucion = 'Los datos se han guardado localmente. Puede intentar sincronizar más tarde.';
      break;
      
    case 'pdf':
      mensaje = 'No se pudo generar o guardar el archivo PDF.';
      solucion = 'Los datos están seguros. Puede generar el PDF desde el historial del paciente.';
      break;
      
    case 'local':
      mensaje = 'No se pudo guardar en el almacenamiento local.';
      solucion = 'Verifique el espacio disponible en su dispositivo.';
      break;
      
    default:
      mensaje = 'Error durante el proceso de guardado.';
      solucion = 'Intente nuevamente o contacte al soporte técnico.';
  }
  
  return {
    tipo: 'guardado',
    subTipo: tipoGuardado,
    mensaje,
    solucion,
    error: error.message || 'Error desconocido'
  };
};

/**
 * Maneja errores de PDF
 */
const manejarErrorPDF = (error) => {
  console.error('❌ Error de PDF:', error);
  
  if (error.message.includes('jsPDF')) {
    return {
      tipo: 'pdf_libreria',
      mensaje: 'Error en la librería de generación de PDF.',
      solucion: 'Recargue la página e intente nuevamente.'
    };
  }
  
  if (error.message.includes('datos')) {
    return {
      tipo: 'pdf_datos',
      mensaje: 'Los datos del historial no están completos para generar el PDF.',
      solucion: 'Complete todas las secciones requeridas.'
    };
  }
  
  return {
    tipo: 'pdf_generico',
    mensaje: 'No se pudo generar el PDF del historial.',
    solucion: 'Los datos están guardados. Puede generar el PDF más tarde desde el historial.'
  };
};

/**
 * Muestra notificaciones de error al usuario
 */
const mostrarNotificacionError = (errorInfo, opciones = {}) => {
  const { 
    titulo = '⚠️ Error',
    mostrarSolucion = true,
    permitirReintentar = true 
  } = opciones;
  
  let mensaje = `${titulo}\n\n${errorInfo.mensaje}`;
  
  if (mostrarSolucion && errorInfo.solucion) {
    mensaje += `\n\n💡 Solución sugerida:\n${errorInfo.solucion}`;
  }
  
  if (errorInfo.errores && errorInfo.errores.length > 0) {
    mensaje += '\n\nErrores específicos:';
    errorInfo.errores.forEach(error => {
      mensaje += `\n• ${error.mensaje}`;
    });
  }
  
  window.alert(mensaje);
  
  if (permitirReintentar && errorInfo.tipo !== 'validacion') {
    return window.confirm('\n¿Desea intentar nuevamente?');
  }
  
  return false;
};

/**
 * Logger de errores para depuración
 */
const logError = (error, contexto = '', datos = null) => {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    contexto,
    error: {
      message: error.message,
      stack: error.stack,
      name: error.name
    },
    datos: datos ? JSON.stringify(datos, null, 2) : null,
    userAgent: navigator.userAgent,
    url: window.location.href
  };
  
  console.group(`🔍 Error Log - ${contexto}`);
  console.error('Timestamp:', timestamp);
  console.error('Error:', error);
  console.error('Contexto:', contexto);
  if (datos) console.error('Datos:', datos);
  console.groupEnd();
  
  // Guardar en localStorage para depuración
  try {
    const errorLogs = JSON.parse(localStorage.getItem('historial_error_logs') || '[]');
    errorLogs.push(logEntry);
    
    // Mantener solo los últimos 10 errores
    if (errorLogs.length > 10) {
      errorLogs.splice(0, errorLogs.length - 10);
    }
    
    localStorage.setItem('historial_error_logs', JSON.stringify(errorLogs));
  } catch (localStorageError) {
    console.warn('No se pudo guardar el log de error:', localStorageError);
  }
  
  return logEntry;
};

/**
 * Recupera logs de error para depuración
 */
const obtenerLogsError = () => {
  try {
    return JSON.parse(localStorage.getItem('historial_error_logs') || '[]');
  } catch (error) {
    console.warn('No se pudieron recuperar los logs de error:', error);
    return [];
  }
};

/**
 * Limpia logs de error
 */
const limpiarLogsError = () => {
  try {
    localStorage.removeItem('historial_error_logs');
    console.log('✅ Logs de error limpiados');
  } catch (error) {
    console.warn('No se pudieron limpiar los logs de error:', error);
  }
};

/**
 * Maneja errores de forma unificada
 */
const manejarError = (error, contexto = '', datos = null, opciones = {}) => {
  // Registrar error
  logError(error, contexto, datos);
  
  // Determinar tipo de error y manejar apropiadamente
  let errorInfo;
  
  if (contexto.includes('red') || contexto.includes('fetch') || contexto.includes('api')) {
    errorInfo = manejarErrorRed(error, contexto);
  } else if (contexto.includes('pdf')) {
    errorInfo = manejarErrorPDF(error);
  } else if (contexto.includes('guardado')) {
    errorInfo = manejarErrorGuardado(error, contexto.split('_')[1]);
  } else {
    errorInfo = {
      tipo: 'generico',
      mensaje: error.message || 'Ocurrió un error inesperado.',
      solucion: 'Intente nuevamente. Si el problema persiste, contacte al soporte técnico.'
    };
  }
  
  // Mostrar notificación si es necesario
  if (opciones.mostrarAlUsuario !== false) {
    return mostrarNotificacionError(errorInfo, opciones);
  }
  
  return errorInfo;
};

/**
 * Wrapper para funciones asíncronas con manejo de errores
 */
const conManejoDeErrores = (fn, contexto = '', opciones = {}) => {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      const debeReintentar = manejarError(error, contexto, args, opciones);
      
      if (debeReintentar && opciones.permitirReintentos) {
        // Reintentar una vez más
        try {
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1 segundo
          return await fn(...args);
        } catch (errorReintento) {
          manejarError(errorReintento, `${contexto}_reintento`, args, { 
            ...opciones, 
            permitirReintentar: false 
          });
          throw errorReintento;
        }
      }
      
      throw error;
    }
  };
};

// ✅ EXPORTAR FUNCIONES - Forma correcta para evitar errores ESLint
const errorHandlerModule = {
  manejarErrorRed,
  manejarErrorValidacion,
  manejarErrorGuardado,
  manejarErrorPDF,
  mostrarNotificacionError,
  logError,
  obtenerLogsError,
  limpiarLogsError,
  manejarError,
  conManejoDeErrores
};

// Exportar como módulo por defecto
export default errorHandlerModule;

// Exportar funciones individuales
export {
  manejarErrorRed,
  manejarErrorValidacion,
  manejarErrorGuardado,
  manejarErrorPDF,
  mostrarNotificacionError,
  logError,
  obtenerLogsError,
  limpiarLogsError,
  manejarError,
  conManejoDeErrores
};