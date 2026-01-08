// check-localhost-config.js
// Diagnóstico completo para localhost

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO DE LOCALHOST - ODON-SYS BACKEND');
console.log('==============================================');

// 1. Verificar Node.js y directorio actual
console.log('📍 Directorio actual:', process.cwd());
console.log('📍 Node.js versión:', process.version);
console.log('📍 Platform:', process.platform);

// 2. Verificar estructura de archivos
console.log('\n📁 ESTRUCTURA DE ARCHIVOS:');
const requiredFiles = [
    'server.js',
    'package.json',
    '.env',
    'config/database.js',
    'routes/auth.js',
    'routes/tiposConsulta.js',
    'routes/usuarios.js',
    'middleware/auth.js'
];

requiredFiles.forEach(file => {
    const exists = fs.existsSync(file);
    console.log(`${exists ? '✅' : '❌'} ${file}`);
    
    if (exists && file.endsWith('.js')) {
        try {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n').length;
            console.log(`   📄 ${lines} líneas`);
        } catch (err) {
            console.log(`   ⚠️ Error leyendo archivo: ${err.message}`);
        }
    }
});

// 3. Verificar package.json
console.log('\n📦 PACKAGE.JSON:');
if (fs.existsSync('package.json')) {
    try {
        const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        console.log('✅ Nombre:', pkg.name || 'Sin nombre');
        console.log('✅ Versión:', pkg.version || 'Sin versión');
        
        console.log('\n📋 Scripts disponibles:');
        Object.keys(pkg.scripts || {}).forEach(script => {
            console.log(`   • ${script}: ${pkg.scripts[script]}`);
        });
        
        console.log('\n📚 Dependencias principales:');
        const mainDeps = ['express', 'mysql2', 'cors', 'jsonwebtoken', 'bcryptjs', 'dotenv'];
        mainDeps.forEach(dep => {
            const hasIt = pkg.dependencies && pkg.dependencies[dep];
            console.log(`   ${hasIt ? '✅' : '❌'} ${dep}${hasIt ? ` (${hasIt})` : ''}`);
        });
        
    } catch (err) {
        console.log('❌ Error parseando package.json:', err.message);
    }
} else {
    console.log('❌ package.json no encontrado');
}

// 4. Verificar .env
console.log('\n🔐 ARCHIVO .ENV:');
if (fs.existsSync('.env')) {
    try {
        const envContent = fs.readFileSync('.env', 'utf8');
        console.log('✅ Archivo .env encontrado');
        
        // Mostrar solo las claves, no los valores por seguridad
        const lines = envContent.split('\n').filter(line => 
            line.trim() && !line.trim().startsWith('#')
        );
        
        console.log('📋 Variables configuradas:');
        lines.forEach(line => {
            const [key] = line.split('=');
            if (key) {
                console.log(`   • ${key.trim()}`);
            }
        });
        
    } catch (err) {
        console.log('❌ Error leyendo .env:', err.message);
    }
} else {
    console.log('❌ Archivo .env no encontrado');
    console.log('🔧 Creando .env básico...');
    
    const basicEnv = `# Configuración para desarrollo local
NODE_ENV=development
PORT=5000
JWT_SECRET=clave-secreta-temporal-desarrollo

# Base de datos Hostinger
DB_HOST=srv1006.hstgr.io
DB_PORT=3306
DB_USER=u984674772_rootodon
DB_PASSWORD=Angelyael20@
DB_NAME=u984674772_odonto

# CORS
FRONTEND_URL=http://localhost:3000
`;
    
    try {
        fs.writeFileSync('.env', basicEnv);
        console.log('✅ Archivo .env creado exitosamente');
    } catch (err) {
        console.log('❌ Error creando .env:', err.message);
    }
}

// 5. Verificar node_modules
console.log('\n📚 DEPENDENCIAS:');
if (fs.existsSync('node_modules')) {
    console.log('✅ Carpeta node_modules existe');
    
    // Verificar algunas dependencias clave
    const keyDeps = ['express', 'mysql2', 'cors', 'jsonwebtoken'];
    keyDeps.forEach(dep => {
        const exists = fs.existsSync(path.join('node_modules', dep));
        console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
    });
} else {
    console.log('❌ Carpeta node_modules NO existe');
    console.log('🔧 Ejecuta: npm install');
}

// 6. Verificar configuración de base de datos
console.log('\n🗄️ CONFIGURACIÓN DE BASE DE DATOS:');
if (fs.existsSync('config/database.js')) {
    try {
        const dbContent = fs.readFileSync('config/database.js', 'utf8');
        console.log('✅ config/database.js encontrado');
        
        // Verificar que contenga la configuración correcta
        const checks = [
            { check: 'srv1006.hstgr.io', name: 'Host Hostinger' },
            { check: 'u984674772_rootodon', name: 'Usuario BD' },
            { check: 'u984674772_odonto', name: 'Nombre BD' },
            { check: 'createPool', name: 'Pool de conexiones' }
        ];
        
        checks.forEach(({check, name}) => {
            const hasIt = dbContent.includes(check);
            console.log(`   ${hasIt ? '✅' : '❌'} ${name}`);
        });
        
    } catch (err) {
        console.log('❌ Error leyendo config/database.js:', err.message);
    }
} else {
    console.log('❌ config/database.js no encontrado');
}

// 7. Recomendaciones finales
console.log('\n🎯 SIGUIENTES PASOS:');
console.log('1. Si falta node_modules: npm install');
console.log('2. Si falta .env: Ya se creó automáticamente');
console.log('3. Probar servidor: npm start o node server.js');
console.log('4. Verificar en: http://localhost:5000/api/test');

console.log('\n🐛 SI HAY ERRORES:');
console.log('• Verificar que el puerto 5000 esté libre');
console.log('• Ejecutar con más detalle: DEBUG=* node server.js');
console.log('• Verificar logs de la base de datos');

console.log('\n' + '='.repeat(50));
console.log('✅ Diagnóstico completado');