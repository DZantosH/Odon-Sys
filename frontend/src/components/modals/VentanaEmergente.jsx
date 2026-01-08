// components/modals/VentanaEmergente.jsx
import React, { useState, useEffect, useCallback } from 'react';
import '../../css/VentanaEmergente.css';

const VentanaEmergente = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  titulo = "¿Estás seguro?",
  mensaje = "Esta acción no se puede deshacer",
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
  tipo = "warning", // 'warning', 'danger', 'info', 'question', 'success'
  autoClose = false,
  autoCloseDelay = 5000,
  posicion = "superior-derecha", // 'superior-derecha', 'superior-izquierda', 'centro'
  // Nuevas props para el modal de éxito
  detalles = null, // Array de detalles tipo { icono: '👤', label: 'Paciente', value: 'Juan Pérez' }
  mostrarBotonCancelar = true
}) => {
  const [isClosing, setIsClosing] = useState(false);

  // Auto-close si está habilitado
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

  const handleConfirm = useCallback(() => {
    onConfirm();
    handleClose();
  }, [onConfirm, handleClose]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('ventana-emergente-backdrop')) {
      handleClose();
    }
  };

  // Función para obtener el icono según el tipo
  const getIcono = () => {
    switch (tipo) {
      case 'warning':
        return '⚠️';
      case 'danger':
        return '🚨';
      case 'info':
        return 'ℹ️';
      case 'question':
        return '❓';
      case 'success':
        return '✅';
      default:
        return '⚠️';
    }
  };

  // Función para obtener la clase CSS según el tipo
  const getTipoClase = () => {
    switch (tipo) {
      case 'warning':
        return 'ventana-warning';
      case 'danger':
        return 'ventana-danger';
      case 'info':
        return 'ventana-info';
      case 'question':
        return 'ventana-question';
      case 'success':
        return 'ventana-success';
      default:
        return 'ventana-warning';
    }
  };

  // Función para obtener la clase de posición
  const getPosicionClase = () => {
    switch (posicion) {
      case 'superior-izquierda':
        return 'posicion-superior-izquierda';
      case 'centro':
        return 'posicion-centro';
      case 'superior-derecha':
      default:
        return 'posicion-superior-derecha';
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - solo para posición centro */}
      {posicion === 'centro' && (
        <div 
          className="ventana-emergente-backdrop"
          onClick={handleOverlayClick}
        />
      )}
      
      {/* Modal de ventana emergente */}
      <div className={`ventana-emergente-modal ${getTipoClase()} ${getPosicionClase()} ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="ventana-emergente-content">
          
          {/* Header */}
          <div className="ventana-emergente-header">
            <div className="ventana-emergente-icon">{getIcono()}</div>
            <div className="ventana-emergente-text">
              <div className="ventana-emergente-titulo">{titulo}</div>
              <div className="ventana-emergente-mensaje">{mensaje}</div>
            </div>
            <button className="ventana-emergente-close" onClick={handleClose}>
              ✕
            </button>
          </div>
          
          {/* Detalles adicionales (para modales de éxito) */}
          {detalles && detalles.length > 0 && (
            <div className="ventana-emergente-detalles">
              {detalles.map((detalle, index) => (
                <div key={index} className="detalle-item">
                  <span className="detalle-icono">{detalle.icono}</span>
                  <span className="detalle-label">{detalle.label}:</span>
                  <span className="detalle-value">{detalle.value}</span>
                </div>
              ))}
            </div>
          )}
          
          {/* Botones de acción */}
          <div className="ventana-emergente-actions">
            <button 
              className={`ventana-btn-confirm ventana-btn-${tipo}`}
              onClick={handleConfirm}
            >
              {textoConfirmar}
            </button>
            {mostrarBotonCancelar && (
              <button 
                className="ventana-btn-cancel"
                onClick={handleClose}
              >
                {textoCancelar}
              </button>
            )}
          </div>
          
          {/* Barra de progreso si es auto-close */}
          {autoClose && (
            <div className="ventana-progress-container">
              <div 
                className="ventana-progress-bar"
                style={{
                  animation: `ventanaProgressBar ${autoCloseDelay}ms linear`
                }}
              />
            </div>
          )}
          
        </div>
      </div>
    </>
  );
};

export default VentanaEmergente;