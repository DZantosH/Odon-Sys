// models/VersionDigitalHistorial.js
module.exports = (sequelize, DataTypes) => {
  const VersionDigitalHistorial = sequelize.define('VersionDigitalHistorial', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    historial_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'historiales_clinicos',
        key: 'id'
      }
    },
    datos_completos: {
      type: DataTypes.JSON,
      allowNull: false,
      comment: 'Datos completos del historial para edición'
    },
    fecha_guardado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    version: {
      type: DataTypes.STRING(10),
      allowNull: false,
      defaultValue: '1.0'
    },
    editable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    usuario_creacion: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    hash_integridad: {
      type: DataTypes.STRING(64),
      allowNull: false,
      comment: 'Hash para verificar integridad'
    },
    version_anterior_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'versiones_digitales_historiales',
        key: 'id'
      }
    },
    comentario_cambios: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'versiones_digitales_historiales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['historial_id', 'fecha_guardado']
      },
      {
        fields: ['version']
      }
    ]
  });

  // Métodos del modelo
  VersionDigitalHistorial.prototype.esEditable = function() {
    return this.editable && !this.version_anterior_id;
  };

  // Método estático para obtener versiones por historial
  VersionDigitalHistorial.obtenerVersionesPorHistorial = async function(historialId) {
    return await this.findAll({
      where: { historial_id: historialId },
      order: [['fecha_guardado', 'DESC']]
    });
  };

  // Método estático para obtener la versión más reciente
  VersionDigitalHistorial.obtenerVersionReciente = async function(historialId) {
    return await this.findOne({
      where: { historial_id: historialId },
      order: [['fecha_guardado', 'DESC']]
    });
  };

  return VersionDigitalHistorial;
};