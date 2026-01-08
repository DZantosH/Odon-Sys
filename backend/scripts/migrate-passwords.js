

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

async function migratePasswords() {
  console.log('🔄 Iniciando migración de contraseñas a bcrypt...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');

    // Obtener todos los usuarios con contraseñas en texto plano
    const [users] = await connection.execute(`
      SELECT id, email, password, rol 
      FROM usuarios 
      WHERE LENGTH(password) < 50 -- Contraseñas en texto plano son cortas
    `);

    console.log(`📋 Encontrados ${users.length} usuarios con contraseñas en texto plano`);

    if (users.length === 0) {
      console.log('✅ No hay contraseñas que migrar');
      await connection.end();
      return;
    }

    // Mostrar usuarios que se van a migrar
    console.log('\n📝 Usuarios a migrar:');
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.rol}) - Password actual: "${user.password}"`);
    });

    // Confirmar migración
    console.log('\n⚠️  IMPORTANTE: Esta operación cambiará todas las contraseñas a bcrypt');
    console.log('   Los usuarios deberán usar sus contraseñas actuales para hacer login');
    
    // Migrar cada usuario
    for (const user of users) {
      try {
        // Hashear la contraseña actual
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(user.password, saltRounds);
        
        // Actualizar en la base de datos
        await connection.execute(
          'UPDATE usuarios SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log(`✅ Migrado: ${user.email}`);
        
        // Verificar que el hash funciona
        const isValid = await bcrypt.compare(user.password, hashedPassword);
        if (!isValid) {
          console.error(`❌ ERROR: Verificación falló para ${user.email}`);
        }
        
      } catch (error) {
        console.error(`❌ Error migrando ${user.email}:`, error.message);
      }
    }

    console.log('\n🎉 Migración completada');
    console.log('\n📋 Credenciales actualizadas:');
    
    // Mostrar las credenciales finales
    const [updatedUsers] = await connection.execute(`
      SELECT id, email, password, rol 
      FROM usuarios 
      ORDER BY rol, email
    `);
    
    updatedUsers.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`     Rol: ${user.rol}`);
      console.log(`     Password hash: ${user.password.substring(0, 20)}...`);
      console.log('');
    });

    await connection.end();
    console.log('✅ Conexión cerrada');

  } catch (error) {
    console.error('❌ Error en la migración:', error);
    process.exit(1);
  }
}

// Función para crear un usuario administrador de prueba
async function createTestAdmin() {
  console.log('🔧 Creando usuario administrador de prueba...');
  
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    const testEmail = 'admin@test.com';
    const testPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(testPassword, 10);
    
    // Verificar si ya existe
    const [existing] = await connection.execute(
      'SELECT id FROM usuarios WHERE email = ?',
      [testEmail]
    );
    
    if (existing.length > 0) {
      console.log('⚠️  El usuario de prueba ya existe');
      await connection.end();
      return;
    }
    
    // Crear usuario de prueba
    await connection.execute(`
      INSERT INTO usuarios (
        nombre, apellido_paterno, email, password, rol, activo, fecha_creacion
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())
    `, [
      'Admin',
      'Test',
      testEmail,
      hashedPassword,
      'Administrador',
      true
    ]);
    
    console.log('✅ Usuario administrador de prueba creado:');
    console.log(`   📧 Email: ${testEmail}`);
    console.log(`   🔑 Password: ${testPassword}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error creando usuario de prueba:', error);
  }
}

// Ejecutar migración
if (require.main === module) {
  console.log('🚀 OdontoSys - Migración de Contraseñas\n');
  
  // Preguntar qué hacer
  const args = process.argv.slice(2);
  
  if (args.includes('--test-admin')) {
    createTestAdmin();
  } else if (args.includes('--help')) {
    console.log('Uso:');
    console.log('  node migrate-passwords.js          # Migrar contraseñas existentes');
    console.log('  node migrate-passwords.js --test-admin  # Crear admin de prueba');
    console.log('  node migrate-passwords.js --help        # Mostrar ayuda');
  } else {
    migratePasswords();
  }
}

module.exports = { migratePasswords, createTestAdmin };