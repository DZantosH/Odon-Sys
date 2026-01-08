// controllers/historialClinicoController.js - Controlador principal para historiales clínicos
const { HistorialClinico, Paciente, Usuario, sequelize } = require('../models');
const HistorialService = require('../services/historialService');
const { config: fileConfig } = require('../config/fileConfig');

class HistorialClinicoController {

  // ===== CREAR HISTORIAL =====
  static async crearHistorial(req, res) {
    try {
      const datosHistorial = req.body;
      const usuario = req.user || { id: 1 }; // Temporal mientras no hay auth
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const historial = await HistorialService.crearHistorial({
        pacienteId: datosHistorial.paciente_id,
        doctorId: datosHistorial.doctor_id,
        citaId: datosHistorial.cita_id,
        datosHistorial,
        usuario,
        ip,
        userAgent
      });

      res.status(201).json({
        mensaje: 'Historial clínico creado exitosamente',
        historial
      });

    } catch (error) {
      console.error('Error creando historial:', error);
      res.status(500).json({
        error: 'Error al crear historial clínico',
        detalles: error.message
      });
    }
  }

  // ===== OBTENER HISTORIAL =====
  static async obtenerHistorial(req, res) {
    try {
      const { id } = req.params;
      const usuario = req.user || { id: 1 };
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const historial = await HistorialService.obtenerHistorial(id, usuario, ip, userAgent);

      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      res.json({
        mensaje: 'Historial obtenido exitosamente',
        historial
      });

    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        error: 'Error al obtener historial',
        detalles: error.message
      });
    }
  }

  // ===== ACTUALIZAR HISTORIAL =====
  static async actualizarHistorial(req, res) {
    try {
      const { id } = req.params;
      const datosHistorial = req.body;
      const usuario = req.user || { id: 1 };
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const historial = await HistorialService.actualizarHistorial(id, {
        datosHistorial,
        usuario,
        ip,
        userAgent
      });

      res.json({
        mensaje: 'Historial actualizado exitosamente',
        historial
      });

    } catch (error) {
      console.error('Error actualizando historial:', error);
      res.status(500).json({
        error: 'Error al actualizar historial',
        detalles: error.message
      });
    }
  }

  // ===== ELIMINAR HISTORIAL =====
  static async eliminarHistorial(req, res) {
    try {
      const { id } = req.params;
      const usuario = req.user || { id: 1 };

      const historial = await HistorialClinico.findByPk(id);
      
      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      // Soft delete - cambiar estado a archivado
      await historial.update({
        estado: 'archivado',
        actualizado_por: usuario.id
      });

      res.json({
        mensaje: 'Historial eliminado exitosamente'
      });

    } catch (error) {
      console.error('Error eliminando historial:', error);
      res.status(500).json({
        error: 'Error al eliminar historial',
        detalles: error.message
      });
    }
  }

  // ===== LISTAR HISTORIALES =====
  static async listarHistoriales(req, res) {
    try {
      const opciones = {
        limite: req.query.limite || 10,
        pagina: req.query.pagina || 1,
        estado: req.query.estado,
        doctorId: req.query.doctor_id,
        fechaInicio: req.query.fecha_inicio,
        fechaFin: req.query.fecha_fin
      };

      const where = {};
      if (opciones.estado) where.estado = opciones.estado;
      if (opciones.doctorId) where.doctor_id = opciones.doctorId;
      
      if (opciones.fechaInicio || opciones.fechaFin) {
        where.fecha_consulta = {};
        if (opciones.fechaInicio) where.fecha_consulta[sequelize.Sequelize.Op.gte] = opciones.fechaInicio;
        if (opciones.fechaFin) where.fecha_consulta[sequelize.Sequelize.Op.lte] = opciones.fechaFin;
      }

      const resultado = await HistorialClinico.findAndCountAll({
        where,
        include: [
          {
            model: Paciente,
            as: 'paciente',
            attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'rfc', 'fecha_nacimiento']
          },
          {
            model: Usuario,
            as: 'doctor',
            attributes: ['id', 'nombre', 'apellido_paterno', 'apellido_materno', 'especialidad']
          }
        ],
        order: [['fecha_consulta', 'DESC']],
        limit: parseInt(opciones.limite),
        offset: (parseInt(opciones.pagina) - 1) * parseInt(opciones.limite)
      });

      res.json({
        mensaje: 'Historiales obtenidos exitosamente',
        historiales: resultado.rows,
        total: resultado.count,
        pagina: parseInt(opciones.pagina),
        totalPaginas: Math.ceil(resultado.count / parseInt(opciones.limite))
      });

    } catch (error) {
      console.error('Error listando historiales:', error);
      res.status(500).json({
        error: 'Error al listar historiales',
        detalles: error.message
      });
    }
  }

  // ===== BUSCAR HISTORIALES =====
  static async buscarHistoriales(req, res) {
    try {
      const criterios = {
        pacienteNombre: req.query.paciente_nombre,
        pacienteRFC: req.query.paciente_rfc,
        doctorId: req.query.doctor_id,
        estado: req.query.estado,
        fechaInicio: req.query.fecha_inicio,
        fechaFin: req.query.fecha_fin
      };

      const opciones = {
        limite: req.query.limite || 20,
        pagina: req.query.pagina || 1
      };

      const resultado = await HistorialService.buscarHistoriales(criterios, opciones);

      res.json({
        mensaje: 'Búsqueda completada exitosamente',
        ...resultado
      });

    } catch (error) {
      console.error('Error buscando historiales:', error);
      res.status(500).json({
        error: 'Error al buscar historiales',
        detalles: error.message
      });
    }
  }

  // ===== HISTORIALES POR PACIENTE =====
  static async obtenerHistorialesPaciente(req, res) {
    try {
      const { pacienteId } = req.params;
      const opciones = {
        limite: req.query.limite || 10,
        pagina: req.query.pagina || 1,
        estado: req.query.estado
      };

      const resultado = await HistorialService.listarHistorialesPaciente(pacienteId, opciones);

      res.json({
        mensaje: 'Historiales del paciente obtenidos exitosamente',
        ...resultado
      });

    } catch (error) {
      console.error('Error obteniendo historiales del paciente:', error);
      res.status(500).json({
        error: 'Error al obtener historiales del paciente',
        detalles: error.message
      });
    }
  }

  // ===== HISTORIALES POR DOCTOR =====
  static async obtenerHistorialesDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const opciones = {
        limite: req.query.limite || 10,
        pagina: req.query.pagina || 1,
        estado: req.query.estado,
        fechaInicio: req.query.fecha_inicio,
        fechaFin: req.query.fecha_fin
      };

      const resultado = await HistorialClinico.obtenerHistorialesMedico(doctorId, opciones);

      res.json({
        mensaje: 'Historiales del doctor obtenidos exitosamente',
        historiales: resultado.rows,
        total: resultado.count,
        pagina: parseInt(opciones.pagina),
        totalPaginas: Math.ceil(resultado.count / parseInt(opciones.limite))
      });

    } catch (error) {
      console.error('Error obteniendo historiales del doctor:', error);
      res.status(500).json({
        error: 'Error al obtener historiales del doctor',
        detalles: error.message
      });
    }
  }

  // ===== GESTIÓN DE PDFs =====
  static async guardarPDF(req, res) {
    try {
      const { id } = req.params;
      const usuario = req.user || { id: 1 };
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      if (!req.file) {
        return res.status(400).json({
          error: 'Archivo PDF requerido'
        });
      }

      const pdfHistorial = await HistorialService.guardarPDF(
        id, 
        req.file.buffer, 
        usuario, 
        ip, 
        userAgent
      );

      res.json({
        mensaje: 'PDF guardado exitosamente',
        pdf: {
          id: pdfHistorial.id,
          nombre: pdfHistorial.nombre_archivo,
          tamaño: pdfHistorial.tamaño
        }
      });

    } catch (error) {
      console.error('Error guardando PDF:', error);
      res.status(500).json({
        error: 'Error al guardar PDF',
        detalles: error.message
      });
    }
  }

  static async descargarPDF(req, res) {
    try {
      const { id } = req.params;
      const usuario = req.user || { id: 1 };
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const pdfHistorial = await HistorialService.obtenerPDF(id, usuario, ip, userAgent);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${pdfHistorial.nombre_archivo}"`);
      res.send(pdfHistorial.contenido_pdf);

    } catch (error) {
      console.error('Error descargando PDF:', error);
      res.status(500).json({
        error: 'Error al descargar PDF',
        detalles: error.message
      });
    }
  }

  static async generarPDF(req, res) {
    try {
      const { id } = req.params;
      
      // Implementar generación de PDF aquí
      // Por ahora retornamos un mensaje
      res.json({
        mensaje: 'Generación de PDF en desarrollo',
        historialId: id
      });

    } catch (error) {
      console.error('Error generando PDF:', error);
      res.status(500).json({
        error: 'Error al generar PDF',
        detalles: error.message
      });
    }
  }

  // ===== VERSIONES DIGITALES =====
  static async guardarVersionDigital(req, res) {
    try {
      const { id } = req.params;
      const { datos_completos, comentario } = req.body;
      const usuario = req.user || { id: 1 };
      const ip = req.ip || req.connection.remoteAddress;
      const userAgent = req.get('User-Agent');

      const versionDigital = await HistorialService.guardarVersionDigital(
        id,
        datos_completos,
        usuario,
        comentario,
        ip,
        userAgent
      );

      res.json({
        mensaje: 'Versión digital guardada exitosamente',
        version: versionDigital
      });

    } catch (error) {
      console.error('Error guardando versión digital:', error);
      res.status(500).json({
        error: 'Error al guardar versión digital',
        detalles: error.message
      });
    }
  }

  static async obtenerVersionesDigitales(req, res) {
    try {
      const { id } = req.params;

      const versiones = await VersionDigitalHistorial.obtenerVersionesPorHistorial(id);

      res.json({
        mensaje: 'Versiones obtenidas exitosamente',
        versiones
      });

    } catch (error) {
      console.error('Error obteniendo versiones:', error);
      res.status(500).json({
        error: 'Error al obtener versiones',
        detalles: error.message
      });
    }
  }

  static async obtenerVersionDigital(req, res) {
    try {
      const { id, versionId } = req.params;

      const version = await VersionDigitalHistorial.findByPk(versionId);

      if (!version || version.historial_id !== parseInt(id)) {
        return res.status(404).json({
          error: 'Versión no encontrada'
        });
      }

      res.json({
        mensaje: 'Versión obtenida exitosamente',
        version
      });

    } catch (error) {
      console.error('Error obteniendo versión:', error);
      res.status(500).json({
        error: 'Error al obtener versión',
        detalles: error.message
      });
    }
  }

  // ===== ESTADÍSTICAS =====
  static async obtenerEstadisticas(req, res) {
    try {
      const filtros = {
        doctorId: req.query.doctor_id,
        fechaInicio: req.query.fecha_inicio,
        fechaFin: req.query.fecha_fin
      };

      const estadisticas = await HistorialService.obtenerEstadisticas(filtros);

      res.json({
        mensaje: 'Estadísticas obtenidas exitosamente',
        estadisticas
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas',
        detalles: error.message
      });
    }
  }

  static async obtenerEstadisticasDoctor(req, res) {
    try {
      const { doctorId } = req.params;
      const filtros = {
        doctorId,
        fechaInicio: req.query.fecha_inicio,
        fechaFin: req.query.fecha_fin
      };

      const estadisticas = await HistorialService.obtenerEstadisticas(filtros);

      res.json({
        mensaje: 'Estadísticas del doctor obtenidas exitosamente',
        estadisticas
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas del doctor:', error);
      res.status(500).json({
        error: 'Error al obtener estadísticas del doctor',
        detalles: error.message
      });
    }
  }

  // ===== VALIDACIÓN Y COMPLETITUD =====
  static async validarCompletitud(req, res) {
    try {
      const { id } = req.params;

      const historial = await HistorialClinico.findByPk(id);
      
      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      const validacion = historial.validarCompletitud();

      res.json({
        mensaje: 'Validación completada',
        validacion
      });

    } catch (error) {
      console.error('Error validando completitud:', error);
      res.status(500).json({
        error: 'Error al validar completitud',
        detalles: error.message
      });
    }
  }

  static async obtenerResumen(req, res) {
    try {
      const { id } = req.params;

      const historial = await HistorialClinico.findByPk(id);
      
      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      const resumen = historial.generarResumen();

      res.json({
        mensaje: 'Resumen obtenido exitosamente',
        resumen
      });

    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        error: 'Error al obtener resumen',
        detalles: error.message
      });
    }
  }

  // ===== AUDITORÍA =====
  static async obtenerAuditoria(req, res) {
    try {
      const { id } = req.params;
      const opciones = {
        limite: req.query.limite || 50,
        pagina: req.query.pagina || 1
      };

      const auditoria = await AuditoriaHistorial.obtenerPorHistorial(id, opciones);

      res.json({
        mensaje: 'Auditoría obtenida exitosamente',
        auditoria: auditoria.rows,
        total: auditoria.count,
        pagina: parseInt(opciones.pagina),
        totalPaginas: Math.ceil(auditoria.count / parseInt(opciones.limite))
      });

    } catch (error) {
      console.error('Error obteniendo auditoría:', error);
      res.status(500).json({
        error: 'Error al obtener auditoría',
        detalles: error.message
      });
    }
  }

  // ===== SECCIONES ESPECÍFICAS =====
  static async actualizarSeccion(req, res) {
    try {
      const { id, seccion } = req.params;
      const datos = req.body;

      const historial = await HistorialClinico.findByPk(id);
      
      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      const seccionesValidas = [
        'datos_personales',
        'ficha_identificacion',
        'motivo_consulta',
        'antecedentes_heredo_familiares',
        'antecedentes_personales_no_patologicos',
        'antecedentes_personales_patologicos',
        'examen_extrabucal',
        'examen_intrabucal',
        'plan_tratamiento'
      ];

      if (!seccionesValidas.includes(seccion)) {
        return res.status(400).json({
          error: 'Sección no válida'
        });
      }

      await historial.update({
        [seccion]: datos
      });

      res.json({
        mensaje: 'Sección actualizada exitosamente',
        seccion,
        datos
      });

    } catch (error) {
      console.error('Error actualizando sección:', error);
      res.status(500).json({
        error: 'Error al actualizar sección',
        detalles: error.message
      });
    }
  }

  static async obtenerSeccion(req, res) {
    try {
      const { id, seccion } = req.params;

      const historial = await HistorialClinico.findByPk(id);
      
      if (!historial) {
        return res.status(404).json({
          error: 'Historial no encontrado'
        });
      }

      const datos = historial[seccion];

      res.json({
        mensaje: 'Sección obtenida exitosamente',
        seccion,
        datos
      });

    } catch (error) {
      console.error('Error obteniendo sección:', error);
      res.status(500).json({
        error: 'Error al obtener sección',
        detalles: error.message
      });
    }
  }

  // ===== EXPORTACIÓN =====
  static async exportarHistorial(req, res) {
    try {
      const { id, formato } = req.params;

      res.json({
        mensaje: 'Exportación en desarrollo',
        historialId: id,
        formato
      });

    } catch (error) {
      console.error('Error exportando historial:', error);
      res.status(500).json({
        error: 'Error al exportar historial',
        detalles: error.message
      });
    }
  }

  static async exportarHistorialesLote(req, res) {
    try {
      const { historiales, formato } = req.body;

      res.json({
        mensaje: 'Exportación en lote en desarrollo',
        historiales,
        formato
      });

    } catch (error) {
      console.error('Error exportando historiales en lote:', error);
      res.status(500).json({
        error: 'Error al exportar historiales en lote',
        detalles: error.message
      });
    }
  }
}

module.exports = HistorialClinicoController;