// models/AuditoriaHistorial.js
module.exports = (sequelize, DataTypes) => {
  const AuditoriaHistorial = sequelize.define('AuditoriaHistorial', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    historial_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'historiales_clinicos',
        key: 'id'
      }
    },
    accion: {
      type: DataTypes.ENUM(
        'CREAR_HISTORIAL',
        'GUARDAR_PDF',
        'GUARDAR_VERSION_DIGITAL',
        'ACTUALIZAR_VERSION_DIGITAL',
        'DESCARGAR_PDF',
        'EDITAR_HISTORIAL',
        'ELIMINAR_HISTORIAL',
        'VER_HISTORIAL'
      ),
      allowNull: false
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    detalles: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Detalles adicionales de la acción'
    },
    fecha: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    ip: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'auditoria_historiales',
    timestamps: false,
    indexes: [
      {
        fields: ['historial_id']
      },
      {
        fields: ['usuario_id']
      },
      {
        fields: ['accion']
      },
      {
        fields: ['fecha']
      }
    ]
  });

  // Método estático para registrar una acción
  AuditoriaHistorial.registrarAccion = async function(datos) {
    const { historialId, accion, usuarioId, detalles, ip, userAgent } = datos;
    
    return await this.create({
      historial_id: historialId,
      accion,
      usuario_id: usuarioId,
      detalles: detalles || null,
      ip: ip || null,
      user_agent: userAgent || null
    });
  };

  // Método estático para obtener auditoría por historial
  AuditoriaHistorial.obtenerPorHistorial = async function(historialId, opciones = {}) {
    const { limite = 50, pagina = 1 } = opciones;
    
    return await this.findAndCountAll({
      where: { historial_id: historialId },
      order: [['fecha', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite)
    });
  };

  // Método estático para obtener auditoría por usuario
  AuditoriaHistorial.obtenerPorUsuario = async function(usuarioId, opciones = {}) {
    const { limite = 50, pagina = 1, fechaInicio, fechaFin } = opciones;
    
    const where = { usuario_id: usuarioId };
    
    if (fechaInicio || fechaFin) {
      where.fecha = {};
      if (fechaInicio) where.fecha[sequelize.Sequelize.Op.gte] = fechaInicio;
      if (fechaFin) where.fecha[sequelize.Sequelize.Op.lte] = fechaFin;
    }
    
    return await this.findAndCountAll({
      where,
      order: [['fecha', 'DESC']],
      limit: parseInt(limite),
      offset: (parseInt(pagina) - 1) * parseInt(limite)
    });
  };

  return AuditoriaHistorial;
};