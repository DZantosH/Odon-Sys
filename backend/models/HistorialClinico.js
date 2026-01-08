// models/HistorialClinico.js - TU ARCHIVO ADAPTADO PARA EL SISTEMA
module.exports = (sequelize, DataTypes) => {
  const HistorialClinico = sequelize.define('HistorialClinico', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    paciente_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'pacientes',
        key: 'id'
      }
    },
    doctor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    cita_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'citas',
        key: 'id'
      }
    },
    fecha_consulta: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    estado: {
      type: DataTypes.ENUM('borrador', 'en_proceso', 'completado', 'archivado'),
      allowNull: false,
      defaultValue: 'borrador'
    },
    version: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '1.0'
    },
    
    // ===== DATOS DEL HISTORIAL =====
    datos_personales: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Información personal del paciente'
    },
    ficha_identificacion: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Datos de identificación'
    },
    motivo_consulta: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Motivo de la consulta'
    },
    antecedentes_heredo_familiares: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Antecedentes familiares'
    },
    antecedentes_personales_no_patologicos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Hábitos y estilo de vida'
    },
    antecedentes_personales_patologicos: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Enfermedades previas'
    },
    examen_extrabucal: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Examen físico extrabucal'
    },
    examen_intrabucal: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Examen intrabucal'
    },
    
    // ===== INFORMACIÓN DEL PDF =====
    pdf_filename: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Nombre del archivo PDF'
    },
    pdf_path: {
      type: DataTypes.STRING(500),
      allowNull: true,
      comment: 'Ruta del archivo PDF'
    },
    pdf_size: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Tamaño del PDF en bytes'
    },
    pdf_guardado_en: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Fecha de guardado del PDF'
    },
    
    // ===== DIAGNÓSTICO Y TRATAMIENTO =====
    diagnostico: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Diagnóstico principal'
    },
    tratamiento: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Tratamiento realizado'
    },
    plan_tratamiento: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Plan de tratamiento futuro'
    },
    
    // ===== AUDITORÍA =====
    creado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    actualizado_por: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    ip_creacion: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'historiales_clinicos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['paciente_id']
      },
      {
        fields: ['doctor_id']
      },
      {
        fields: ['estado']
      },
      {
        fields: ['fecha_consulta']
      },
      {
        fields: ['created_at']
      }
    ]
  });

  // ===== MÉTODOS DEL MODELO =====

  // Método para validar completitud del historial
  HistorialClinico.prototype.validarCompletitud = function() {
    const seccionesRequeridas = [
      'datos_personales',
      'ficha_identificacion', 
      'motivo_consulta',
      'antecedentes_heredo_familiares',
      'antecedentes_personales_no_patologicos',
      'antecedentes_personales_patologicos',
      'examen_extrabucal',
      'examen_intrabucal'
    ];
    
    const errores = [];
    let completitud = 0;
    
    seccionesRequeridas.forEach(seccion => {
      try {
        if (this[seccion] && Object.keys(typeof this[seccion] === 'string' ? JSON.parse(this[seccion]) : this[seccion] || {}).length > 0) {
          completitud++;
        } else {
          errores.push(`Sección ${seccion} está incompleta`);
        }
      } catch (error) {
        errores.push(`Error en sección ${seccion}: ${error.message}`);
      }
    });
    
    return {
      esCompleto: errores.length === 0,
      porcentajeCompletitud: Math.round((completitud / seccionesRequeridas.length) * 100),
      errores: errores,
      seccionesCompletas: completitud,
      totalSecciones: seccionesRequeridas.length
    };
  };

  // Método para generar resumen del historial
  HistorialClinico.prototype.generarResumen = function() {
    try {
      const datosPersonales = typeof this.datos_personales === 'string' ? 
        JSON.parse(this.datos_personales || '{}') : (this.datos_personales || {});
      const motivoConsulta = typeof this.motivo_consulta === 'string' ? 
        JSON.parse(this.motivo_consulta || '{}') : (this.motivo_consulta || {});
      const antecedentesPatologicos = typeof this.antecedentes_personales_patologicos === 'string' ? 
        JSON.parse(this.antecedentes_personales_patologicos || '{}') : (this.antecedentes_personales_patologicos || {});
      
      return {
        paciente: {
          nombre: `${datosPersonales.nombre || ''} ${datosPersonales.apellidoPaterno || ''} ${datosPersonales.apellidoMaterno || ''}`.trim(),
          edad: this.calcularEdad(datosPersonales.fechaNacimiento),
          sexo: datosPersonales.sexo || 'No especificado'
        },
        consulta: {
          motivo: motivoConsulta.motivo || 'No especificado',
          dolor: motivoConsulta.escalaDolor || 0,
          urgencia: motivoConsulta.nivelUrgencia || 'No especificado',
          fechaConsulta: this.fecha_consulta
        },
        signosVitales: antecedentesPatologicos.signos_vitales || {},
        estado: this.estado,
        version: this.version,
        tienePDF: !!this.pdf_filename
      };
    } catch (error) {
      console.error('Error generando resumen:', error);
      return {
        paciente: { nombre: 'Error al procesar', edad: null, sexo: 'No especificado' },
        consulta: { motivo: 'Error al procesar', dolor: 0, urgencia: 'No especificado', fechaConsulta: this.fecha_consulta },
        signosVitales: {},
        estado: this.estado,
        version: this.version,
        tienePDF: !!this.pdf_filename
      };
    }
  };

  // Método para calcular edad
  HistorialClinico.prototype.calcularEdad = function(fechaNacimiento) {
    if (!fechaNacimiento) return null;
    
    try {
      const hoy = new Date();
      const nacimiento = new Date(fechaNacimiento);
      let edad = hoy.getFullYear() - nacimiento.getFullYear();
      
      const mes = hoy.getMonth() - nacimiento.getMonth();
      if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
      }
      
      return edad;
    } catch (error) {
      console.error('Error calculando edad:', error);
      return null;
    }
  };

  // ===== MÉTODOS ESTÁTICOS =====

  // Obtener historiales de un paciente con paginación
  HistorialClinico.obtenerHistorialesPaciente = async function(pacienteId, opciones = {}) {
    const { limite = 10, pagina = 1, estado } = opciones;
    
    const where = { paciente_id: pacienteId };
    if (estado) where.estado = estado;
    
    return await this.findAndCountAll({
      where,
      order: [['fecha_consulta', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite)
    });
  };

  // Obtener historiales de un médico con filtros
  HistorialClinico.obtenerHistorialesMedico = async function(medicoId, opciones = {}) {
    const { limite = 10, pagina = 1, estado, fechaInicio, fechaFin } = opciones;
    
    const where = { doctor_id: medicoId };
    if (estado) where.estado = estado;
    
    if (fechaInicio || fechaFin) {
      where.fecha_consulta = {};
      if (fechaInicio) where.fecha_consulta[sequelize.Sequelize.Op.gte] = fechaInicio;
      if (fechaFin) where.fecha_consulta[sequelize.Sequelize.Op.lte] = fechaFin;
    }
    
    return await this.findAndCountAll({
      where,
      order: [['fecha_consulta', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite)
    });
  };

  // Buscar por RFC del paciente
  HistorialClinico.buscarPorRFC = async function(rfc) {
    return await this.findAll({
      order: [['fecha_consulta', 'DESC']],
      limit: 10
    });
  };

  // Estadísticas generales
  HistorialClinico.obtenerEstadisticas = async function(filtros = {}) {
    const where = {};
    if (filtros.doctor_id) where.doctor_id = filtros.doctor_id;
    if (filtros.fechaInicio || filtros.fechaFin) {
      where.created_at = {};
      if (filtros.fechaInicio) where.created_at[sequelize.Sequelize.Op.gte] = filtros.fechaInicio;
      if (filtros.fechaFin) where.created_at[sequelize.Sequelize.Op.lte] = filtros.fechaFin;
    }
    
    const [total, porEstado, conPDF, ultimoMes] = await Promise.all([
      // Total de historiales
      this.count({ where }),
      
      // Por estado
      this.findAll({
        where,
        attributes: [
          'estado',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['estado'],
        raw: true
      }),
      
      // Con PDF generado
      this.count({ 
        where: { 
          ...where, 
          pdf_filename: { [sequelize.Sequelize.Op.not]: null } 
        } 
      }),
      
      // Último mes
      this.count({
        where: {
          ...where,
          created_at: {
            [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
          }
        }
      })
    ]);
    
    return {
      total,
      porEstado,
      conPDF,
      ultimoMes,
      porcentajePDF: total > 0 ? Math.round((conPDF / total) * 100) : 0
    };
  };

  // ===== HOOKS DEL MODELO =====

  // Hook antes de crear
  HistorialClinico.beforeCreate((historial, options) => {
    historial.ip_creacion = options.ip || null;
    historial.user_agent = options.userAgent || null;
  });

  // Hook antes de actualizar
  HistorialClinico.beforeUpdate((historial, options) => {
    // Actualizar fecha de modificación automáticamente
    historial.updated_at = new Date();
  });

  const verificarGuardado = async (pacienteId, historialId) => {
  console.log('🔍 VERIFICANDO GUARDADO DEL HISTORIAL:');
  console.log('- Paciente ID:', pacienteId);
  console.log('- Historial ID:', historialId);
  
  // Verificar en diferentes endpoints
  const endpoints = [
    `/historial/${historialId}`,
    `/historial/pacientes/${pacienteId}/historial`,
    `/historiales-clinicos/paciente/${pacienteId}`,
    `/pacientes/${pacienteId}/historial`
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await fetch(buildApiUrl(endpoint), {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`📡 ${endpoint}: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Datos en ${endpoint}:`, data);
      } else {
        console.log(`❌ Error en ${endpoint}:`, response.status);
      }
    } catch (error) {
      console.log(`💥 Excepción en ${endpoint}:`, error.message);
    }
  }
};

  return HistorialClinico;
};