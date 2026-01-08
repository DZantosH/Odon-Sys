// components/DentalLoading.jsx
import React, { useState, useEffect } from 'react';
import '../css/DentalLoading.css';

const DentalLoading = ({ 
  isLoading = true, 
  message = "Preparando consulta...",
  submessage = "Cargando información del paciente",
  duration = 3000,
  onComplete = () => {}
}) => {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [isVisible, setIsVisible] = useState(isLoading);

  const phases = [
    { message: "Accediendo al historial clínico", icon: "📋" },
    { message: "Cargando información del paciente", icon: "👤" },
    { message: "Preparando consulta odontológica", icon: "🦷" },
    { message: "Verificando datos médicos", icon: "🩺" },
    { message: "Iniciando sesión de trabajo", icon: "⚡" }
  ];

  useEffect(() => {
    if (!isLoading) {
      setIsVisible(false);
      return;
    }

    setIsVisible(true);
    setProgress(0);
    setCurrentPhase(0);

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (duration / 50));
        
        // Cambiar fase cada 20%
        const phaseIndex = Math.floor(newProgress / 20);
        if (phaseIndex !== currentPhase && phaseIndex < phases.length) {
          setCurrentPhase(phaseIndex);
        }
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsVisible(false);
            onComplete();
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isLoading, duration, currentPhase, onComplete]);

  if (!isVisible) return null;

  return (
    <div className="dental-loading-overlay">
      <div className="dental-loading-container">
        
        {/* Diente animado */}
        <div className="dental-tooth-container">
          <div className="dental-tooth">
            {/* Contorno del diente */}
            <div className="tooth-outline">
              <div className="tooth-crown"></div>
              <div className="tooth-root"></div>
            </div>
            
            {/* Relleno progresivo */}
            <div 
              className="tooth-fill"
              style={{ height: `${progress}%` }}
            ></div>
            
            {/* Brillo del diente */}
            <div className="tooth-shine"></div>
          </div>
          
          {/* Porcentaje de progreso */}
          <div className="progress-percentage">
            {Math.round(progress)}%
          </div>
        </div>

        {/* Información de carga */}
        <div className="loading-info">
          <div className="loading-phase">
            <span className="phase-icon">
              {phases[currentPhase]?.icon || "🦷"}
            </span>
            <span className="phase-message">
              {phases[currentPhase]?.message || message}
            </span>
          </div>
          
          <div className="loading-submessage">
            {submessage}
          </div>
        </div>

        {/* Barra de progreso moderna */}
        <div className="modern-progress-bar">
          <div className="progress-track">
            <div 
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-dots">
            {[...Array(5)].map((_, index) => (
              <div 
                key={index}
                className={`progress-dot ${index <= currentPhase ? 'active' : ''}`}
              ></div>
            ))}
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="dental-decorations">
          <div className="floating-icon" style={{ '--delay': '0s' }}>🦷</div>
          <div className="floating-icon" style={{ '--delay': '0.5s' }}>📋</div>
          <div className="floating-icon" style={{ '--delay': '1s' }}>🩺</div>
          <div className="floating-icon" style={{ '--delay': '1.5s' }}>👨‍⚕️</div>
        </div>

        {/* Mensaje de marca */}
        <div className="loading-brand">
          <div className="brand-icon">🦷</div>
          <div className="brand-text">Sistema Odontológico</div>
        </div>
      </div>
    </div>
  );
};

export default DentalLoading;