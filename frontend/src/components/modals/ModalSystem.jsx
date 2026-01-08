// components/modals/ModalSystem.jsx
import React, { useState, useEffect, useCallback } from 'react';
import '../../css/ModalSystem.css';

// 🎨 COMPONENTE BASE PARA TODOS LOS MODALES
const BaseModal = ({ 
  isOpen, 
  onClose, 
  title, 
  icon, 
  children, 
  size = 'medium',
  position = 'center',
  showCloseButton = true,
  backdrop = true,
  className = ''
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      onClose();
    }
  };

  if (!isVisible) return null;

  const modalClasses = [
    'custom-modal',
    `modal-${size}`,
    `modal-${position}`,
    isOpen ? 'modal-open' : 'modal-closing',
    className
  ].join(' ');

  return (
    <>
      {backdrop && (
        <div 
          className={`modal-backdrop ${isOpen ? 'backdrop-open' : 'backdrop-closing'}`}
          onClick={handleOverlayClick}
        />
      )}
      <div className={modalClasses}>
        {(title || showCloseButton) && (
          <div className="modal-header">
            {icon && <div className="modal-icon">{icon}</div>}
            {title && <h3 className="modal-title">{title}</h3>}
            {showCloseButton && (
              <button className="modal-close-btn" onClick={onClose}>
                ✕
              </button>
            )}
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
      </div>
    </>
  );
};

// 🔔 MODAL DE CONFIRMACIÓN ELEGANTE
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirmar acción",
  message = "¿Estás seguro de que deseas continuar?",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  type = "question",
  icon,
  showIcon = true,
  position = "center"
}) => {
  const typeIcons = {
    question: "❓",
    warning: "⚠️",
    danger: "🚨",
    info: "ℹ️",
    success: "✅"
  };

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

  const positionClass = position === "top-left" ? "modal-top-left" : 
                       position === "top-right" ? "modal-top-right" : 
                       "modal-center";

  return (
    <>
      <div 
        className="modal-backdrop backdrop-open modern-backdrop"
        onClick={handleOverlayClick}
      />
      <div className={`modern-confirm-modal modal-open ${positionClass}`}>
        <div className="modern-confirm-content">
          {showIcon && (
            <div className="modern-confirm-icon">
              {icon || typeIcons[type]}
            </div>
          )}
          <h3 className="modern-confirm-title">{title}</h3>
          <p className="modern-confirm-message">{message}</p>
          <div className="modern-confirm-actions">
            <button 
              className={`modern-btn-confirm modern-btn-${type}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
            <button 
              className="modern-btn-cancel"
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

// 🔄 MODAL DE ESTADO ACTUALIZADO - SUPERIOR DERECHA
export const EstadoActualizadoModal = ({ 
  isOpen, 
  onClose, 
  nuevoEstado = "Completada",
  autoClose = true,
  autoCloseDelay = 4000 
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
    if (e.target.classList.contains('estado-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  // Función para obtener el icono según el estado
  const getEstadoIcono = (estado) => {
    switch (estado?.toLowerCase()) {
      case 'completada': return '✅';
      case 'confirmada': return '✅';
      case 'en_proceso': return '🔄';
      case 'programada': return '📅';
      case 'cancelada': return '❌';
      case 'no_asistio': return '🚫';
      default: return '✅';
    }
  };

  return (
    <>
      <div 
        className="estado-backdrop"
        onClick={handleOverlayClick}
      />
      <div className={`estado-actualizado-modal ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="estado-actualizado-content">
          <div className="estado-header">
            <div className="estado-icon">{getEstadoIcono(nuevoEstado)}</div>
            <div className="estado-text">
              <div className="estado-title">Estado actualizado exitosamente</div>
              <div className="estado-message">
                El estado de la cita ha sido actualizado a <strong>{nuevoEstado}</strong>
              </div>
            </div>
            <button className="estado-close" onClick={handleClose}>
              ✕
            </button>
          </div>
          
          {autoClose && (
            <div className="estado-progress-container">
              <div 
                className="estado-progress-bar"
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

// 📸 MODAL DE FOTO ACTUALIZADA
export const FotoActualizadaModal = ({ 
  isOpen, 
  onClose,
  titulo = "Foto actualizada correctamente",
  mensaje = "La imagen se ha subido exitosamente al sistema.",
  confirmText = "Aceptar",
  tipo = "success"
}) => {
  const tipoIconos = {
    success: "✅",
    info: "ℹ️", 
    warning: "⚠️"
  };

  const handleConfirm = () => {
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
      <div className="modern-confirm-modal modal-open modal-top-right">
        <div className="modern-confirm-content">
          <div className="modern-confirm-icon">
            {tipoIconos[tipo]}
          </div>
          <h3 className="modern-confirm-title">{titulo}</h3>
          <p className="modern-confirm-message">{mensaje}</p>
          <div className="modern-confirm-actions">
            <button 
              className={`modern-btn-confirm modern-btn-${tipo}`}
              onClick={handleConfirm}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// 📋 MODAL DE INFORMACIÓN
export const InfoModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  details = [],
  icon = "ℹ️",
  buttonText = "Entendido"
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      size="medium"
      position="center"
    >
      <div className="info-modal-content">
        <p className="info-message">{message}</p>
        {details.length > 0 && (
          <div className="info-details">
            <ul>
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="info-actions">
          <button className="btn-info" onClick={onClose}>
            {buttonText}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// 🚨 MODAL DE ERROR
export const ErrorModal = ({ 
  isOpen, 
  onClose, 
  title = "Error",
  error, 
  details,
  onRetry
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon="❌"
      size="medium"
      position="center"
    >
      <div className="error-modal-content">
        <p className="error-message">{error}</p>
        {details && (
          <div className="error-details">
            <p><strong>Detalles técnicos:</strong></p>
            <pre>{details}</pre>
          </div>
        )}
        <div className="error-actions">
          {onRetry && (
            <button className="btn-retry" onClick={onRetry}>
              🔄 Reintentar
            </button>
          )}
          <button className="btn-close" onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

// 📝 MODAL DE FORMULARIO
export const FormModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  onSubmit,
  submitText = "Guardar",
  cancelText = "Cancelar",
  icon = "📝",
  size = "large"
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(e);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      icon={icon}
      size={size}
      position="center"
    >
      <form onSubmit={handleSubmit} className="form-modal-content">
        <div className="form-modal-body">
          {children}
        </div>
        <div className="form-modal-actions">
          <button type="submit" className="btn-submit">
            {submitText}
          </button>
          <button type="button" className="btn-cancel" onClick={onClose}>
            {cancelText}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

// 🎉 MODAL DE NOTIFICACIÓN DE ÉXITO - SUPERIOR DERECHA
export const SuccessNotificationModal = ({ 
  isOpen, 
  onClose, 
  title = "¡Operación exitosa!",
  message = "La acción se ha completado correctamente",
  autoClose = true,
  autoCloseDelay = 3000,
  showCloseButton = true,
  icon = "✅"
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
    if (e.target.classList.contains('success-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="success-backdrop"
        onClick={handleOverlayClick}
      />
      <div className={`success-notification-modal ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="success-notification-content">
          <div className="success-header">
            <div className="success-icon">{icon}</div>
            <div className="success-text">
              <div className="success-title">{title}</div>
              <div className="success-message">{message}</div>
            </div>
            {showCloseButton && (
              <button className="success-close" onClick={handleClose}>
                ✕
              </button>
            )}
          </div>
          
          {autoClose && (
            <div className="success-progress-container">
              <div 
                className="success-progress-bar"
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


// 🗑️ MODAL ESPECIALIZADO PARA CONFIRMACIÓN DE CITA CANCELADA
export const CitaCanceladaSuccessModal = ({ 
  isOpen, 
  onClose, 
  citaData = {},
  autoClose = true,
  autoCloseDelay = 4000 
}) => {
  const message = citaData.pacienteNombre 
    ? `La cita de ${citaData.pacienteNombre} ha sido cancelada`
    : "La cita ha sido cancelada exitosamente";

  return (
    <SuccessNotificationModal
      isOpen={isOpen}
      onClose={onClose}
      title="🗑️ Cita cancelada exitosamente"
      message={message}
      autoClose={autoClose}
      autoCloseDelay={autoCloseDelay}
      icon="🗑️"
    />
  );
};

// 🔄 MODAL ESPECIALIZADO PARA CONVERSIÓN DE PACIENTE TEMPORAL A ACTIVO
export const PacienteConvertidoSuccessModal = ({ 
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
    if (e.target.classList.contains('success-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  const mensaje = pacienteData.nombre 
    ? `${pacienteData.nombre} ha sido convertido a paciente activo`
    : "Paciente convertido exitosamente";

  return (
    <>
      {/* Backdrop sutil */}
      <div 
        className="success-backdrop"
        onClick={handleOverlayClick}
      />
      
      {/* Modal de conversión exitosa */}
      <div className={`simple-success-modal ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="simple-success-content">
          {/* Icono y mensaje */}
          <div className="simple-success-header">
            <div className="simple-success-icon">✅</div>
            <div className="simple-success-text">
              <div className="simple-success-title">Se ha cambiado correctamente</div>
              <div className="simple-success-message">{mensaje}</div>
            </div>
            <button className="simple-success-close" onClick={handleClose}>
              ✕
            </button>
          </div>
          
          {/* Barra de progreso si es auto-close */}
          {autoClose && (
            <div className="simple-success-progress-container">
              <div 
                className="simple-success-progress-bar"
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

// 📅 MODAL SIMPLE DE CONFIRMACIÓN DE CITA AGENDADA - SUPERIOR DERECHA
export const CitaAgendadaSuccessModal = ({ 
  isOpen, 
  onClose, 
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
    if (e.target.classList.contains('success-backdrop')) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop sutil */}
      <div 
        className="success-backdrop"
        onClick={handleOverlayClick}
      />
      
      {/* Modal simplificado */}
      <div className={`simple-success-modal ${isClosing ? 'modal-closing' : 'modal-open'}`}>
        <div className="simple-success-content">
          {/* Icono y mensaje */}
          <div className="simple-success-header">
            <div className="simple-success-icon">✅</div>
            <div className="simple-success-text">
              <div className="simple-success-title">¡Cita creada exitosamente!</div>
            </div>
            <button className="simple-success-close" onClick={handleClose}>
              ✕
            </button>
          </div>
          
          {/* Barra de progreso si es auto-close */}
          {autoClose && (
            <div className="simple-success-progress-container">
              <div 
                className="simple-success-progress-bar"
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

// 🧪 MODAL DE DETALLES DE ESTUDIO DE LABORATORIO
export const EstudioDetallesModal = ({
  isOpen,
  onClose,
  estudio,
  formatearFecha,
  buildApiUrl
}) => {
  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  if (!isOpen || !estudio) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-detalles">
        <div className="modal-header-detalle">
          <div className="modal-titulo-seccion">
            <span className="modal-icono">🧪</span>
            <h2>Detalles Completos del Estudio</h2>
          </div>
          <button 
            onClick={onClose}
            className="modal-close-btn"
          >
            ✕
          </button>
        </div>
        
        <div className="modal-body-detalle">
          <div className="detalle-container">
            
            {/* TÍTULO Y ESTADO DEL ESTUDIO */}
            <div className="detalle-header-card">
              <div className="detalle-titulo-principal">
                <h3>{estudio.tipo_estudio}</h3>
                <span className={`estado-badge-detalle estado-${estudio.estado?.toLowerCase() || 'pendiente'}`}>
                  {estudio.estado || 'PENDIENTE'}
                </span>
              </div>
            </div>

            {/* INFORMACIÓN PRINCIPAL EN GRID */}
            <div className="detalle-info-grid">
              
              <div className="info-card">
                <div className="info-header">
                  <span className="info-icono">📅</span>
                  <span className="info-label">Fecha de Solicitud</span>
                </div>
                <div className="info-valor">
                  {formatearFecha(estudio.fecha_solicitud)}
                </div>
              </div>

              {estudio.laboratorio && (
                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icono">🏥</span>
                    <span className="info-label">Laboratorio</span>
                  </div>
                  <div className="info-valor">
                    {estudio.laboratorio}
                  </div>
                </div>
              )}

              <div className="info-card">
                <div className="info-header">
                  <span className="info-icono">⚡</span>
                  <span className="info-label">Urgencia</span>
                </div>
                <div className="info-valor">
                  <span className={`urgencia-pill urgencia-${estudio.urgencia || 'normal'}`}>
                    {estudio.urgencia === 'emergencia' ? '🚨 Emergencia' :
                     estudio.urgencia === 'alta' ? '🔴 Alta' : 
                     estudio.urgencia === 'media' ? '🟡 Media' : '🟢 Normal'}
                  </span>
                </div>
              </div>

              <div className="info-card">
                <div className="info-header">
                  <span className="info-icono">🍽️</span>
                  <span className="info-label">Requiere Ayunas</span>
                </div>
                <div className="info-valor">
                  <span className={`ayunas-pill ${estudio.ayunas === 'si' ? 'ayunas-si' : 'ayunas-no'}`}>
                    {estudio.ayunas === 'si' ? '✅ Sí' : '❌ No'}
                  </span>
                </div>
              </div>

              {estudio.fecha_realizacion && (
                <div className="info-card">
                  <div className="info-header">
                    <span className="info-icono">✅</span>
                    <span className="info-label">Fecha de Realización</span>
                  </div>
                  <div className="info-valor">
                    {formatearFecha(estudio.fecha_realizacion)}
                  </div>
                </div>
              )}

            </div>

            {/* SECCIONES DE TEXTO */}
            {estudio.descripcion && (
              <div className="detalle-texto-card">
                <div className="texto-header">
                  <span className="texto-icono">📝</span>
                  <h4>Descripción/Motivo</h4>
                </div>
                <div className="texto-contenido">
                  {estudio.descripcion}
                </div>
              </div>
            )}

            {estudio.instrucciones_especiales && (
              <div className="detalle-texto-card">
                <div className="texto-header">
                  <span className="texto-icono">🔧</span>
                  <h4>Instrucciones Especiales</h4>
                </div>
                <div className="texto-contenido">
                  {estudio.instrucciones_especiales}
                </div>
              </div>
            )}

            {/* RESULTADO SI EXISTE */}
            {estudio.archivo_resultado && (
              <div className="detalle-resultado-card">
                <div className="resultado-header">
                  <span className="resultado-icono">📊</span>
                  <h4>Resultado Disponible</h4>
                </div>
                <button 
                  onClick={() => window.open(buildApiUrl(estudio.archivo_resultado), '_blank')}
                  className="btn-ver-resultado-modal"
                >
                  📊 Abrir Resultado Completo
                </button>
              </div>
            )}

          </div>
          
          <div className="modal-footer-acciones">
            <button 
              onClick={onClose}
              className="btn-cerrar-detalle"
            >
              ✅ Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 📤 MODAL PARA SUBIR RESULTADO DE ESTUDIO
export const SubirResultadoModal = ({
  isOpen,
  onClose,
  estudio,
  formatearFecha,
  onSubirResultado
}) => {
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      onClose();
    }
  };

  const handleSubmit = async () => {
    if (!archivoSeleccionado) {
      alert('⚠️ Selecciona un archivo primero');
      return;
    }

    // Validar tipo de archivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(archivoSeleccionado.type)) {
      alert('⚠️ Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, PNG, DOC, DOCX');
      return;
    }

    // Validar tamaño (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (archivoSeleccionado.size > maxSize) {
      alert('⚠️ El archivo es demasiado grande. Tamaño máximo: 10MB');
      return;
    }

    try {
      await onSubirResultado(estudio, archivoSeleccionado);
      setArchivoSeleccionado(null);
      onClose();
    } catch (error) {
      console.error('❌ Error al subir resultado:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const handleClose = () => {
    setArchivoSeleccionado(null);
    onClose();
  };

  if (!isOpen || !estudio) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content modal-subir-resultado">
        <div className="modal-header">
          <h2>📤 Subir Resultado de Estudio</h2>
          <button 
            onClick={handleClose}
            className="close-btn"
          >
            ✕
          </button>
        </div>
        <div className="modal-body">
          <div className="info-estudio">
            <h3>🧪 {estudio.tipo_estudio}</h3>
            <p><strong>📅 Solicitado:</strong> {formatearFecha(estudio.fecha_solicitud)}</p>
          </div>
          <div className="upload-area">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
              className="file-input"
              id="archivo-resultado"
            />
            <label htmlFor="archivo-resultado" className="file-label">
              📄 Seleccionar resultado (PDF, JPG, PNG)
            </label>
            
            {archivoSeleccionado && (
              <div className="file-selected">
                <div className="file-info">
                  <span className="file-icon">
                    {archivoSeleccionado.type === 'application/pdf' ? '📄' : 
                     archivoSeleccionado.type.startsWith('image/') ? '🖼️' : '📋'}
                  </span>
                  <div className="file-details">
                    <div className="file-name">✅ {archivoSeleccionado.name}</div>
                    <div className="file-size">
                      {(archivoSeleccionado.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="modal-actions">
            <button 
              onClick={handleClose}
              className="btn-secundario"
            >
              ❌ Cancelar
            </button>
            <button 
              onClick={handleSubmit}
              disabled={!archivoSeleccionado}
              className="btn-primario"
            >
              📤 Subir Resultado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// 🎣 HOOK PERSONALIZADO PARA MANEJAR MODALES
export const useModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [modalData, setModalData] = useState({});

  const openModal = (data = {}) => {
    setModalData(data);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setModalData({});
  };

  return {
    isOpen,
    modalData,
    openModal,
    closeModal
  };
};

// 🎯 HOOK PARA MANEJAR NOTIFICACIONES DE ÉXITO
export const useSuccessNotification = () => {
  const [notification, setNotification] = useState({
    isOpen: false,
    title: '',
    message: '',
    icon: '✅'
  });

  const showSuccess = (title, message, icon = '✅') => {
    setNotification({
      isOpen: true,
      title,
      message,
      icon
    });
  };

  const hideSuccess = () => {
    setNotification(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  return {
    notification,
    showSuccess,
    hideSuccess
  };
};

// 🚀 FUNCIONES HELPER PARA USO RÁPIDO
export const showConfirm = (options) => {
  return new Promise((resolve) => {
    resolve(window.confirm(options.message));
  });
};

export const showAlert = (message, type = 'info') => {
  console.log(`${type.toUpperCase()}: ${message}`);
};

export default BaseModal;