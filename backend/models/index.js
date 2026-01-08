// models/index.js - Configuración principal de Sequelize
const { Sequelize, DataTypes } = require('sequelize');

// Configuración de la base de datos
const sequelize = new Sequelize(
  process.env.DB_NAME || 'u984674772_odonto',
  process.env.DB_USER || 'u984674772_rootodon', 
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || 'srv1711.hstgr.io',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: false,
      freezeTableName: true
    }
  }
);

// Probar conexión
sequelize.authenticate()
  .then(() => {
    console.log('✅ Conexión a MySQL establecida correctamente');
  })
  .catch(err => {
    console.error('❌ Error conectando a MySQL:', err);
  });

// Importar modelos
const Usuario = require('./Usuario')(sequelize, DataTypes);
const Paciente = require('./Paciente')(sequelize, DataTypes);
const HistorialClinico = require('./HistorialClinico')(sequelize, DataTypes);
const PDFHistorial = require('./PDFHistorial')(sequelize, DataTypes);
const VersionDigitalHistorial = require('./VersionDigitalHistorial')(sequelize, DataTypes);
const AuditoriaHistorial = require('./AuditoriaHistorial')(sequelize, DataTypes);

// Definir relaciones
// Usuario (Doctor) tiene muchos historiales
Usuario.hasMany(HistorialClinico, {
  foreignKey: 'doctor_id',
  as: 'historialesToCome'
});

HistorialClinico.belongsTo(Usuario, {
  foreignKey: 'doctor_id',
  as: 'doctor'
});

// Paciente tiene muchos historiales
Paciente.hasMany(HistorialClinico, {
  foreignKey: 'paciente_id',
  as: 'historiales'
});

HistorialClinico.belongsTo(Paciente, {
  foreignKey: 'paciente_id',
  as: 'paciente'
});

// Historial puede tener muchos PDFs
HistorialClinico.hasMany(PDFHistorial, {
  foreignKey: 'historial_id',
  as: 'pdfs'
});

PDFHistorial.belongsTo(HistorialClinico, {
  foreignKey: 'historial_id',
  as: 'historial'
});

// Historial puede tener muchas versiones digitales
HistorialClinico.hasMany(VersionDigitalHistorial, {
  foreignKey: 'historial_id',
  as: 'versionesDigitales'
});

VersionDigitalHistorial.belongsTo(HistorialClinico, {
  foreignKey: 'historial_id',
  as: 'historial'
});

// Usuario creó versiones digitales
Usuario.hasMany(VersionDigitalHistorial, {
  foreignKey: 'usuario_creacion',
  as: 'versionesCreadas'
});

VersionDigitalHistorial.belongsTo(Usuario, {
  foreignKey: 'usuario_creacion',
  as: 'usuarioCreador'
});

// Historial tiene auditorías
HistorialClinico.hasMany(AuditoriaHistorial, {
  foreignKey: 'historial_id',
  as: 'auditorias'
});

AuditoriaHistorial.belongsTo(HistorialClinico, {
  foreignKey: 'historial_id',
  as: 'historial'
});

// Usuario realizó auditorías
Usuario.hasMany(AuditoriaHistorial, {
  foreignKey: 'usuario_id',
  as: 'auditoriasRealizadas'
});

AuditoriaHistorial.belongsTo(Usuario, {
  foreignKey: 'usuario_id',
  as: 'usuario'
});

// Exportar todo
module.exports = {
  sequelize,
  Sequelize,
  Usuario,
  Paciente,
  HistorialClinico,
  PDFHistorial,
  VersionDigitalHistorial,
  AuditoriaHistorial
};