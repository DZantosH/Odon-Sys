// hk/src/config.js
// URL FIJA DEL BACKEND (Para asegurar que siempre conecte)
const BASE_URL = 'https://nhdental.site';

export const config = {
  API_URL: `${BASE_URL}/api`,
  UPLOADS_URL: `${BASE_URL}/uploads`,
  BASE_URL: BASE_URL,
  
  // Configuración extra
  APP_TITLE: 'Panel Admin OdontoSys',
  ITEMS_PER_PAGE: 10
};

// Función para construir URLs de la API
export const buildApiUrl = (endpoint) => {
  // Quita la barra inicial si la tiene para evitar dobles barras //
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${config.API_URL}/${cleanEndpoint}`;
};

// Función para construir URLs de imágenes/archivos
export const buildUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const cleanFilename = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${config.BASE_URL}/${cleanFilename}`;
};

// Headers de autenticación (Token del Admin)
export const getAuthHeaders = () => {
  const token = localStorage.getItem('admin_token'); // Ojo: en HK usamos admin_token
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

// Helpers de localStorage
export const getAdminToken = () => localStorage.getItem('admin_token');
export const clearAdminAuth = () => {
  localStorage.removeItem('admin_token');
  localStorage.removeItem('admin_user');
};

export default config;
