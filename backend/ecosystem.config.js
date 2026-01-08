module.exports = {
  apps: [
    {
      name: 'odon-sys',
      script: './server.js',
      cwd: '/var/www/odon-sys/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Mexico_City'
      },
      error_file: '/root/.pm2/logs/odon-sys-error.log',
      out_file: '/root/.pm2/logs/odon-sys-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    },
    {
      name: 'bot-whatsapp',
      script: './whatsapp/index.js',
      cwd: '/var/www/odon-sys/backend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        TZ: 'America/Mexico_City'
      },
      error_file: '/root/.pm2/logs/bot-whatsapp-error.log',
      out_file: '/root/.pm2/logs/bot-whatsapp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
    }
  ]
};

