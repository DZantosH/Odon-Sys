import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider, useAuth } from './services/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import HorarioBloqueo from './pages/HorarioBloqueo';
import Login from './pages/Login';
import PanelPrincipal from './pages/PanelPrincipal';
import Pacientes from './pages/Pacientes';
import Citas from './pages/Citas';
import Configuracion from './pages/Configuracion'; 
import HistorialClinico from './historial/HistorialClinico';
import HistorialPacienteIndividual from './historial/HistorialPaciente/HistorialPacienteIndividual';
import ManualUsuario from './ManualUsuario/ManualUsuario';
import 'react-toastify/dist/ReactToastify.css';

// 🆕 Importar utilidades de horario
import { verificarHorarioAcceso, esAdministrador } from './utils/horarioUtils';

// ===================================
// 🎨 SOLO CSS GLOBALES BÁSICOS
// ===================================
import './css/index.css';
import './css/Globals.css';

// 🆕 Componente para verificar horario antes de rutas protegidas
const VerificadorHorario = ({ children }) => {
  const estadoHorario = verificarHorarioAcceso();
  const esAdmin = esAdministrador();
  
  // Si está bloqueado y no es admin, redirigir a página de bloqueo
  if (estadoHorario.bloqueado && !esAdmin) {
    return <Navigate to="/sistema-bloqueado" replace />;
  }
  
  return children;
};

// 🔑 Ruta protegida con verificación de autenticación
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando...</p>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/login" />;
};

// 🔑 Ruta protegida CON verificación de horario
const ProtectedRouteWithHorario = ({ children }) => {
  return (
    <ProtectedRoute>
      <VerificadorHorario>
        {children}
      </VerificadorHorario>
    </ProtectedRoute>
  );
};

const AppContent = () => {
  const { user } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* 🔓 RUTA DE LOGIN - Sin restricción de horario */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login />} 
        />
        
        {/* 🔒 RUTA DE SISTEMA BLOQUEADO - Solo para usuarios autenticados */}
        <Route 
          path="/sistema-bloqueado" 
          element={
            <ProtectedRoute>
              <HorarioBloqueo />
            </ProtectedRoute>
          } 
        />
        
        {/* 🏠 RUTAS PRINCIPALES - Con Layout y control de horario */}
        <Route 
          path="/" 
          element={
            <ProtectedRouteWithHorario>
              <Layout />
            </ProtectedRouteWithHorario>
          }
        >
          <Route index element={<PanelPrincipal />} />
          <Route path="panel" element={<PanelPrincipal />} />
          <Route path="pacientes" element={<Pacientes />} />
          
          {/* 📋 RUTA: Historial individual de paciente */}
          <Route path="pacientes/:pacienteId/historial" element={<HistorialPacienteIndividual />} />
          
          <Route path="citas" element={<Citas />} />
          
          {/* ⚙️ NUEVA RUTA: Configuración de usuario */}
          <Route path="configuracion" element={<Configuracion />} />
        </Route>
        
        {/* 📋 RUTA: Historial clínico (FUERA del Layout protegido) - Con control de horario */}
        <Route 
          path="/historial-clinico/:pacienteId" 
          element={
            <ProtectedRouteWithHorario>
              <HistorialClinico />
            </ProtectedRouteWithHorario>
          } 
        />
        
        {/* 📖 RUTA: Manual de Usuario (FUERA del Layout para pantalla completa) - Con control de horario */}
        <Route 
          path="/ManualUsuario" 
          element={
            <ProtectedRouteWithHorario>
              <ManualUsuario />
            </ProtectedRouteWithHorario>
          } 
        />
        
        {/* 🔄 RUTA POR DEFECTO */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <ThemeProvider> {/* ✅ NUEVO: Envolver con ThemeProvider */}
        <>
          <AppContent />
          <ToastContainer 
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop={true}
            closeOnClick
            pauseOnHover
            theme="colored"
            className="toast-container"
          />
        </>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;