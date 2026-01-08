import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login'; // Asegúrate que la ruta sea correcta (pages o components)
import TwoFactorLogin from './components/TwoFactorLogin'; // Nuevo componente
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Finanzas from './pages/Finanzas';
import Inventario from './pages/Inventario';
import { getAdminToken, getAdminUser, clearAdminAuth, getAuthHeaders } from './config';
import Configuracion from './pages/Configuracion';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [authStep, setAuthStep] = useState('login'); // 'login', '2fa', 'authenticated'
  const [pendingUser, setPendingUser] = useState(null);
  const [tempToken, setTempToken] = useState(null);

  // Auto-detectar URL base
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = getAdminToken();
      
      if (!token) {
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${API_URL}/auth/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const serverUserData = await response.json();
        if (serverUserData.user.rol === 'Administrador') {
          setUser(serverUserData.user);
          setIsAuthenticated(true);
          setAuthStep('authenticated');
        } else {
          clearAdminAuth();
        }
      } else {
        clearAdminAuth();
      }
    } catch (error) {
      console.error('Error auth:', error);
      clearAdminAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.user.rol !== 'Administrador') {
          throw new Error('Acceso denegado. Solo administradores.');
        }

        // === LÓGICA DE 2FA REACTIVADA ===
        // Si el usuario tiene 2FA activado, el backend debería indicarlo
        // O verificamos manualmente si el usuario lo tiene activo
        if (data.user.two_factor_enabled || data.require2fa) {
            setPendingUser(data.user);
            setTempToken(data.token); // Guardamos el token temporalmente
            setAuthStep('2fa'); // Cambiamos a la pantalla de código
            return { success: true, requiresTwoFactor: true };
        } 

        // Si no tiene 2FA, entramos directo
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
        
        setUser(data.user);
        setIsAuthenticated(true);
        setAuthStep('authenticated');
        
        return { success: true };
      } else {
        throw new Error(data.message || 'Error en el login');
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const handle2FASuccess = (finalToken) => {
    // Aquí recibimos el token final o confirmamos el actual
    const tokenToSave = finalToken || tempToken;
    localStorage.setItem('admin_token', tokenToSave);
    localStorage.setItem('admin_user', JSON.stringify(pendingUser));
    
    setUser(pendingUser);
    setIsAuthenticated(true);
    setAuthStep('authenticated');
    setPendingUser(null);
    setTempToken(null);
  };

  const handleBackToLogin = () => {
    setPendingUser(null);
    setTempToken(null);
    setAuthStep('login');
    clearAdminAuth();
  };

  const handleLogout = () => {
    clearAdminAuth();
    setUser(null);
    setIsAuthenticated(false);
    setAuthStep('login');
  };

  if (isLoading) return <div className="min-screen-container">Cargando...</div>;

  // 1. Pantalla Login
  if (authStep === 'login') {
    return <Login onLogin={handleLogin} />; // Pasamos la función al componente Login
  }

  // 2. Pantalla 2FA (Google Authenticator)
  if (authStep === '2fa' && pendingUser) {
    return (
      <TwoFactorLogin 
        user={pendingUser}
        tempToken={tempToken}
        onSuccess={handle2FASuccess}
        onBack={handleBackToLogin}
        apiUrl={API_URL}
      />
    );
  }

  // 3. Panel Principal
  if (authStep === 'authenticated' && isAuthenticated) {
    return (
      <Router basename="/hk">
        <Layout user={user} onLogout={handleLogout}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/users" element={<Users />} />
            <Route path="/finanzas" element={<Finanzas />} />
            <Route path="/inventario" element={<Inventario />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
            <Route path="/settings" element={<Configuracion />} />
          </Routes>
        </Layout>
      </Router>
    );
  }

  return <Login onLogin={handleLogin} />;
}

export default App;
