import React, { useState, useCallback } from 'react';

const AvatarUploadComponent = ({ 
  paciente, 
  pacienteId, 
  buildApiUrl, 
  mostrarConfirmacion,
  onAvatarUpdated,
  size = 'large', // 'small', 'medium', 'large'
  editable = true,
  showControls = true
}) => {
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  // Configuraciones de tamaño
  const sizeConfig = {
    small: { 
      width: '40px', 
      height: '40px', 
      fontSize: '14px',
      borderWidth: '2px',
      onlineIndicator: '12px'
    },
    medium: { 
      width: '60px', 
      height: '60px', 
      fontSize: '18px',
      borderWidth: '2px',
      onlineIndicator: '14px'
    },
    large: { 
      width: '80px', 
      height: '80px', 
      fontSize: '24px',
      borderWidth: '3px',
      onlineIndicator: '16px'
    }
  };

  const config = sizeConfig[size] || sizeConfig.large;

  // Función para generar iniciales del paciente
  const generarIniciales = (paciente) => {
    if (!paciente) return 'PA';
    
    const nombre = paciente.nombre || '';
    const apellidoPaterno = paciente.apellido_paterno || '';
    
    return (nombre.charAt(0) + apellidoPaterno.charAt(0)).toUpperCase() || 'PA';
  };

  // Función para manejar la subida de foto del avatar
  const subirFotoAvatar = useCallback(async (file) => {
    if (!file || !editable) return;

    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'warning',
          title: '⚠️ Formato No Válido',
          message: 'Por favor selecciona una imagen válida (JPG, PNG, GIF, WEBP)',
          confirmText: 'Entendido',
          showCancel: false
        });
      } else {
        alert('⚠️ Por favor selecciona una imagen válida');
      }
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'warning',
          title: '⚠️ Archivo Muy Grande',
          message: 'La imagen debe ser menor a 5MB. Por favor selecciona una imagen más pequeña.',
          confirmText: 'Entendido',
          showCancel: false
        });
      } else {
        alert('⚠️ La imagen debe ser menor a 5MB');
      }
      return;
    }

    try {
      setSubiendoFoto(true);
      console.log('📸 Subiendo foto del avatar...');

      // Crear preview de la imagen
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
      };
      reader.readAsDataURL(file);

      const formData = new FormData();
      formData.append('avatar', file);
      formData.append('paciente_id', pacienteId);

      const response = await fetch(buildApiUrl(`/pacientes/${pacienteId}/avatar`), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const resultado = await response.json();
      console.log('✅ Foto subida exitosamente:', resultado);

      // Actualizar el estado del paciente con la nueva foto
      if (onAvatarUpdated) {
        onAvatarUpdated(resultado.foto_avatar || resultado.avatar_url);
      }

      // Limpiar preview
      setPreviewImage(null);

      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'success',
          title: '✅ Foto Actualizada',
          message: 'La foto del avatar se ha actualizado correctamente.',
          confirmText: 'Perfecto',
          showCancel: false
        });
      } else {
        alert('✅ Foto actualizada correctamente');
      }

    } catch (error) {
      console.error('❌ Error al subir foto:', error);
      
      // Limpiar preview en caso de error
      setPreviewImage(null);
      
      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'error',
          title: '❌ Error al Subir Foto',
          message: `No se pudo subir la imagen: ${error.message}`,
          confirmText: 'Reintentar',
          showCancel: false
        });
      } else {
        alert(`❌ Error al subir foto: ${error.message}`);
      }
    } finally {
      setSubiendoFoto(false);
    }
  }, [pacienteId, buildApiUrl, mostrarConfirmacion, onAvatarUpdated, editable]);

  // Función para manejar el cambio de archivo
  const handleAvatarChange = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      subirFotoAvatar(file);
    }
    // Limpiar el input para permitir seleccionar el mismo archivo nuevamente
    event.target.value = '';
  }, [subirFotoAvatar]);

  // Función para eliminar avatar
  const eliminarAvatar = useCallback(async () => {
    if (!paciente?.foto_avatar || !editable) return;

    try {
      let confirmado = true;
      
      if (mostrarConfirmacion) {
        confirmado = await mostrarConfirmacion({
          type: 'warning',
          title: '🗑️ Eliminar Avatar',
          message: '¿Estás seguro de que quieres eliminar la foto del avatar?',
          confirmText: 'Sí, eliminar',
          cancelText: 'Cancelar',
          showCancel: true
        });
      } else {
        // eslint-disable-next-line no-restricted-globals
        confirmado = window.confirm('¿Estás seguro de que quieres eliminar la foto del avatar?');
      }
        
      if (!confirmado) return;

      const response = await fetch(buildApiUrl(`/pacientes/${pacienteId}/avatar`), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar avatar');
      }

      // Actualizar el estado
      if (onAvatarUpdated) {
        onAvatarUpdated(null);
      }

      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'success',
          title: '✅ Avatar Eliminado',
          message: 'La foto del avatar se ha eliminado correctamente.',
          confirmText: 'Perfecto',
          showCancel: false
        });
      } else {
        alert('✅ Avatar eliminado correctamente');
      }

    } catch (error) {
      console.error('❌ Error al eliminar avatar:', error);
      
      if (mostrarConfirmacion) {
        await mostrarConfirmacion({
          type: 'error',
          title: '❌ Error al Eliminar Avatar',
          message: `No se pudo eliminar el avatar: ${error.message}`,
          confirmText: 'Entendido',
          showCancel: false
        });
      } else {
        alert(`❌ Error al eliminar avatar: ${error.message}`);
      }
    }
  }, [pacienteId, paciente?.foto_avatar, buildApiUrl, mostrarConfirmacion, onAvatarUpdated, editable]);

  const inputId = `avatar-input-${pacienteId}`;

  // Renderizar el componente
  return (
    <div 
      className="avatar-container"
      style={{ 
        position: 'relative', 
        display: 'inline-block',
        textAlign: 'center'
      }}
    >
      <div
        className="avatar-paciente"
        onClick={editable ? () => document.getElementById(inputId)?.click() : undefined}
        style={{
          position: 'relative',
          width: config.width,
          height: config.height,
          borderRadius: '50%',
          overflow: 'hidden',
          cursor: editable && !subiendoFoto ? 'pointer' : 'default',
          border: `${config.borderWidth} solid #e1e5e9`,
          background: '#f8f9fa',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: config.fontSize,
          fontWeight: 'bold',
          color: '#6c757d',
          transition: 'all 0.3s ease',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          margin: '0 auto',
          ...(editable && {
            ':hover': {
              borderColor: '#007bff',
              transform: 'scale(1.05)'
            }
          })
        }}
        title={editable ? 'Haz clic para cambiar la foto del avatar' : ''}
      >
        {subiendoFoto ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: size === 'small' ? '16px' : '20px',
            animation: 'spin 1s linear infinite'
          }}>
            ⏳
          </div>
        ) : previewImage ? (
          <img 
            src={previewImage}
            alt="Preview"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
        ) : paciente?.foto_avatar ? (
          <img 
            src={buildApiUrl(paciente.foto_avatar)} 
            alt={`Avatar de ${paciente.nombre}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
            onError={(e) => {
              // Si la imagen falla al cargar, mostrar iniciales
              e.target.style.display = 'none';
              const parent = e.target.parentNode;
              const initialsDiv = document.createElement('div');
              initialsDiv.style.cssText = `
                display: flex; 
                align-items: center; 
                justify-content: center; 
                width: 100%; 
                height: 100%; 
                font-size: ${config.fontSize}; 
                font-weight: bold; 
                color: #6c757d;
              `;
              initialsDiv.textContent = generarIniciales(paciente);
              parent.appendChild(initialsDiv);
            }}
          />
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            fontSize: config.fontSize,
            fontWeight: 'bold',
            color: '#6c757d'
          }}>
            {generarIniciales(paciente)}
          </div>
        )}
        
        {/* Indicador de estado online */}
        <div 
          className="avatar-estado-online"
          style={{
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: config.onlineIndicator,
            height: config.onlineIndicator,
            borderRadius: '50%',
            background: '#28a745',
            border: '2px solid white',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }}
        />
      </div>

      {/* Input file oculto */}
      {editable && (
        <input
          type="file"
          id={inputId}
          style={{ display: 'none' }}
          accept="image/*"
          onChange={handleAvatarChange}
          disabled={subiendoFoto}
        />
      )}

      {/* Controles adicionales */}
      {showControls && editable && (
        <div style={{
          marginTop: '8px',
          display: 'flex',
          justifyContent: 'center',
          gap: '8px',
          flexWrap: 'wrap'
        }}>
          {/* Botón cambiar foto */}
          <button
            onClick={() => document.getElementById(inputId)?.click()}
            disabled={subiendoFoto}
            style={{
              padding: '4px 8px',
              fontSize: '12px',
              border: '1px solid #007bff',
              background: '#007bff',
              color: 'white',
              borderRadius: '4px',
              cursor: subiendoFoto ? 'wait' : 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="Cambiar foto"
          >
            📸 Cambiar
          </button>

          {/* Botón eliminar foto (solo si tiene foto) */}
          {paciente?.foto_avatar && !subiendoFoto && (
            <button
              onClick={eliminarAvatar}
              style={{
                padding: '4px 8px',
                fontSize: '12px',
                border: '1px solid #dc3545',
                background: '#dc3545',
                color: 'white',
                borderRadius: '4px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Eliminar avatar"
            >
              🗑️ Eliminar
            </button>
          )}
        </div>
      )}

      {/* Instrucciones */}
      {editable && (
        <div style={{
          marginTop: showControls ? '4px' : '8px',
          fontSize: '11px',
          color: '#6c757d',
          textAlign: 'center',
          maxWidth: '120px'
        }}>
          {subiendoFoto ? 'Subiendo...' : (showControls ? 'JPG, PNG, GIF, WEBP (máx 5MB)' : 'Clic para cambiar foto')}
        </div>
      )}

      {/* Estilos CSS para animaciones */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .avatar-paciente:hover {
          border-color: #007bff !important;
          transform: scale(1.05) !important;
        }
        
        button:hover {
          opacity: 0.9;
          transform: translateY(-1px);
        }
        
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
};

export default AvatarUploadComponent;