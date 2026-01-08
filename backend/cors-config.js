// cors-config.js - Configuración CORS para producción
// Agrega esto a tu servidor backend

const cors = require('cors');

// Configuración CORS para producción
const corsOptions = {
  origin: [
    'http://98.82.131.153:3000',      // Frontend en puerto 3000
    'http://98.82.131.153',           // Frontend en puerto 80
    'https://98.82.131.153',          // Si usas HTTPS
    'http://localhost:3000',          // Para desarrollo local
    'http://localhost:5000'           // Para pruebas locales
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  optionsSuccessStatus: 200
};

// Aplicar CORS
app.use(cors(corsOptions));

// Middleware adicional para headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, Accept, Origin');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Log de peticiones para debug
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});