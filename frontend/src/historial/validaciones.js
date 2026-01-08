// validaciones.js - Archivo corregido con validaciones más flexibles

// Helper function para verificar si un valor tiene contenido
const tieneContenido = (valor) => {
  if (valor === null || valor === undefined) return false;
  if (typeof valor === 'string') return valor.trim().length > 0;
  if (typeof valor === 'number') return !isNaN(valor);
  if (typeof valor === 'boolean') return true;
  if (Array.isArray(valor)) return valor.length > 0;
  if (typeof valor === 'object') return Object.keys(valor).length > 0;
  return false;
};

// Helper function para contar campos completados en un objeto
const contarCamposCompletos = (objeto) => {
  if (!objeto || typeof objeto !== 'object') return 0;
  return Object.values(objeto).filter(valor => tieneContenido(valor)).length;
};

export const validarSeccionFichaIdentificacion = (datos) => {
  const errores = {};
  
  // Validación más flexible - solo campos realmente críticos
  if (!tieneContenido(datos?.nombre)) {
    errores.nombre = 'El nombre es obligatorio';
  }
  
  if (!tieneContenido(datos?.apellidoPaterno) && !tieneContenido(datos?.apellidos)) {
    errores.apellidos = 'Al menos un apellido es obligatorio';
  }
  
  if (!tieneContenido(datos?.sexo)) {
    errores.sexo = 'El sexo es obligatorio';
  }
  
  if (!tieneContenido(datos?.fechaNacimiento) && !tieneContenido(datos?.edad)) {
    errores.edad = 'La fecha de nacimiento o edad es obligatoria';
  }
  
  // Si tiene al menos 3 campos básicos completados, considerarlo válido
  const camposBasicos = [
    datos?.nombre,
    datos?.apellidoPaterno || datos?.apellidos,
    datos?.sexo,
    datos?.fechaNacimiento || datos?.edad,
    datos?.telefono,
    datos?.email
  ];
  
  const camposCompletados = camposBasicos.filter(campo => tieneContenido(campo)).length;
  
  if (camposCompletados < 3) {
    errores.general = 'Debe completar al menos 3 campos básicos de identificación';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionMotivoConsulta = (datos) => {
  const errores = {};
  
  // Buscar motivo en diferentes campos posibles
  const motivo = datos?.motivo || datos?.motivo_principal || datos?.descripcion_detallada || datos?.razon_consulta;
  
  if (!tieneContenido(motivo)) {
    errores.motivo = 'Debe especificar el motivo de consulta';
  }
  
  // La escala de dolor y urgencia son opcionales si hay motivo
  if (tieneContenido(motivo)) {
    return { esValido: true, errores: {} };
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionAntecedentesHeredoFamiliares = (datos) => {
  const errores = {};
  
  // Buscar antecedentes en diferentes estructuras posibles
  const antecedentes = datos?.antecedentes || datos?.familiares || datos?.heredo_familiares;
  const informacion = datos?.informacion_adicional || datos?.observaciones || datos?.notas;
  
  // Si tiene información adicional, considerarlo válido
  if (tieneContenido(informacion)) {
    return { esValido: true, errores: {} };
  }
  
  // Si tiene antecedentes familiares
  if (Array.isArray(antecedentes) && antecedentes.length > 0) {
    const tieneAlgunoDatos = antecedentes.some(ant => 
      tieneContenido(ant?.parentesco) || tieneContenido(ant?.padecimientos)
    );
    
    if (tieneAlgunoDatos) {
      return { esValido: true, errores: {} };
    }
  }
  
  // Si no hay nada, requerir al menos información mínima
  errores.antecedentes = 'Debe proporcionar información sobre antecedentes familiares';
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionAntecedentesPersonalesNoPatologicos = (datos) => {
  const errores = {};
  
  // Contar cuántas subsecciones tienen datos
  let seccionesCompletas = 0;
  
  // Servicios públicos
  if (datos?.servicios_publicos && contarCamposCompletos(datos.servicios_publicos) > 0) {
    seccionesCompletas++;
  }
  
  // Higiene
  if (datos?.higiene && contarCamposCompletos(datos.higiene) > 0) {
    seccionesCompletas++;
  }
  
  // Hábitos alimentarios
  if (datos?.alimentarios && contarCamposCompletos(datos.alimentarios) > 0) {
    seccionesCompletas++;
  }
  
  // Hábitos perniciosos
  if (datos?.habitos_perniciosos && contarCamposCompletos(datos.habitos_perniciosos) > 0) {
    seccionesCompletas++;
  }
  
  // Antecedentes médicos
  if (datos?.antecedentes_medicos && contarCamposCompletos(datos.antecedentes_medicos) > 0) {
    seccionesCompletas++;
  }
  
  // Ginecológicos
  if (datos?.antecedentes_ginecologicos && contarCamposCompletos(datos.antecedentes_ginecologicos) > 0) {
    seccionesCompletas++;
  }
  
  // Si tiene al menos 2 subsecciones con datos, considerarlo válido
  if (seccionesCompletas < 2) {
    errores.general = 'Debe completar al menos 2 subsecciones de antecedentes no patológicos';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionAntecedentesPersonalesPatologicos = (datos) => {
  const errores = {};
  
  // Contar subsecciones completadas
  let seccionesCompletas = 0;
  
  // Somatometría - más flexible
  if (datos?.somatometria) {
    const peso = datos.somatometria.peso;
    const talla = datos.somatometria.talla;
    
    if (tieneContenido(peso) || tieneContenido(talla)) {
      seccionesCompletas++;
    }
  }
  
  // Signos vitales
  if (datos?.signos_vitales && contarCamposCompletos(datos.signos_vitales) > 0) {
    seccionesCompletas++;
  }
  
  // Padecimientos
  if (datos?.padecimientos && Array.isArray(datos.padecimientos) && datos.padecimientos.length > 0) {
    seccionesCompletas++;
  }
  
  // Exploración física
  if (datos?.exploracion_fisica && contarCamposCompletos(datos.exploracion_fisica) > 0) {
    seccionesCompletas++;
  }
  
  // Hábitus exterior
  if (tieneContenido(datos?.habitus_exterior)) {
    seccionesCompletas++;
  }
  
  // Si tiene al menos 1 subsección con datos, considerarlo válido
  if (seccionesCompletas < 1) {
    errores.general = 'Debe completar al menos una subsección de antecedentes patológicos';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionExamenExtrabucal = (datos) => {
  const errores = {};
  
  // Contar subsecciones completadas
  let seccionesCompletas = 0;
  
  // Cabeza
  if (datos?.cabeza && contarCamposCompletos(datos.cabeza) > 0) {
    seccionesCompletas++;
  }
  
  // Cadenas ganglionares
  if (datos?.cadenas_ganglionares && contarCamposCompletos(datos.cadenas_ganglionares) > 0) {
    seccionesCompletas++;
  }
  
  // ATM
  if (datos?.atm && contarCamposCompletos(datos.atm) > 0) {
    seccionesCompletas++;
  }
  
  // Músculos
  if (datos?.musculos_cuello && contarCamposCompletos(datos.musculos_cuello) > 0) {
    seccionesCompletas++;
  }
  
  if (datos?.musculos_faciales && contarCamposCompletos(datos.musculos_faciales) > 0) {
    seccionesCompletas++;
  }
  
  // Piel
  if (datos?.piel && contarCamposCompletos(datos.piel) > 0) {
    seccionesCompletas++;
  }
  
  // Estructuras faciales
  if (datos?.estructuras_faciales && contarCamposCompletos(datos.estructuras_faciales) > 0) {
    seccionesCompletas++;
  }
  
  // Si tiene al menos 2 subsecciones con datos, considerarlo válido
  if (seccionesCompletas < 2) {
    errores.general = 'Debe completar al menos 2 subsecciones del examen extrabucal';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionExamenIntrabucal = (datos) => {
  const errores = {};
  
  // Contar subsecciones completadas
  let seccionesCompletas = 0;
  
  // Estructuras intrabucales
  if (datos?.estructuras && contarCamposCompletos(datos.estructuras) > 0) {
    seccionesCompletas++;
  }
  
  // Higiene bucal
  if (datos?.higiene_bucal && contarCamposCompletos(datos.higiene_bucal) > 0) {
    seccionesCompletas++;
  }
  
  // Encías
  if (datos?.encias && contarCamposCompletos(datos.encias) > 0) {
    seccionesCompletas++;
  }
  
  // Oclusión
  if (datos?.oclusion && contarCamposCompletos(datos.oclusion) > 0) {
    seccionesCompletas++;
  }
  
  // Hallazgos adicionales
  if (tieneContenido(datos?.hallazgos_adicionales)) {
    seccionesCompletas++;
  }
  
  // Si tiene al menos 2 subsecciones con datos, considerarlo válido
  if (seccionesCompletas < 2) {
    errores.general = 'Debe completar al menos 2 subsecciones del examen intrabucal';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionOclusion = (datos) => {
  const errores = {};
  
  // Contar subsecciones completadas
  let seccionesCompletas = 0;
  
  // Odontograma
  if (datos?.odontograma && contarCamposCompletos(datos.odontograma) > 0) {
    seccionesCompletas++;
  }
  
  // Armonía de maxilares
  if (datos?.armonia_maxilares && contarCamposCompletos(datos.armonia_maxilares) > 0) {
    seccionesCompletas++;
  }
  
  // Simetría del arco
  if (datos?.simetria_arco && contarCamposCompletos(datos.simetria_arco) > 0) {
    seccionesCompletas++;
  }
  
  // Clasificación de Angle
  if (datos?.clasificacion_angle && contarCamposCompletos(datos.clasificacion_angle) > 0) {
    seccionesCompletas++;
  }
  
  // Examen de higiene oral (O'Leary)
  if (datos?.examen_higiene_oral && contarCamposCompletos(datos.examen_higiene_oral) > 0) {
    seccionesCompletas++;
  }
  
  // Encías detallado
  if (datos?.encias_detallado && contarCamposCompletos(datos.encias_detallado) > 0) {
    seccionesCompletas++;
  }
  
  // Examen dental
  if (datos?.examen_dental && contarCamposCompletos(datos.examen_dental) > 0) {
    seccionesCompletas++;
  }
  
  // Periodontograma
  if (datos?.periodontograma && contarCamposCompletos(datos.periodontograma) > 0) {
    seccionesCompletas++;
  }
  
  // Si tiene al menos 2 subsecciones con datos, considerarlo válido
  if (seccionesCompletas < 2) {
    errores.general = 'Debe completar al menos 2 subsecciones del examen de oclusión';
  }
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

export const validarSeccionAuxiliaresDiagnostico = (datos) => {
  const errores = {};
  
  // Buscar diagnóstico en diferentes campos posibles
  const diagnostico = datos?.diagnostico_integro || datos?.diagnostico || datos?.diagnosticos;
  const plan = datos?.plan_tratamiento || datos?.plan || datos?.tratamiento;
  const pronostico = datos?.pronostico;
  
  // Si tiene cualquiera de estos, considerarlo válido
  if (tieneContenido(diagnostico) || tieneContenido(plan) || tieneContenido(pronostico)) {
    return { esValido: true, errores: {} };
  }
  
  errores.general = 'Debe completar al menos diagnóstico o plan de tratamiento';
  
  return {
    esValido: Object.keys(errores).length === 0,
    errores
  };
};

// Función principal para validar cualquier sección - MEJORADA
export const validarSeccion = (numeroSeccion, datos) => {
  try {
    switch (numeroSeccion) {
      case 1:
        return validarSeccionFichaIdentificacion(datos);
      case 2:
        return validarSeccionMotivoConsulta(datos);
      case 3:
        return validarSeccionAntecedentesHeredoFamiliares(datos);
      case 4:
        return validarSeccionAntecedentesPersonalesNoPatologicos(datos);
      case 5:
        return validarSeccionAntecedentesPersonalesPatologicos(datos);
      case 6:
        return validarSeccionExamenExtrabucal(datos);
      case 7:
        return validarSeccionExamenIntrabucal(datos);
      case 8:
        return validarSeccionOclusion(datos);
      case 9: 
        return validarSeccionAuxiliaresDiagnostico(datos);
      default:
        return { esValido: true, errores: {} };
    }
  } catch (error) {
    console.error('Error en validación:', error);
    // En caso de error, considerar la sección como válida para no bloquear
    return { esValido: true, errores: {} };
  }
};

// Función para validar todo el historial
export const validarHistorialCompleto = (datosCompletos) => {
  const seccionesIncompletas = [];
  const erroresDetallados = {};
  
  try {
    // Validar cada sección
      const secciones = [
        { numero: 1, nombre: 'Ficha Identificación', datos: datosCompletos?.fichaIdentificacion },
        { numero: 2, nombre: 'Motivo Consulta', datos: datosCompletos?.motivoConsulta },
        { numero: 3, nombre: 'Ant. Heredo-Familiares', datos: datosCompletos?.antecedentesHeredoFamiliares },
        { numero: 4, nombre: 'Ant. Pers. No Patológicos', datos: datosCompletos?.antecedentesPersonalesNoPatologicos },
        { numero: 5, nombre: 'Ant. Pers. Patológicos', datos: datosCompletos?.antecedentesPersonalesPatologicos },
        { numero: 6, nombre: 'Examen Extrabucal', datos: datosCompletos?.examenExtrabucal },
        { numero: 7, nombre: 'Examen Intrabucal', datos: datosCompletos?.examenIntrabucal },
        { numero: 8, nombre: 'Oclusión', datos: datosCompletos?.oclusion },  // ← NUEVA LÍNEA
        { numero: 9, nombre: 'Auxiliares Diagnóstico', datos: datosCompletos?.auxiliaresDiagnostico }  // ← MOVIDO AL 9
      ];
    
    secciones.forEach(seccion => {
      const validacion = validarSeccion(seccion.numero, seccion.datos);
      if (!validacion.esValido) {
        seccionesIncompletas.push(seccion.nombre);
        erroresDetallados[seccion.nombre] = validacion.errores;
      }
    });
    
    return {
      esValido: seccionesIncompletas.length === 0,
      seccionesIncompletas,
      erroresDetallados,
      progreso: Math.round(((secciones.length - seccionesIncompletas.length) / secciones.length) * 100)
    };
    
  } catch (error) {
    console.error('Error en validación completa:', error);
    // En caso de error, considerar todo como válido
    return {
      esValido: true,
      seccionesIncompletas: [],
      erroresDetallados: {},
      progreso: 100
    };
  }
};

// Función de debugging
export const debugValidacion = (datos) => {
  console.log('🔍 DEBUG - Validación de datos:', datos);
  
  Object.entries(datos || {}).forEach(([seccion, data]) => {
    console.log(`📋 ${seccion}:`, data);
    console.log(`✅ Tiene contenido:`, tieneContenido(data));
    if (typeof data === 'object' && data) {
      console.log(`📊 Campos completos:`, contarCamposCompletos(data));
    }
  });
  
  const validacion = validarHistorialCompleto(datos);
  console.log('🎯 Resultado validación:', validacion);
  
  return validacion;
};

// Funciones de compatibilidad (mantener nombres originales)
export const validarSeccionExamenIntrabucalFlexible = validarSeccionExamenIntrabucal;
export const debugExamenIntrabucal = (datos) => debugValidacion({ examenIntrabucal: datos });