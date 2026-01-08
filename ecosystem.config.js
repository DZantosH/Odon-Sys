module.exports = {
  apps: [
    // 🔧 Backend API
    {
      name: 'backend',
      script: './server.js',
      cwd: '/var/www/odon-sys/backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/www/odon-sys/logs/backend-error.log',
      out_file: '/var/www/odon-sys/logs/backend-out.log',
      time: true
    },

	// 🏥 Frontend Principal (Panel Clínico)
    {
      name: 'frontend-main',
      script: 'npx',
      args: ['serve', '-s', 'build', '-l', '3000'],
      cwd: '/var/www/odon-sys/frontend',  // ✅ CORREGIR EL NOMBRE AQUÍ
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/www/odon-sys/logs/frontend-main-error.log',
      out_file: '/var/www/odon-sys/logs/frontend-main-out.log',
      time: true
    },

    // 👨‍💼 Frontend Admin (Panel Administrativo)
    {
      name: 'frontend-admin',
      script: 'npx',
      args: ['serve', '-s', 'build', '-l', '3001'],
      cwd: '/var/www/odon-sys/hk',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production'
      },
      error_file: '/var/www/odon-sys/logs/frontend-admin-error.log',
      out_file: '/var/www/odon-sys/logs/frontend-admin-out.log',
      time: true
    }
  ]
};
