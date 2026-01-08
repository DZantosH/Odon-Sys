// config/fileConfig.js - Configuración para manejo de archivos
const path = require('path');
const fs = require('fs');

// Configuración de directorios
const config = {
  // Directorio base para uploads
  uploadsDir: path.join(__dirname, '..', 'uploads'),
  
  // Directorio específico para PDFs de historiales
  pdfsDir: path.join(__dirname, '..', 'uploads', 'pdfs'),
  
  // Directorio para radiografías
  radiografiasDir: path.join(__dirname, '..', 'uploads', 'radiografias'),
  
  // Directorio temporal
  tempDir: path.join(__dirname, '..', 'uploads', 'temp'),
  
  // Configuración de archivos PDF
  pdf: {
    maxSize: 10 * 1024 * 1024, // 10MB en bytes
    allowedMimeTypes: ['application/pdf'],
    quality: 80,
    compression: true
  },
  
  // Configuración de imágenes (radiografías)
  images: {
    maxSize: 5 * 1024 * 1024, // 5MB en bytes
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/tiff'
    ],
    quality: 85,
    maxWidth: 2048,
    maxHeight: 2048
  },
  
  // Configuración de limpieza automática
  cleanup: {
    tempFilesMaxAge: 24 * 60 * 60 * 1000, // 24 horas en ms
    enableAutoCleanup: true,
    cleanupInterval: 60 * 60 * 1000 // 1 hora en ms
  }
};

// Función para crear directorios si no existen
const ensureDirectoriesExist = () => {
  const directories = [
    config.uploadsDir,
    config.pdfsDir,
    config.radiografiasDir,
    config.tempDir
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Directorio creado: ${dir}`);
      } catch (error) {
        console.error(`❌ Error creando directorio ${dir}:`, error);
      }
    }
  });
};

// Función para generar nombre único de archivo
const generateUniqueFilename = (originalName, prefix = '') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  const extension = path.extname(originalName);
  const baseName = path.basename(originalName, extension);
  
  return `${prefix}${baseName}_${timestamp}_${random}${extension}`;
};

// Función para validar tipo de archivo
const validateFileType = (file, type = 'pdf') => {
  const allowedTypes = config[type]?.allowedMimeTypes || [];
  const maxSize = config[type]?.maxSize || 10 * 1024 * 1024;
  
  const errors = [];
  
  if (!allowedTypes.includes(file.mimetype)) {
    errors.push(`Tipo de archivo no permitido. Tipos permitidos: ${allowedTypes.join(', ')}`);
  }
  
  if (file.size > maxSize) {
    errors.push(`Archivo demasiado grande. Tamaño máximo: ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Función para limpiar archivos temporales
const cleanupTempFiles = () => {
  if (!config.cleanup.enableAutoCleanup) return;
  
  try {
    const files = fs.readdirSync(config.tempDir);
    const now = Date.now();
    
    files.forEach(file => {
      const filePath = path.join(config.tempDir, file);
      const stats = fs.statSync(filePath);
      const fileAge = now - stats.mtime.getTime();
      
      if (fileAge > config.cleanup.tempFilesMaxAge) {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Archivo temporal eliminado: ${file}`);
      }
    });
  } catch (error) {
    console.error('❌ Error en limpieza de archivos temporales:', error);
  }
};

// Función para obtener información de un archivo
const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      exists: true,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      sizeFormatted: `${(stats.size / 1024 / 1024).toFixed(2)} MB`
    };
  } catch (error) {
    return {
      exists: false,
      error: error.message
    };
  }
};

// Inicializar directorios al cargar el módulo
ensureDirectoriesExist();

// Configurar limpieza automática si está habilitada
if (config.cleanup.enableAutoCleanup) {
  setInterval(cleanupTempFiles, config.cleanup.cleanupInterval);
  console.log(`🔄 Limpieza automática configurada cada ${config.cleanup.cleanupInterval / 1000 / 60} minutos`);
}

module.exports = {
  config,
  ensureDirectoriesExist,
  generateUniqueFilename,
  validateFileType,
  cleanupTempFiles,
  getFileInfo
};