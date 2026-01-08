// models/Paciente.js
module.exports = (sequelize, DataTypes) => {
  const Paciente = sequelize.define('Paciente', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido_paterno: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    apellido_materno: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    fecha_nacimiento: {
      type: DataTypes.DATE,
      allowNull: false
    },
    sexo: {
      type: DataTypes.ENUM('M', 'F'),
      allowNull: false
    },
    rfc: {
      type: DataTypes.STRING(13),
      allowNull: true,
      unique: true
    },
    telefono: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    correo_electronico: {
      type: DataTypes.STRING(150),
      allowNull: true
    },
    direccion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ocupacion: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    estado_civil: {
      type: DataTypes.ENUM('Soltero', 'Casado', 'Divorciado', 'Viudo', 'Unión libre'),
      allowNull: true
    },
    contacto_emergencia: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    telefono_emergencia: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  }, {
    tableName: 'pacientes',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    
    // Métodos de instancia
    instanceMethods: {
      calcularEdad: function() {
        const hoy = new Date();
        const nacimiento = new Date(this.fecha_nacimiento);
        let edad = hoy.getFullYear() - nacimiento.getFullYear();
        const mes = hoy.getMonth() - nacimiento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
          edad--;
        }
        
        return edad;
      }
    }
  });

  // Método estático para buscar por RFC
  Paciente.buscarPorRFC = function(rfc) {
    return this.findOne({
      where: { rfc: rfc.toUpperCase(), activo: true }
    });
  };

  return Paciente;
};