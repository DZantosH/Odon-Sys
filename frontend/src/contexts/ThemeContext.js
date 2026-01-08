// contexts/ThemeContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe usarse dentro de un ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Variables de tema CSS (memoizadas para evitar recreación en cada render)
  const themeVariables = useCallback(() => ({
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f8f9fa',
      '--bg-tertiary': '#e9ecef',
      '--text-primary': '#212529',
      '--text-secondary': '#6c757d',
      '--text-muted': '#868e96',
      '--border-color': '#dee2e6',
      '--shadow-light': '0 2px 4px rgba(0,0,0,0.1)',
      '--shadow-medium': '0 4px 6px rgba(0,0,0,0.1)',
      '--shadow-heavy': '0 8px 25px rgba(0,0,0,0.15)',
      '--primary-color': '#007bff',
      '--primary-hover': '#0056b3',
      '--success-color': '#28a745',
      '--warning-color': '#ffc107',
      '--danger-color': '#dc3545',
      '--info-color': '#17a2b8'
    },
    dark: {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--bg-tertiary': '#3a3a3a',
      '--text-primary': '#ffffff',
      '--text-secondary': '#b3b3b3',
      '--text-muted': '#888888',
      '--border-color': '#404040',
      '--shadow-light': '0 2px 4px rgba(0,0,0,0.3)',
      '--shadow-medium': '0 4px 6px rgba(0,0,0,0.3)',
      '--shadow-heavy': '0 8px 25px rgba(0,0,0,0.4)',
      '--primary-color': '#4dabf7',
      '--primary-hover': '#339af0',
      '--success-color': '#51cf66',
      '--warning-color': '#ffd43b',
      '--danger-color': '#ff6b6b',
      '--info-color': '#74c0fc'
    }
  }), []); // Sin dependencias porque son valores constantes

  // Aplicar variables CSS al documento
  const applyThemeVariables = useCallback((theme) => {
    const variables = themeVariables();
    const themeVars = variables[theme];
    
    const root = document.documentElement;
    Object.entries(themeVars).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });
  }, [themeVariables]); // Dependencia corregida

  // Cargar tema guardado al inicializar
  useEffect(() => {
    const loadSavedTheme = () => {
      try {
        setIsLoading(true);
        
        // Intentar cargar tema guardado
        const savedTheme = localStorage.getItem('odontosys-theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        let shouldUseDark = false;
        
        if (savedTheme !== null) {
          // Si hay tema guardado, usarlo
          shouldUseDark = savedTheme === 'dark';
        } else {
          // Si no hay tema guardado, usar preferencia del sistema
          shouldUseDark = prefersDark;
        }
        
        setIsDarkMode(shouldUseDark);
        applyThemeVariables(shouldUseDark ? 'dark' : 'light');
        
        // Aplicar clase al body
        document.body.classList.toggle('dark-theme', shouldUseDark);
        document.body.classList.toggle('light-theme', !shouldUseDark);
        
      } catch (error) {
        console.error('Error al cargar tema:', error);
        // En caso de error, usar tema claro por defecto
        setIsDarkMode(false);
        applyThemeVariables('light');
        document.body.classList.add('light-theme');
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedTheme();
  }, [applyThemeVariables]); // Dependencia corregida

  // Detectar cambios en preferencias del sistema
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e) => {
      // Solo cambiar si no hay tema guardado manualmente
      const savedTheme = localStorage.getItem('odontosys-theme');
      if (savedTheme === null) {
        const shouldUseDark = e.matches;
        setIsDarkMode(shouldUseDark);
        applyThemeVariables(shouldUseDark ? 'dark' : 'light');
        document.body.classList.toggle('dark-theme', shouldUseDark);
        document.body.classList.toggle('light-theme', !shouldUseDark);
      }
    };

    // Agregar listener con el método correcto según el navegador
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } else {
      // Fallback para navegadores más antiguos
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      // Limpiar listener
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } else {
        // Fallback para navegadores más antiguos
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, [applyThemeVariables]); // Dependencia corregida

  // Función para alternar tema
  const toggleTheme = useCallback(() => {
    const newTheme = !isDarkMode;
    
    try {
      setIsDarkMode(newTheme);
      
      // Guardar en localStorage
      localStorage.setItem('odontosys-theme', newTheme ? 'dark' : 'light');
      
      // Aplicar variables CSS
      applyThemeVariables(newTheme ? 'dark' : 'light');
      
      // Aplicar clases al body
      document.body.classList.toggle('dark-theme', newTheme);
      document.body.classList.toggle('light-theme', !newTheme);
      
      // Evento personalizado para que otros componentes puedan reaccionar
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { isDarkMode: newTheme } 
      }));
      
    } catch (error) {
      console.error('Error al cambiar tema:', error);
    }
  }, [isDarkMode, applyThemeVariables]); // Dependencias corregidas

  // Función para establecer tema específico
  const setTheme = useCallback((theme) => {
    const isDark = theme === 'dark';
    
    try {
      setIsDarkMode(isDark);
      
      // Guardar en localStorage
      localStorage.setItem('odontosys-theme', theme);
      
      // Aplicar variables CSS
      applyThemeVariables(theme);
      
      // Aplicar clases al body
      document.body.classList.toggle('dark-theme', isDark);
      document.body.classList.toggle('light-theme', !isDark);
      
      // Evento personalizado
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { isDarkMode: isDark } 
      }));
      
    } catch (error) {
      console.error('Error al establecer tema:', error);
    }
  }, [applyThemeVariables]); // Dependencia corregida

  // Función para resetear al tema del sistema
  const resetToSystemTheme = useCallback(() => {
    try {
      // Eliminar preferencia guardada
      localStorage.removeItem('odontosys-theme');
      
      // Usar preferencia del sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      applyThemeVariables(prefersDark ? 'dark' : 'light');
      
      // Aplicar clases al body
      document.body.classList.toggle('dark-theme', prefersDark);
      document.body.classList.toggle('light-theme', !prefersDark);
      
      // Evento personalizado
      window.dispatchEvent(new CustomEvent('themeChanged', { 
        detail: { isDarkMode: prefersDark } 
      }));
      
    } catch (error) {
      console.error('Error al resetear tema:', error);
    }
  }, [applyThemeVariables]); // Dependencia corregida

  // Función para obtener el tema actual
  const getCurrentTheme = useCallback(() => {
    return isDarkMode ? 'dark' : 'light';
  }, [isDarkMode]);

  // Función para verificar si se está usando el tema del sistema
  const isUsingSystemTheme = useCallback(() => {
    return localStorage.getItem('odontosys-theme') === null;
  }, []);

  // Valor del contexto
  const contextValue = {
    isDarkMode,
    isLoading,
    toggleTheme,
    setTheme,
    resetToSystemTheme,
    getCurrentTheme,
    isUsingSystemTheme,
    themeVariables: themeVariables()
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;