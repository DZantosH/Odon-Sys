import React, { useState, useEffect } from 'react';
import { 
  Settings, Moon, Sun, Monitor, Bell, Shield, 
  Smartphone, RefreshCw, Power, CheckCircle, AlertTriangle
} from 'lucide-react';
import QRCode from "react-qr-code"; // <--- IMPORTANTE
import { buildApiUrl, getAuthHeaders } from '../config';

const Configuracion = () => {
  // Tema
  const [theme, setTheme] = useState('light');
  
  // Estado del Bot
  const [botStatus, setBotStatus] = useState({ status: 'loading', qr: null });
  const [loadingBot, setLoadingBot] = useState(false);

  // --- EFECTOS ---
  useEffect(() => {
    // Leer tema guardado
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }

    // Cargar estado del bot al entrar
    fetchBotStatus();
  }, []);

  // --- LÓGICA DE TEMA ---
  const toggleTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // --- LÓGICA DEL BOT ---
  const fetchBotStatus = async () => {
    try {
      setLoadingBot(true);
      // ESTA ES LA RUTA QUE DEBES CREAR EN TU BACKEND:
      const response = await fetch(buildApiUrl('admin/bot/status'), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        // data esperada: { status: 'connected' | 'qr', qr_code: 'string_largo...' }
        setBotStatus(data);
      } else {
        // Fallback si no hay conexión
        setBotStatus({ status: 'error', qr: null });
      }
    } catch (error) {
      console.error(error);
      setBotStatus({ status: 'error', qr: null });
    } finally {
      setLoadingBot(false);
    }
  };

  const handleLogoutBot = async () => {
    if(!window.confirm("¿Desvincular el Bot? Tendrás que escanear el QR de nuevo.")) return;
    try {
        setLoadingBot(true);
        await fetch(buildApiUrl('admin/bot/logout'), { method: 'POST', headers: getAuthHeaders() });
        setTimeout(fetchBotStatus, 2000); // Esperar y recargar
    } catch (error) { console.error(error); }
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-5xl mx-auto">
      
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Settings className="text-blue-600 dark:text-blue-400" /> Configuración
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza tu experiencia y conecta dispositivos</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* --- 1. APARIENCIA --- */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors h-fit">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <Monitor size={18} /> Apariencia
            </h3>
            </div>
            
            <div className="p-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-medium">Tema de la interfaz:</p>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => toggleTheme('light')} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}>
                    <Sun size={24} className={theme==='light' ? 'text-orange-500' : ''}/> <span className="font-bold text-sm">Claro</span>
                </button>
                <button onClick={() => toggleTheme('dark')} className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${theme === 'dark' ? 'border-purple-500 bg-gray-700 text-white' : 'border-gray-200 dark:border-gray-700 dark:text-gray-400'}`}>
                    <Moon size={24} className={theme==='dark' ? 'text-purple-300' : ''}/> <span className="font-bold text-sm">Oscuro</span>
                </button>
            </div>
            </div>
        </div>

        {/* --- 2. BOT DE WHATSAPP (CONEXIÓN) --- */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Smartphone size={18} className="text-green-600" /> Bot WhatsApp
                </h3>
                <button onClick={fetchBotStatus} className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 dark:text-gray-400 transition-colors" title="Recargar estado">
                    <RefreshCw size={16} className={loadingBot ? "animate-spin" : ""} />
                </button>
            </div>

            <div className="p-6 flex flex-col items-center justify-center min-h-[250px]">
                
                {/* ESTADO: CARGANDO */}
                {loadingBot && botStatus.status !== 'qr' && (
                    <div className="text-center text-gray-400">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p className="text-sm">Verificando conexión...</p>
                    </div>
                )}

                {/* ESTADO: CONECTADO ✅ */}
                {!loadingBot && botStatus.status === 'connected' && (
                    <div className="text-center space-y-4 animate-in fade-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle size={40} className="text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-gray-800 dark:text-white">¡Bot Conectado!</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400">El sistema está listo para enviar mensajes.</p>
                        </div>
                        <button onClick={handleLogoutBot} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 text-sm font-bold flex items-center gap-2 mx-auto">
                            <Power size={16} /> Desvincular Sesión
                        </button>
                    </div>
                )}

                {/* ESTADO: QR (ESCANEAR) 📷 */}
                {!loadingBot && botStatus.status === 'qr' && botStatus.qr_code && (
                    <div className="text-center space-y-4 w-full">
                        <div className="bg-white p-3 rounded-xl border-4 border-gray-100 mx-auto w-fit shadow-inner">
                            <div style={{ height: "auto", margin: "0 auto", maxWidth: 180, width: "100%" }}>
                                <QRCode
                                    size={256}
                                    style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                                    value={botStatus.qr_code}
                                    viewBox={`0 0 256 256`}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-white animate-pulse">Escanea para iniciar sesión</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Abre WhatsApp &gt; Dispositivos vinculados</p>
                        </div>
                    </div>
                )}

                {/* ESTADO: ERROR O DESCONECTADO SIN QR ⚠️ */}
                {!loadingBot && botStatus.status !== 'connected' && !botStatus.qr_code && (
                    <div className="text-center text-gray-400">
                        <AlertTriangle size={32} className="mx-auto text-yellow-500 mb-2"/>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-300">Bot desconectado</p>
                        <p className="text-xs mt-1">Pulsa recargar para generar un nuevo QR</p>
                    </div>
                )}

            </div>
        </div>

      </div>

      {/* Otras secciones (Notificaciones, Seguridad) - Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
              <Bell size={18} /> Notificaciones (Pronto)
            </h3>
            <div className="space-y-3">
               <div className="flex justify-between items-center"><span className="text-sm dark:text-gray-400">Alertas por correo</span> <div className="w-10 h-5 bg-gray-200 rounded-full relative"><div className="w-4 h-4 bg-white rounded-full absolute top-0.5 left-0.5 shadow"></div></div></div>
            </div>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2 mb-4">
              <Shield size={18} /> Seguridad (Pronto)
            </h3>
            <button className="w-full py-2 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">Ver sesiones activas</button>
         </div>
      </div>

    </div>
  );
};

export default Configuracion;