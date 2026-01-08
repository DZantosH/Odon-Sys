const mysql = require('mysql2/promise');
require('dotenv').config();

console.log('🔍 Configuración de BD:');
console.log('Host:', process.env.DB_HOST);
console.log('User:', process.env.DB_USER);
console.log('Database:', process.env.DB_NAME);
console.log('Port:', process.env.DB_PORT);

// Configuración para túnel SSH local
const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  charset: 'utf8mb4',
  
  // Timeouts
  connectTimeout: 10000,
  acquireTimeout: 10000,
  
  // Pool
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  
  // IMPORTANTE: Sin SSL para túnel SSH
  ssl: false
};

console.log('🔧 Pool configurado con límite de', dbConfig.connectionLimit, 'conexiones');

// Crear el pool
const pool = mysql.createPool(dbConfig);

// Eventos del pool
pool.on('connection', (connection) => {
  console.log('✅ Nueva conexión BD establecida:', connection.threadId);
});

pool.on('error', (err) => {
  console.error('❌ Error en pool BD:', err.code);
});

// Función de conexión con retry
const testConnection = async (retries = 3) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🔄 Probando conexión a BD (intento ${attempt}/${retries})...`);
      
      const connection = await pool.getConnection();
      console.log('✅ Conexión a base de datos exitosa');
      
      const [result] = await connection.execute('SELECT 1 as test, NOW() as timestamp');
      console.log('✅ Query de prueba exitosa:', result[0]);
      
      connection.release();
      return true;
      
    } catch (err) {
      console.error(`❌ Intento ${attempt} falló:`, err.message);
      console.error('❌ Código de error:', err.code);
      
      if (attempt === retries) {
        console.error('❌ Todos los intentos fallaron');
        return false;
      }
      
      const delay = attempt * 2000;
      console.log(`⏳ Esperando ${delay/1000}s antes del siguiente intento...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  return false;
};

// Función para ejecutar queries
const executeQuery = async (query, params = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('❌ Error en query:', error.message);
    throw error;
  }
};

module.exports = { 
  pool, 
  testConnection, 
  executeQuery 
};
