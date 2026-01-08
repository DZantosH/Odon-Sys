// models/PDFHistorial.js
module.exports = (sequelize, DataTypes) => {
  const PDFHistorial = sequelize.define('PDFHistorial', {
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
    nombre_archivo: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    contenido_pdf: {
      type: DataTypes.BLOB('long'),
      allowNull: false,
      comment: 'Contenido binario del PDF'
    },
    tamaño: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Tamaño en bytes'
    },
    fecha_guardado: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    usuario_guardado: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    hash_archivo: {
      type: DataTypes.STRING(64),
      allowNull: true,
      comment: 'Hash SHA256 del archivo'
    }
  }, {
    tableName: 'pdfs_historiales',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      {
        fields: ['historial_id']
      },
      {
        fields: ['fecha_guardado']
      }
    ]
  });

  // Métodos del modelo
  PDFHistorial.prototype.obtenerTamaño = function() {
    return `${(this.tamaño / 1024 / 1024).toFixed(2)} MB`;
  };

  // Método estático para obtener PDFs por historial
  PDFHistorial.obtenerPorHistorial = async function(historialId) {
    return await this.findAll({
      where: { historial_id: historialId },
      order: [['fecha_guardado', 'DESC']]
    });
  };

  return PDFHistorial;
};