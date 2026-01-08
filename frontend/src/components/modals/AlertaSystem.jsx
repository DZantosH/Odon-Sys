// components/alerts/AlertaSystem.jsx
import React, { useState, useEffect, useCallback } from 'react';
import '../../css/AlertaSystem.css';

// 🗑️ MODAL COMPACTO PARA CANCELAR CITAS - SUPERIOR IZQUIERDA
export const CancelCitaModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  citaData = {}
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal-backdrop backdrop-open modern-backdrop"
        onClick={handleOverlayClick}
      />
      <div className="compact-cancel-modal modal-open modal-top-left">
        <div className="compact-cancel-content">
          {/* Header compacto */}
          <div className="compact-header">
            <div className="compact-icon">🗑️</div>
            <div className="compact-title">Cancelar Cita</div>
            <button className="compact-close" onClick={onClose}>✕</button>
          </div>

          {/* Mensaje de advertencia compacto */}
          <div className="compact-warning">
            <div className="warning-text">
              <strong>⚠️ ¿Estás seguro?</strong>
              <span>Esta acción no se puede deshacer</span>
            </div>
          </div>

          {/* Información básica de la cita */}
          <div className="compact-info">
            <div className="info-row">
              <span className="info-icon">👤</span>
              <span className="info-text">{citaData.pacienteNombre || 'Paciente'}</span>
            </div>
            <div className="info-row">
              <span className="info-icon">📅</span>
              <span className="info-text">
                {citaData.fechaCita ? new Date(citaData.fechaCita).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric'
                }) : 'Sin fecha'}
              </span>
            </div>
            <div className="info-row">
              <span className="info-icon">🕐</span>
              <span className="info-text">{citaData.horaCita || 'Sin hora'}</span>
            </div>
          </div>

          {/* Botones compactos */}
          <div className="compact-actions">
            <button 
              className="btn-compact-cancel"
              onClick={handleConfirm}
            >
              🗑️ Cancelar
            </button>
            <button 
              className="btn-compact-keep"
              onClick={onClose}
            >
              ✋ Mantener
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 🦷 MODAL MODERNO DE CONSULTA - SUPERIOR IZQUIERDA
export const ConsultaModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Consulta iniciada para Carlos Rios",
  message = "¿Deseas ir al historial clínico para continuar con la consulta?",
  confirmText = "Aceptar",
  cancelText = "Cancelar"
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="modal-backdrop backdrop-open modern-backdrop"
        onClick={handleOverlayClick}
      />
      <div className="consulta-modal modal-open modal-top-left">
        <div className="consulta-modal-content">
          <div className="consulta-modal-header">
            <div className="consulta-modal-icon">
              🦷
            </div>
            <div className="consulta-modal-text">
              <h3 className="consulta-modal-title">{title}</h3>
              <p className="consulta-modal-message">{message}</p>
            </div>
            <button className="consulta-modal-close" onClick={onClose}>
              ✕
            </button>
          </div>
          <div className="consulta-modal-actions">
            <button 
              className="consulta-btn-confirm"
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button 
              className="consulta-btn-cancel"
              onClick={onClose}
            >
              {cancelText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 🎯 HOOK PERSONALIZADO PARA MANEJAR ALERTAS
export const useAlerta = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [alertaData, setAlertaData] = useState({});

  const openAlerta = (data = {}) => {
    setAlertaData(data);
    setIsOpen(true);
  };

  const closeAlerta = () => {
    setIsOpen(false);
    setAlertaData({});
  };

  return {
    isOpen,
    alertaData,
    openAlerta,
    closeAlerta
  };
};

// 👤 MODAL DE ÉXITO PARA REGISTRO DE PACIENTE - SUPERIOR DERECHA (SIMPLE)
export const PacienteRegistradoModal = ({ 
  isOpen, 
  onClose, 
  pacienteData = {},
  autoClose = true,
  autoCloseDelay = 3000 
}) => {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    let timer;
    if (isOpen && autoClose) {
      timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isOpen, autoClose, autoCloseDelay]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 300);
  }, [onClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('paciente-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="paciente-backdrop"
        onClick={handleOverlayClick}
      />
      <div className={`paciente-registrado-modal-simple ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="paciente-simple-content">
          <div className="paciente-simple-header">
            <div className="paciente-simple-icon">👤</div>
            <div className="paciente-simple-text">
              <div className="paciente-simple-title">¡Paciente registrado exitosamente!</div>
            </div>
            <button className="paciente-simple-close" onClick={handleClose}>
              ✕
            </button>
          </div>
          
          {autoClose && (
            <div className="paciente-simple-progress-container">
              <div 
                className="paciente-simple-progress-bar"
                style={{
                  animation: `progressBar ${autoCloseDelay}ms linear`
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

// 🚀 FUNCIONES HELPER PARA USO RÁPIDO
export const showCancelConfirm = (citaData, onConfirm) => {
  return {
    citaData,
    onConfirm,
    type: 'cancel'
  };
};

export const showConsultaConfirm = (title, message, onConfirm) => {
  return {
    title,
    message,
    onConfirm,
    type: 'consulta'
  };
};

export const showPacienteRegistrado = (pacienteData) => {
  return {
    pacienteData,
    type: 'paciente-registrado'
  };
};

export default { CancelCitaModal, ConsultaModal, PacienteRegistradoModal, useAlerta };