
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306
};

async function quickMigrate() {
  console.log('🚀 Migración rápida de contraseñas...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Obtener usuarios con contraseñas en texto plano
    const [users] = await connection.execute(`
      SELECT id, email, password, rol 
      FROM usuarios 
      WHERE password NOT LIKE '$2%' AND LENGTH(password) < 50
    `);

    console.log(`📋 Encontrados ${users.length} usuarios para migrar`);

    if (users.length === 0) {
      console.log('✅ No hay contraseñas que migrar');
      await connection.end();
      return;
    }

    console.log('\n📝 Migrando usuarios:');
    
    for (const user of users) {
      try {
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        await connection.execute(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log(`✅ ${user.email} (${user.rol}) - "${user.password}" → hasheada`);
        
      } catch (error) {
        console.error(`❌ Error migrando ${user.email}:`, error.message);
      }
    }

    // Mostrar estado final
    const [finalUsers] = await connection.execute(`
      SELECT email, rol, 
        CASE 
          WHEN password LIKE '$2%' THEN '🔒 Hasheada'
          ELSE '⚠️  Texto plano'
        END as password_status
      FROM usuarios 
      ORDER BY rol, email
    `);
    
    console.log('\n📊 Estado final:');
    finalUsers.forEach(user => {
      console.log(`  ${user.password_status} ${user.email} (${user.rol})`);
    });

    await connection.end();
    console.log('\n🎉 Migración completada');

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

quickMigrate();