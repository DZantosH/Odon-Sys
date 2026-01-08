const API_URL = 'https://nhdental.site/api';
const BASE_URL = 'https://nhdental.site';
const UPLOADS_URL = 'https://nhdental.site/uploads';

export const API_BASE_URL = API_URL;
export const BACKEND_URL = BASE_URL;

export const config = {
  API_URL,
  API_BASE_URL: API_URL,
  BASE_URL,
  BACKEND_URL: BASE_URL,
  UPLOADS_URL,
  IS_PRODUCTION: true,
  DEBUG: false,
  APP_TITLE: 'OdonSys',
  APP_VERSION: '1.2.5',
  CLINIC: { NAME: 'Clínica Dental OdonSys', PHONE: '55-1234-5678' },
  REQUEST_TIMEOUT: 15000,
  MAX_FILE_SIZE: 10485760
};

export const buildApiUrl = (endpoint) => {
  const clean = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_URL}/${clean}`;
};

export const buildUploadUrl = (filename) => {
  if (!filename) return null;
  if (filename.startsWith('http')) return filename;
  const clean = filename.startsWith('/') ? filename.slice(1) : filename;
  return `${BASE_URL}/${clean}`;
};

export const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } : { 'Content-Type': 'application/json' };
};

export const getToken = () => localStorage.getItem('token');
export const getUser = () => { try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } };
export const setAuth = (token, user, role) => { localStorage.setItem('token', token); localStorage.setItem('user', JSON.stringify(user)); localStorage.setItem('role', role); };
export const clearAuth = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); localStorage.removeItem('role'); };

console.log('🔧 Config:', { API_URL, BASE_URL });
export default config;
