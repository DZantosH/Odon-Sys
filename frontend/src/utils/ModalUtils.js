// utils/ModalUtils.js - Utilidades para manejar modales sin usar alert/confirm

/**
 * Crea un modal personalizado para mostrar mensajes
 */
export const mostrarModal = (titulo, mensaje, tipo = 'info') => {
  return new Promise((resolve) => {
    // Crear elementos del modal
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      position: relative;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 24px;
      margin-right: 12px;
    `;

    // Definir iconos según el tipo
    const iconos = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };

    icon.textContent = iconos[tipo] || iconos['info'];

    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    `;
    titleElement.textContent = titulo;

    const content = document.createElement('div');
    content.style.cssText = `
      margin-bottom: 20px;
      color: #666;
      line-height: 1.5;
      white-space: pre-wrap;
    `;
    content.textContent = mensaje;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const okButton = document.createElement('button');
    okButton.style.cssText = `
      background: #007bff;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    `;
    okButton.textContent = 'Aceptar';
    okButton.onmouseover = () => okButton.style.backgroundColor = '#0056b3';
    okButton.onmouseout = () => okButton.style.backgroundColor = '#007bff';

    const cerrarModal = () => {
      document.body.removeChild(overlay);
      resolve(true);
    };

    okButton.onclick = cerrarModal;
    overlay.onclick = (e) => {
      if (e.target === overlay) cerrarModal();
    };

    // Manejar tecla Escape
    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        cerrarModal();
        document.removeEventListener('keydown', handleKeydown);
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // Ensamblar el modal
    header.appendChild(icon);
    header.appendChild(titleElement);
    buttonContainer.appendChild(okButton);
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // Agregar al DOM
    document.body.appendChild(overlay);
    okButton.focus();
  });
};

/**
 * Crea un modal de confirmación personalizado
 */
export const mostrarConfirmacion = (titulo, mensaje, opciones = {}) => {
  const {
    textoConfirmar = 'Confirmar',
    textoCancelar = 'Cancelar',
    tipo = 'warning'
  } = opciones;

  return new Promise((resolve) => {
    // Crear elementos del modal
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;

    const modal = document.createElement('div');
    modal.style.cssText = `
      background: white;
      border-radius: 8px;
      padding: 24px;
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
      position: relative;
    `;

    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      align-items: center;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #e0e0e0;
    `;

    const icon = document.createElement('span');
    icon.style.cssText = `
      font-size: 24px;
      margin-right: 12px;
    `;

    const iconos = {
      'info': 'ℹ️',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌'
    };

    icon.textContent = iconos[tipo] || iconos['warning'];

    const titleElement = document.createElement('h3');
    titleElement.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
      font-weight: 600;
    `;
    titleElement.textContent = titulo;

    const content = document.createElement('div');
    content.style.cssText = `
      margin-bottom: 20px;
      color: #666;
      line-height: 1.5;
      white-space: pre-wrap;
    `;
    content.textContent = mensaje;

    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    `;

    const cancelButton = document.createElement('button');
    cancelButton.style.cssText = `
      background: #6c757d;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    `;
    cancelButton.textContent = textoCancelar;
    cancelButton.onmouseover = () => cancelButton.style.backgroundColor = '#545b62';
    cancelButton.onmouseout = () => cancelButton.style.backgroundColor = '#6c757d';

    const confirmButton = document.createElement('button');
    confirmButton.style.cssText = `
      background: #dc3545;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background-color 0.2s;
    `;
    confirmButton.textContent = textoConfirmar;
    confirmButton.onmouseover = () => confirmButton.style.backgroundColor = '#c82333';
    confirmButton.onmouseout = () => confirmButton.style.backgroundColor = '#dc3545';

    const cerrarModal = (resultado) => {
      document.body.removeChild(overlay);
      document.removeEventListener('keydown', handleKeydown);
      resolve(resultado);
    };

    const handleKeydown = (e) => {
      if (e.key === 'Escape') {
        cerrarModal(false);
      } else if (e.key === 'Enter') {
        cerrarModal(true);
      }
    };

    cancelButton.onclick = () => cerrarModal(false);
    confirmButton.onclick = () => cerrarModal(true);
    overlay.onclick = (e) => {
      if (e.target === overlay) cerrarModal(false);
    };

    document.addEventListener('keydown', handleKeydown);

    // Ensamblar el modal
    header.appendChild(icon);
    header.appendChild(titleElement);
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(confirmButton);
    modal.appendChild(header);
    modal.appendChild(content);
    modal.appendChild(buttonContainer);
    overlay.appendChild(modal);

    // Agregar al DOM
    document.body.appendChild(overlay);
    confirmButton.focus();
  });
};

/**
 * Modal para mostrar errores de validación
 */
export const mostrarErroresValidacion = (errores) => {
  const mensajesError = Object.entries(errores)
    .map(([campo, mensaje]) => `• ${mensaje}`)
    .join('\n');
    
  return mostrarModal(
    'Errores de Validación',
    `Se encontraron los siguientes errores:\n\n${mensajesError}\n\nPor favor, corrija estos campos antes de continuar.`,
    'warning'
  );
};

/**
 * Modal para mostrar progreso de guardado
 */
export const mostrarProgresoGuardado = (progreso) => {
  const { baseDatos, pdfGenerado, pdfGuardado, versionDigital } = progreso;
  
  const items = [
    { texto: 'Base de datos', completado: baseDatos },
    { texto: 'Generación PDF', completado: pdfGenerado },
    { texto: 'Guardado local', completado: pdfGuardado },
    { texto: 'Versión digital', completado: versionDigital }
  ];
  
  const progresoeTexto = items
    .map(item => `${item.completado ? '✅' : '⏳'} ${item.texto}`)
    .join('\n');
    
  return mostrarModal(
    'Guardando Historial',
    `📄 Guardando historial clínico...\n\n${progresoeTexto}`,
    'info'
  );
};

/**
 * Función de utilidad para reemplazar alert
 */
export const alerta = (mensaje, tipo = 'info') => {
  return mostrarModal('Información', mensaje, tipo);
};

/**
 * Función de utilidad para reemplazar confirm
 */
export const confirmar = (mensaje, opciones = {}) => {
  return mostrarConfirmacion('Confirmación', mensaje, opciones);
};

// Exportar funciones principales
export default {
  mostrarModal,
  mostrarConfirmacion,
  mostrarErroresValidacion,
  mostrarProgresoGuardado,
  alerta,
  confirmar
};