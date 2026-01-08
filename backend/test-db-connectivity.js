// test-db-connectivity.js
// Prueba específica de conectividad a Hostinger

const mysql = require('mysql2/promise');
require('dotenv').config();

async function testHostingerConnection() {
    console.log('🔍 PROBANDO CONECTIVIDAD A HOSTINGER DESDE LOCALHOST');
    console.log('====================================================');
    
    console.log('\n📋 Configuración actual (.env):');
    console.log('Host:', process.env.DB_HOST);
    console.log('Usuario:', process.env.DB_USER);
    console.log('Base de datos:', process.env.DB_NAME);
    console.log('Puerto:', process.env.DB_PORT);
    
    // Configuraciones a probar
    const configs = [
        {
            name: 'Configuración actual (.env)',
            config: {
                host: process.env.DB_HOST,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT || 3306
            }
        },
        {
            name: 'Configuración VPS (srv1006.hstgr.io + Angelyael20@)',
            config: {
                host: 'srv1006.hstgr.io',
                user: 'u984674772_rootodon',
                password: 'Angelyael20@',
                database: 'u984674772_odonto',
                port: 3306
            }
        },
        {
            name: 'Configuración localhost actual (srv1711.hstgr.io + Odon321@)',
            config: {
                host: 'srv1711.hstgr.io',
                user: 'u984674772_rootodon',
                password: 'Odon321@',
                database: 'u984674772_odonto',
                port: 3306
            }
        }
    ];
    
    for (const { name, config } of configs) {
        console.log(`\n🧪 Probando: ${name}`);
        console.log(`   Host: ${config.host}`);
        console.log(`   Usuario: ${config.user}`);
        console.log(`   BD: ${config.database}`);
        
        try {
            const connection = await mysql.createConnection({
                ...config,
                connectTimeout: 30000,
                acquireTimeout: 30000,
                timeout: 30000
            });
            
            console.log('   ✅ Conexión establecida');
            
            // Probar consulta básica
            const [result] = await connection.execute('SELECT 1 as test, NOW() as tiempo');
            console.log('   ✅ Query básica OK:', result[0]);
            
            // Probar tabla tipos_consulta
            try {
                const [tipos] = await connection.execute('SELECT COUNT(*) as total FROM tipos_consulta WHERE activo = 1');
                console.log('   ✅ Tipos de consulta:', tipos[0].total);
            } catch (err) {
                console.log('   ❌ Error en tipos_consulta:', err.message);
            }
            
            // Probar tabla pacientes
            try {
                const [pacientes] = await connection.execute('SELECT COUNT(*) as total FROM pacientes WHERE activo = 1');
                console.log('   ✅ Pacientes:', pacientes[0].total);
            } catch (err) {
                console.log('   ❌ Error en pacientes:', err.message);
            }
            
            await connection.end();
            console.log('   ✅ Conexión cerrada correctamente');
            
        } catch (error) {
            console.log('   ❌ Error de conexión:', error.code || error.message);
            
            if (error.code === 'ECONNREFUSED') {
                console.log('   💡 El servidor rechaza la conexión');
            } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
                console.log('   💡 Credenciales incorrectas');
            } else if (error.code === 'ENOTFOUND') {
                console.log('   💡 No se puede resolver el host');
            } else if (error.code === 'ETIMEDOUT') {
                console.log('   💡 Timeout de conexión');
            }
        }
    }
    
    console.log('\n🎯 CONCLUSIONES:');
    console.log('• Si alguna configuración funcionó, úsala en tu .env');
    console.log('• Si todas fallan, puede ser un problema de firewall/red');
    console.log('• Verifica que Hostinger permita conexiones externas');
}

// Verificar que mysql2 esté disponible
try {
    testHostingerConnection();
} catch (error) {
    console.log('❌ Error:', error.message);
    if (error.code === 'MODULE_NOT_FOUND') {
        console.log('🔧 Ejecuta: npm install mysql2');
    }
}