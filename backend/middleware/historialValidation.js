// middleware/historialValidation.js - Validaciones para historiales clínicos (Sequelize)
const { body, param, query, validationResult } = require('express-validator');
const { HistorialClinico, Paciente, Usuario } = require('../models');

// Middleware para manejar errores de validación
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Errores de validación',
      detalles: errors.array()
    });
  }
  next();
};

// ===== VALIDACIONES PARA CREAR HISTORIAL =====
const validarCrearHistorial = [
  body('paciente_id')
    .isInt({ min: 1 })
    .withMessage('ID del paciente debe ser un número entero positivo')
    .custom(async (value) => {
      const paciente = await Paciente.findByPk(value);
      if (!paciente) {
        throw new Error('El paciente especificado no existe');
      }
      if (!paciente.activo) {
        throw new Error('El paciente está inactivo');
      }
      return true;
    }),

  body('doctor_id')
    .isInt({ min: 1 })
    .withMessage('ID del doctor debe ser un número entero positivo')
    .custom(async (value) => {
      const doctor = await Usuario.findByPk(value);
      if (!doctor) {
        throw new Error('El doctor especificado no existe');
      }
      if (!doctor.activo) {
        throw new Error('El doctor está inactivo');
      }
      if (!['Doctor', 'Administrador'].includes(doctor.rol)) {
        throw new Error('El usuario debe tener rol de Doctor o Administrador');
      }
      return true;
    }),

  body('cita_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID de cita debe ser un número entero positivo'),

  body('fecha_consulta')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Fecha de consulta debe tener formato válido (YYYY-MM-DD)'),

  body('estado')
    .optional()
    .isIn(['borrador', 'en_proceso', 'completado', 'archivado'])
    .withMessage('Estado debe ser: borrador, en_proceso, completado o archivado'),

  body('version')
    .optional()
    .matches(/^\d+\.\d+$/)
    .withMessage('Versión debe tener formato X.Y (ej: 1.0)'),

  // Validaciones para campos JSON
  body('datos_personales')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('datos_personales debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('ficha_identificacion')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('ficha_identificacion debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('motivo_consulta')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('motivo_consulta debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_heredo_familiares')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_heredo_familiares debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_personales_no_patologicos')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_personales_no_patologicos debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_personales_patologicos')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_personales_patologicos debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('examen_extrabucal')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('examen_extrabucal debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('examen_intrabucal')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('examen_intrabucal debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('plan_tratamiento')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('plan_tratamiento debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('diagnostico')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Diagnóstico no puede exceder 1000 caracteres'),

  body('tratamiento')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Tratamiento no puede exceder 1000 caracteres'),

  handleValidationErrors
];

// ===== VALIDACIONES PARA ACTUALIZAR HISTORIAL =====
const validarActualizarHistorial = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID del historial debe ser un número entero positivo')
    .custom(async (value) => {
      const historial = await HistorialClinico.findByPk(value);
      if (!historial) {
        throw new Error('El historial especificado no existe');
      }
      return true;
    }),

  body('estado')
    .optional()
    .isIn(['borrador', 'en_proceso', 'completado', 'archivado'])
    .withMessage('Estado debe ser: borrador, en_proceso, completado o archivado'),

  // Mismas validaciones JSON que para crear
  body('datos_personales')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('datos_personales debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('ficha_identificacion')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('ficha_identificacion debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('motivo_consulta')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('motivo_consulta debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_heredo_familiares')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_heredo_familiares debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_personales_no_patologicos')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_personales_no_patologicos debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('antecedentes_personales_patologicos')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('antecedentes_personales_patologicos debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('examen_extrabucal')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('examen_extrabucal debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('examen_intrabucal')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('examen_intrabucal debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('plan_tratamiento')
    .optional()
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('plan_tratamiento debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('diagnostico')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Diagnóstico no puede exceder 1000 caracteres'),

  body('tratamiento')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Tratamiento no puede exceder 1000 caracteres'),

  handleValidationErrors
];

// ===== VALIDACIONES PARA OBTENER HISTORIAL =====
const validarObtenerHistorial = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID del historial debe ser un número entero positivo'),

  handleValidationErrors
];

// ===== VALIDACIONES PARA LISTAR HISTORIALES =====
const validarListarHistoriales = [
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),

  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero positivo'),

  query('estado')
    .optional()
    .isIn(['borrador', 'en_proceso', 'completado', 'archivado'])
    .withMessage('Estado debe ser: borrador, en_proceso, completado o archivado'),

  query('doctor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID del doctor debe ser un número entero positivo'),

  query('paciente_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID del paciente debe ser un número entero positivo'),

  query('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio debe tener formato válido (YYYY-MM-DD)'),

  query('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin debe tener formato válido (YYYY-MM-DD)'),

  handleValidationErrors
];

// ===== VALIDACIONES PARA BUSCAR HISTORIALES =====
const validarBuscarHistoriales = [
  query('limite')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser un número entre 1 y 100'),

  query('pagina')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número entero positivo'),

  query('paciente_nombre')
    .optional()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre del paciente debe tener entre 2 y 100 caracteres'),

  query('paciente_rfc')
    .optional()
    .matches(/^[A-Z]{4}\d{6}[A-Z0-9]{3}$/)
    .withMessage('RFC debe tener formato válido'),

  query('doctor_id')
    .optional()
    .isInt({ min: 1 })
    .withMessage('ID del doctor debe ser un número entero positivo'),

  query('estado')
    .optional()
    .isIn(['borrador', 'en_proceso', 'completado', 'archivado'])
    .withMessage('Estado debe ser: borrador, en_proceso, completado o archivado'),

  query('fecha_inicio')
    .optional()
    .isISO8601()
    .withMessage('Fecha de inicio debe tener formato válido (YYYY-MM-DD)'),

  query('fecha_fin')
    .optional()
    .isISO8601()
    .withMessage('Fecha de fin debe tener formato válido (YYYY-MM-DD)'),

  handleValidationErrors
];

// ===== VALIDACIONES PARA PDFs =====
const validarGuardarPDF = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID del historial debe ser un número entero positivo'),

  // Validación del archivo PDF en el middleware de multer
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        error: 'Archivo PDF requerido'
      });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({
        error: 'El archivo debe ser un PDF'
      });
    }

    if (req.file.size > 10 * 1024 * 1024) { // 10MB
      return res.status(400).json({
        error: 'El archivo PDF no puede exceder 10MB'
      });
    }

    next();
  },

  handleValidationErrors
];

// ===== VALIDACIONES PARA VERSIONES DIGITALES =====
const validarGuardarVersionDigital = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID del historial debe ser un número entero positivo'),

  body('datos_completos')
    .notEmpty()
    .withMessage('Datos completos son requeridos')
    .custom((value) => {
      if (typeof value === 'string') {
        try {
          JSON.parse(value);
        } catch (error) {
          throw new Error('datos_completos debe ser un JSON válido');
        }
      }
      return true;
    }),

  body('comentario')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Comentario no puede exceder 500 caracteres'),

  handleValidationErrors
];

// ===== MIDDLEWARE DE AUTORIZACIÓN =====
const validarAccesoHistorial = async (req, res, next) => {
  try {
    const historialId = req.params.id;
    const usuario = req.user; // Asumiendo que el usuario viene del middleware de autenticación

    if (!usuario) {
      return res.status(401).json({
        error: 'Usuario no autenticado'
      });
    }

    const historial = await HistorialClinico.findByPk(historialId);

    if (!historial) {
      return res.status(404).json({
        error: 'Historial no encontrado'
      });
    }

    // Administradores pueden acceder a todo
    if (usuario.rol === 'Administrador') {
      return next();
    }

    // Doctores solo pueden acceder a sus propios historiales
    if (usuario.rol === 'Doctor' && historial.doctor_id === usuario.id) {
      return next();
    }

    // Asistentes pueden ver pero no modificar
    if (usuario.rol === 'Asistente' && req.method === 'GET') {
      return next();
    }

    return res.status(403).json({
      error: 'No tienes permisos para acceder a este historial'
    });

  } catch (error) {
    console.error('Error en validación de acceso:', error);
    return res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
};

// ===== VALIDACIONES ESPECÍFICAS DE SECCIONES =====
const validarSeccionDatosPersonales = (datos) => {
  const errores = [];
  
  if (!datos.nombre || datos.nombre.trim().length < 2) {
    errores.push('Nombre es requerido y debe tener al menos 2 caracteres');
  }
  
  if (!datos.apellidoPaterno || datos.apellidoPaterno.trim().length < 2) {
    errores.push('Apellido paterno es requerido y debe tener al menos 2 caracteres');
  }
  
  if (datos.fechaNacimiento && isNaN(Date.parse(datos.fechaNacimiento))) {
    errores.push('Fecha de nacimiento debe tener formato válido');
  }
  
  if (datos.sexo && !['M', 'F'].includes(datos.sexo)) {
    errores.push('Sexo debe ser M o F');
  }
  
  return errores;
};

const validarSeccionMotivoConsulta = (datos) => {
  const errores = [];
  
  if (!datos.motivo || datos.motivo.trim().length < 5) {
    errores.push('Motivo de consulta es requerido y debe tener al menos 5 caracteres');
  }
  
  if (datos.escalaDolor && (datos.escalaDolor < 0 || datos.escalaDolor > 10)) {
    errores.push('Escala de dolor debe estar entre 0 y 10');
  }
  
  return errores;
};

module.exports = {
  validarCrearHistorial,
  validarActualizarHistorial,
  validarObtenerHistorial,
  validarListarHistoriales,
  validarBuscarHistoriales,
  validarGuardarPDF,
  validarGuardarVersionDigital,
  validarAccesoHistorial,
  validarSeccionDatosPersonales,
  validarSeccionMotivoConsulta,
  handleValidationErrors
};