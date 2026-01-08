// src/services/AuthContext.js - Versión unificada con config centralizado
import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildApiUrl, getAuthHeaders as getConfigAuthHeaders } from '../config/config'; // ✅ IMPORTAR CONFIG

// Crear el contexto
const AuthContext = createContext();

// Hook personalizado para usar el contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ✅ ELIMINAR: Lógica duplicada de detección de URL
// const getAPIBaseURL = () => { ... }
// const API_BASE_URL = getAPIBaseURL();

// Proveedor del contexto
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // 🔥 CARGAR DATOS AL INICIAR - LÓGICA MEJORADA
  useEffect(() => {
    const initializeAuth = () => {
      try {
        console.log('🔍 === INICIALIZANDO AUTENTICACIÓN ===');
        console.log('🌐 API Base URL:', buildApiUrl('')); // ✅ USAR CONFIG CENTRALIZADO
        
        const savedToken = localStorage.getItem('token');
        const savedUser = localStorage.getItem('userData');
        const browserOpen = sessionStorage.getItem('browserOpen');
        
        console.log('📊 Estado del almacenamiento:');
        console.log('- Token en localStorage:', !!savedToken);
        console.log('- Usuario en localStorage:', !!savedUser);
        console.log('- Marca browserOpen:', browserOpen);

        if (savedToken && savedUser) {
          if (browserOpen === 'true') {
            try {
              const parsedUser = JSON.parse(savedUser);
              setToken(savedToken);
              setUser(parsedUser);
              setIsAuthenticated(true);
              
              sessionStorage.setItem('browserOpen', 'true');
              sessionStorage.setItem('sessionActive', 'true');
              sessionStorage.setItem('lastActivity', Date.now().toString());
              
              console.log('✅ SESIÓN RESTAURADA - Usuario:', parsedUser.nombre);
            } catch (parseError) {
              console.error('❌ Error parseando datos de usuario:', parseError);
              clearAllData();
            }
          } else {
            console.log('🔓 NAVEGADOR FUE CERRADO - Limpiando datos antiguos');
            clearAllData();
            sessionStorage.setItem('browserOpen', 'true');
          }
        } else {
          console.log('ℹ️ No hay datos de sesión - Primera vez o logout previo');
          sessionStorage.setItem('browserOpen', 'true');
        }
        
        console.log('🔍 === FIN INICIALIZACIÓN ===');
        
      } catch (error) {
        console.error('❌ Error crítico en inicialización:', error);
        clearAllData();
      } finally {
        setLoading(false);
      }
    };

    const clearAllData = () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userData');
      sessionStorage.removeItem('sessionActive');
      sessionStorage.removeItem('lastActivity');
      sessionStorage.removeItem('tabHiddenAt');
      sessionStorage.removeItem('windowBlurredAt');
      setUser(null);
      setToken(null);
      setIsAuthenticated(false);
    };

    initializeAuth();
  }, []);

  // 🔑 MANTENER SESIÓN ACTIVA
  useEffect(() => {
    if (!user) return;

    console.log('🟢 Configurando mantener sesión activa para:', user.nombre);

    sessionStorage.setItem('sessionActive', 'true');
    sessionStorage.setItem('browserOpen', 'true');

    const keepAliveInterval = setInterval(() => {
      sessionStorage.setItem('sessionActive', 'true');
      sessionStorage.setItem('browserOpen', 'true');
      sessionStorage.setItem('lastActivity', Date.now().toString());
    }, 10000);

    const renewSession = () => {
      sessionStorage.setItem('sessionActive', 'true');
      sessionStorage.setItem('browserOpen', 'true');
      sessionStorage.setItem('lastActivity', Date.now().toString());
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click', 'focus'];
    events.forEach(event => {
      document.addEventListener(event, renewSession, { passive: true });
    });

    return () => {
      clearInterval(keepAliveInterval);
      events.forEach(event => {
        document.removeEventListener(event, renewSession);
      });
    };
  }, [user]);

  // 🔑 DETECTAR CIERRE DE PESTAÑA/NAVEGADOR
  useEffect(() => {
    const handleBeforeUnload = () => {
      console.log('⚠️ Pestaña/navegador cerrándose...');
    };

    const handleUnload = () => {
      console.log('🔄 Evento unload ejecutado');
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ Pestaña oculta');
        sessionStorage.setItem('tabHiddenAt', Date.now().toString());
      } else {
        console.log('👁️ Pestaña visible');
        const hiddenAt = sessionStorage.getItem('tabHiddenAt');
        if (hiddenAt) {
          const timeHidden = Date.now() - parseInt(hiddenAt);
          console.log(`⏱️ Pestaña estuvo oculta por ${Math.round(timeHidden / 1000)} segundos`);
          
          if (timeHidden > 5 * 60 * 1000) {
            console.log('🔓 Pestaña oculta demasiado tiempo (>5min) - cerrando sesión');
            logout();
            return;
          }
        }
        sessionStorage.removeItem('tabHiddenAt');
        sessionStorage.setItem('sessionActive', 'true');
        sessionStorage.setItem('browserOpen', 'true');
      }
    };

    const handleWindowBlur = () => {
      console.log('🪟 Ventana perdió foco');
      sessionStorage.setItem('windowBlurredAt', Date.now().toString());
    };

    const handleWindowFocus = () => {
      console.log('🪟 Ventana recuperó foco');
      const blurredAt = sessionStorage.getItem('windowBlurredAt');
      if (blurredAt) {
        const timeBlurred = Date.now() - parseInt(blurredAt);
        console.log(`⏱️ Ventana sin foco por ${Math.round(timeBlurred / 1000)} segundos`);
        
        if (timeBlurred > 10 * 60 * 1000) {
          console.log('🔓 Ventana sin foco demasiado tiempo (>10min) - cerrando sesión');
          logout();
          return;
        }
      }
      sessionStorage.removeItem('windowBlurredAt');
      sessionStorage.setItem('sessionActive', 'true');
      sessionStorage.setItem('browserOpen', 'true');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
    };
  }, []);

  // 🔑 VERIFICACIÓN PERIÓDICA DE SESIÓN
  useEffect(() => {
    if (!user) return;

    const checkSession = () => {
      const sessionActive = sessionStorage.getItem('sessionActive');
      const browserOpen = sessionStorage.getItem('browserOpen');
      const lastActivity = sessionStorage.getItem('lastActivity');
      
      if (!browserOpen || browserOpen !== 'true') {
        console.log('🔓 Marca de navegador abierto perdida - cerrando sesión');
        logout();
        return;
      }
      
      if (!sessionActive || sessionActive !== 'true') {
        console.log('🔓 Sesión no activa - cerrando automáticamente');
        logout();
        return;
      }

      if (lastActivity) {
        const timeSinceActivity = Date.now() - parseInt(lastActivity);
        if (timeSinceActivity > 20 * 60 * 1000) {
          console.log('🔓 Sin actividad por más de 20 minutos - cerrando sesión');
          logout();
          return;
        }
      }
    };

    const checkInterval = setInterval(checkSession, 30000);
    return () => clearInterval(checkInterval);
  }, [user]);

  // 🔑 FUNCIÓN DE LOGIN - USANDO CONFIG CENTRALIZADO
  const login = async (email, password) => {
    try {
      console.log('🔐 === INICIANDO LOGIN ===');
      console.log('📧 Email:', email);
      
      // ✅ USAR buildApiUrl en lugar de URL hardcodeada
      const loginUrl = buildApiUrl('/auth/login');
      console.log('🌐 URL:', loginUrl);
      
      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ email, password })
      });

      console.log('📡 Respuesta del servidor:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      // Intentar parsear la respuesta
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('❌ Error parseando respuesta JSON:', parseError);
        return { 
          success: false, 
          error: 'Error de comunicación con el servidor. Respuesta no válida.' 
        };
      }

      if (!response.ok) {
        console.error('❌ Login fallido:', data);
        return { 
          success: false, 
          error: data.error || data.message || `Error ${response.status}: ${response.statusText}` 
        };
      }

      // 🔥 LOGIN EXITOSO - ACTUALIZAR ESTADO
      console.log('✅ Login exitoso:', data);
      console.log('📋 Estructura de respuesta:', Object.keys(data));
      
      // Flexibilidad en los nombres de campos de la respuesta
      const receivedToken = data.token || data.accessToken || data.jwt;
      const usuario = data.usuario || data.user || data.userData;
      
      console.log('🔑 Token recibido:', !!receivedToken);
      console.log('👤 Usuario recibido:', !!usuario);
      console.log('📊 Contenido completo de data:', JSON.stringify(data, null, 2));
      
      if (!receivedToken || !usuario) {
        console.error('❌ Respuesta incompleta del servidor:');
        console.error('- Token encontrado:', !!receivedToken);
        console.error('- Usuario encontrado:', !!usuario);
        console.error('- Campos disponibles:', Object.keys(data));
        console.error('- Respuesta completa:', data);
        return { 
          success: false, 
          error: `Respuesta incompleta del servidor. Campos disponibles: ${Object.keys(data).join(', ')}` 
        };
      }

      // Actualizar estado de React
      setToken(receivedToken);
      setUser(usuario);
      setIsAuthenticated(true);

      // Guardar en localStorage
      localStorage.setItem('token', receivedToken);
      localStorage.setItem('userData', JSON.stringify(usuario));

      // Configurar sessionStorage
      sessionStorage.setItem('browserOpen', 'true');
      sessionStorage.setItem('sessionActive', 'true');
      sessionStorage.setItem('lastActivity', Date.now().toString());

      console.log('💾 Datos guardados en localStorage y sessionStorage');
      console.log('👤 Usuario logueado:', usuario.nombre);
      console.log('🔑 Token guardado');
      console.log('✅ === LOGIN COMPLETADO ===');

      return { success: true, user: usuario };

    } catch (error) {
      console.error('❌ Error crítico en login:', error);
      
      // Análisis del tipo de error
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        return { 
          success: false, 
          error: 'No se puede conectar al servidor. Verifica que el backend esté ejecutándose.' 
        };
      }
      
      if (error.name === 'AbortError') {
        return { 
          success: false, 
          error: 'La conexión fue cancelada. Intenta nuevamente.' 
        };
      }
      
      return { 
        success: false, 
        error: error.message || 'Error desconocido durante el login' 
      };
    }
  };

  // 🔑 FUNCIÓN DE LOGOUT - MEJORADA
  const logout = () => {
    console.log('🔓 === CERRANDO SESIÓN ===');
    console.log('👤 Usuario actual:', user?.nombre || 'N/A');
    
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    
    sessionStorage.removeItem('browserOpen');
    sessionStorage.removeItem('sessionActive');
    sessionStorage.removeItem('lastActivity');
    sessionStorage.removeItem('tabHiddenAt');
    sessionStorage.removeItem('windowBlurredAt');
    
    console.log('🗑️ localStorage y sessionStorage limpiados');
    console.log('✅ === LOGOUT COMPLETADO ===');
  };

  // 🔑 VERIFICAR TOKEN - USANDO CONFIG CENTRALIZADO
  const verifyToken = async () => {
    if (!token) return false;

    try {
      // ✅ USAR buildApiUrl en lugar de URL hardcodeada
      const response = await fetch(buildApiUrl('/auth/verify'), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return true;
      } else {
        console.log('🔓 Token inválido - cerrando sesión automáticamente');
        logout();
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando token:', error);
      return false;
    }
  };

  // 🔑 ACTUALIZAR DATOS DEL USUARIO
  const updateUser = (userData) => {
    const updatedUser = { ...user, ...userData };
    setUser(updatedUser);
    localStorage.setItem('userData', JSON.stringify(updatedUser));
    console.log('📝 Datos de usuario actualizados:', userData);
  };

  // 🔑 OBTENER HEADERS DE AUTENTICACIÓN - USANDO CONFIG CENTRALIZADO
  const getAuthHeaders = () => {
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  // 🔑 FETCH AUTENTICADO
  const authFetch = async (url, options = {}) => {
    const authOptions = {
      ...options,
      headers: {
        ...getAuthHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, authOptions);
      
      if (response.status === 401) {
        console.log('🔓 Token expirado (401) - cerrando sesión');
        logout();
        throw new Error('Sesión expirada');
      }
      
      return response;
    } catch (error) {
      console.error('❌ Error en petición autenticada:', error);
      throw error;
    }
  };

  // 🔑 OBTENER ESTADO DE LA SESIÓN
  const getSessionStatus = () => {
    return {
      isAuthenticated,
      hasToken: !!token,
      hasUser: !!user,
      browserOpen: sessionStorage.getItem('browserOpen') === 'true',
      sessionActive: sessionStorage.getItem('sessionActive') === 'true',
      lastActivity: sessionStorage.getItem('lastActivity'),
      timeToExpire: user ? calculateTimeToExpire() : null,
      apiUrl: buildApiUrl('') // ✅ USAR CONFIG CENTRALIZADO
    };
  };

  // Función auxiliar para calcular tiempo hasta expiración
  const calculateTimeToExpire = () => {
    const lastActivity = sessionStorage.getItem('lastActivity');
    if (!lastActivity) return null;
    
    const timeSinceActivity = Date.now() - parseInt(lastActivity);
    const timeToExpire = (20 * 60 * 1000) - timeSinceActivity;
    
    return timeToExpire > 0 ? timeToExpire : 0;
  };

  // Valor del contexto
  const contextValue = {
    // Estado
    user,
    token,
    loading,
    isAuthenticated,
    
    // Funciones principales
    login,
    logout,
    verifyToken,
    updateUser,
    getAuthHeaders,
    authFetch,
    getSessionStatus,
    
    // Datos adicionales del usuario
    userName: user?.nombre || 'Usuario',
    userRole: user?.rol || 'user',
    userId: user?.id || null,
    
    // Debug info
    apiUrl: buildApiUrl(''), // ✅ USAR CONFIG CENTRALIZADO
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// 🔑 COMPONENTE DE PROTECCIÓN
export const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '10px' }}>🔄 Verificando sesión...</div>
        <div style={{ fontSize: '14px', opacity: 0.7 }}>Cargando...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    console.log('🔒 Acceso denegado - redirigiendo a login');
    window.location.href = '/login';
    return null;
  }

  if (requiredRole && user?.rol !== requiredRole) {
    console.log('🚫 Acceso denegado - rol insuficiente. Requerido:', requiredRole, 'Actual:', user?.rol);
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column'
      }}>
        <h2>🚫 Acceso Denegado</h2>
        <p>No tienes permisos para acceder a esta página.</p>
        <p style={{ opacity: 0.7 }}>Rol requerido: {requiredRole}</p>
        <p style={{ opacity: 0.7 }}>Tu rol: {user?.rol}</p>
      </div>
    );
  }

  return children;
};

export default AuthContext;