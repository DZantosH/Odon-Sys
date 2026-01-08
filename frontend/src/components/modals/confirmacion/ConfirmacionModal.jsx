import React from 'react';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  title = "¡Éxito!", 
  message = "Operación completada exitosamente", 
  type = "success", // success, error, info
  showCancel = false,
  onConfirm = null,
  confirmText = "Aceptar",
  cancelText = "Cancelar"
}) => {
  
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      case 'info':
        return 'ℹ️';
      default:
        return '✅';
    }
  };

  const getHeaderClass = () => {
    switch (type) {
      case 'error':
        return 'error-modal-header';
      case 'info':
        return 'info-modal-header';
      default:
        return 'confirmation-modal-header';
    }
  };

  const getContainerClass = () => {
    switch (type) {
      case 'error':
        return 'error-modal-container';
      default:
        return 'confirmation-modal-container';
    }
  };

  const getPrimaryButtonClass = () => {
    switch (type) {
      case 'error':
        return 'confirmation-btn confirmation-btn-primary error-btn-primary';
      case 'info':
        return 'confirmation-btn confirmation-btn-primary info-btn-primary';
      default:
        return 'confirmation-btn confirmation-btn-primary';
    }
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    } else {
      onClose();
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('confirmation-modal-overlay')) {
      onClose();
    }
  };

  return (
    <div className="confirmation-modal-overlay" onClick={handleOverlayClick}>
      <div className={getContainerClass()} onClick={(e) => e.stopPropagation()}>
        
        {/* Header */}
        <div className={getHeaderClass()}>
          <div className="confirmation-icon">
            {getIcon()}
          </div>
          <h3 className="confirmation-title">{title}</h3>
        </div>

        {/* Content */}
        <div className="confirmation-modal-content">
          <p className="confirmation-message">{message}</p>
          
          {/* Actions */}
          <div className="confirmation-modal-actions">
            {showCancel && (
              <button 
                className="confirmation-btn confirmation-btn-secondary"
                onClick={onClose}
              >
                {cancelText}
              </button>
            )}
            <button 
              className={getPrimaryButtonClass()}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;