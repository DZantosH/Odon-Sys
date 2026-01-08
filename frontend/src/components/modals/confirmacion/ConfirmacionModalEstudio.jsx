import React, { useState, useCallback } from 'react';
import '../../../css/ConfirmacionModalEstudio.css';

// Hook personalizado para manejar confirmaciones
export const useConfirmacionEstudio = () => {
  const [confirmacion, setConfirmacion] = useState({
    isOpen: false,
    type: 'info', // success, error, warning, info
    title: '',
    message: '',
    details: null,
    confirmText: 'Aceptar',
    cancelText: 'Cancelar',
    showCancel: false,
    onConfirm: null,
    onCancel: null,
    autoClose: false,
    autoCloseDelay: 3000
  });

  const mostrarConfirmacion = useCallback((options) => {
    return new Promise((resolve) => {
      setConfirmacion({
        isOpen: true,
        type: options.type || 'info',
        title: options.title || '',
        message: options.message || '',
        details: options.details || null,
        confirmText: options.confirmText || 'Aceptar',
        cancelText: options.cancelText || 'Cancelar',
        showCancel: options.showCancel || false,
        autoClose: options.autoClose || false,
        autoCloseDelay: options.autoCloseDelay || 3000,
        onConfirm: () => {
          setConfirmacion(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        },
        onCancel: () => {
          setConfirmacion(prev => ({ ...prev, isOpen: false }));
          resolve(false);
        }
      });

      // Auto-close si está habilitado
      if (options.autoClose) {
        setTimeout(() => {
          setConfirmacion(prev => ({ ...prev, isOpen: false }));
          resolve(true);
        }, options.autoCloseDelay || 3000);
      }
    });
  }, []);

  const ocultarConfirmacion = useCallback(() => {
    setConfirmacion(prev => ({ ...prev, isOpen: false }));
  }, []);

  return {
    confirmacion,
    mostrarConfirmacion,
    ocultarConfirmacion
  };
};

// Componente de modal de confirmación
const ConfirmacionModalEstudio = ({ confirmacion, onClose }) => {
  if (!confirmacion?.isOpen) {
    return null;
  }

  const getIconForType = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
      default:
        return 'ℹ️';
    }
  };

  const getClassForType = (type) => {
    switch (type) {
      case 'success':
        return 'confirmacion-success';
      case 'error':
        return 'confirmacion-error';
      case 'warning':
        return 'confirmacion-warning';
      case 'info':
      default:
        return 'confirmacion-info';
    }
  };

  const handleConfirm = () => {
    if (confirmacion.onConfirm) {
      confirmacion.onConfirm();
    } else if (onClose) {
      onClose();
    }
  };

  const handleCancel = () => {
    if (confirmacion.onCancel) {
      confirmacion.onCancel();
    } else if (onClose) {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel();
    }
  };

  return (
    <div className="confirmacion-overlay" onClick={handleOverlayClick}>
      <div className={`confirmacion-modal ${getClassForType(confirmacion.type)}`}>
        {/* Header */}
        <div className="confirmacion-header">
          <div className="confirmacion-icon">
            {getIconForType(confirmacion.type)}
          </div>
          <h3 className="confirmacion-title">
            {confirmacion.title}
          </h3>
          <button
            className="confirmacion-close"
            onClick={handleCancel}
            type="button"
          >
            ✕
          </button>
        </div>

        {/* Contenido */}
        <div className="confirmacion-content">
          {confirmacion.message && (
            <p className="confirmacion-message">
              {confirmacion.message}
            </p>
          )}

          {/* Detalles estructurados */}
          {confirmacion.details && (
            <div className="confirmacion-details">
              {Object.entries(confirmacion.details).map(([key, value]) => {
                if (!value) return null;
                
                const formatKey = (k) => {
                  return k.replace(/_/g, ' ')
                    .replace(/\b\w/g, l => l.toUpperCase());
                };

                return (
                  <div key={key} className="detail-item">
                    <span className="detail-label">{formatKey(key)}:</span>
                    <span className="detail-value">{value}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer con botones */}
        <div className="confirmacion-footer">
          {confirmacion.showCancel && (
            <button
              className="btn-cancel"
              onClick={handleCancel}
              type="button"
            >
              {confirmacion.cancelText}
            </button>
          )}
          
          <button
            className={`btn-confirm btn-confirm-${confirmacion.type}`}
            onClick={handleConfirm}
            type="button"
          >
            {confirmacion.confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionModalEstudio;