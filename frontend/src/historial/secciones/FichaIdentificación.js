import React from 'react';
import '../../css/HistorialFormularios.css'; // Agregar esta línea

const FichaIdentificacion = ({ datos, errores, onChange }) => {
  return (
    <div className="ficha-identificacion-container">
      {/* Header personalizado - MÁS GRANDE Y VISIBLE */}
      <div className="ficha-header">
        <h3 className="ficha-header-title">🆔 Ficha de Identificación</h3>
        <p className="ficha-header-subtitle">
          Información personal y datos de contacto del paciente
        </p>
      </div>

      {/* Sección de Datos Personales - MÁS ESPACIOSA */}
      <div className="ficha-card">
        <div className="ficha-card-header">
          <h4 className="ficha-card-title">👤 Datos Personales</h4>
          <span className="ficha-badge ficha-badge-obligatorio">Obligatorio</span>
        </div>
        <div className="ficha-form-group">
          <div className="ficha-grid-3">
            <div className="ficha-field">
              <label className="ficha-label">Nombre(s) *</label>
              <input
                type="text"
                className={`ficha-input ${errores.nombre ? 'ficha-input-error' : ''}`}
                value={datos.nombre || ''}
                onChange={(e) => onChange('nombre', e.target.value)}
                placeholder="Nombre completo del paciente"
              />
              {errores.nombre && (
                <span className="ficha-error-message">
                  {errores.nombre}
                </span>
              )}
            </div>

            <div className="ficha-field">
              <label className="ficha-label">Apellido Paterno *</label>
              <input
                type="text"
                className={`ficha-input ${errores.apellidoPaterno ? 'ficha-input-error' : ''}`}
                value={datos.apellidoPaterno || ''}
                onChange={(e) => onChange('apellidoPaterno', e.target.value)}
                placeholder="Apellido paterno"
              />
              {errores.apellidoPaterno && (
                <span className="ficha-error-message">
                  {errores.apellidoPaterno}
                </span>
              )}
            </div>

            <div className="ficha-field">
              <label className="ficha-label">Apellido Materno *</label>
              <input
                type="text"
                className={`ficha-input ${errores.apellidoMaterno ? 'ficha-input-error' : ''}`}
                value={datos.apellidoMaterno || ''}
                onChange={(e) => onChange('apellidoMaterno', e.target.value)}
                placeholder="Apellido materno"
              />
              {errores.apellidoMaterno && (
                <span className="ficha-error-message">
                  {errores.apellidoMaterno}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Información Demográfica - ACTUALIZADA CON NUEVAS OPCIONES */}
      <div className="ficha-card">
        <div className="ficha-card-header">
          <h4 className="ficha-card-title">📊 Información Demográfica</h4>
          <span className="ficha-badge ficha-badge-demografico">Básico</span>
        </div>
        <div className="ficha-form-group">
          <div className="ficha-grid-3">
            <div className="ficha-field">
              <label className="ficha-label">Sexo *</label>
              <select
                className={`ficha-input ficha-select ${errores.sexo ? 'ficha-input-error' : ''}`}
                value={datos.sexo || ''}
                onChange={(e) => onChange('sexo', e.target.value)}
              >
                <option value="">Selecciona una opción</option>
                <option value="Masculino">👨 Masculino</option>
                <option value="Femenino">👩 Femenino</option>
                <option value="No binario">⚧ No binario</option>
              </select>
              {errores.sexo && (
                <span className="ficha-error-message">
                  {errores.sexo}
                </span>
              )}
            </div>

            <div className="ficha-field">
              <label className="ficha-label">📅 Fecha de Nacimiento *</label>
              <input
                type="date"
                className={`ficha-input ${errores.fechaNacimiento ? 'ficha-input-error' : ''}`}
                value={datos.fechaNacimiento || ''}
                onChange={(e) => onChange('fechaNacimiento', e.target.value)}
              />
              {errores.fechaNacimiento && (
                <span className="ficha-error-message">
                  {errores.fechaNacimiento}
                </span>
              )}
            </div>

            <div className="ficha-field">
              <label className="ficha-label">🆔 RFC *</label>
              <input
                type="text"
                className={`ficha-input ficha-input-uppercase ${errores.rfc ? 'ficha-input-error' : ''}`}
                value={datos.rfc || ''}
                onChange={(e) => onChange('rfc', e.target.value.toUpperCase())}
                placeholder="XXXX000000XXX"
                maxLength="13"
                readOnly={datos.rfc && datos.rfc.length === 13} // Solo lectura si viene prellenado
                title={datos.rfc && datos.rfc.length === 13 ? 'RFC prellenado desde registro inicial' : 'Ingrese el RFC del paciente'}
              />
              {errores.rfc && (
                <span className="ficha-error-message">
                  {errores.rfc}
                </span>
              )}
              {datos.rfc && datos.rfc.length === 13 && (
                <small className="ficha-info-text" style={{color: '#28a745', fontSize: '11px', marginTop: '3px', display: 'block'}}>
                  ✅ RFC prellenado desde registro inicial
                </small>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Contacto - SIN CAMBIOS */}
      <div className="ficha-card">
        <div className="ficha-card-header">
          <h4 className="ficha-card-title">📞 Información de Contacto</h4>
          <span className="ficha-badge ficha-badge-contacto">Contacto</span>
        </div>
        <div className="ficha-form-group">
          <div className="ficha-grid-2">
            <div className="ficha-field">
              <label className="ficha-label">📱 Teléfono *</label>
              <input
                type="tel"
                className={`ficha-input ${errores.telefono ? 'ficha-input-error' : ''}`}
                value={datos.telefono || ''}
                onChange={(e) => onChange('telefono', e.target.value)}
                placeholder="55 1234 5678"
              />
              {errores.telefono && (
                <span className="ficha-error-message">
                  {errores.telefono}
                </span>
              )}
            </div>

            <div className="ficha-field">
              <label className="ficha-label">📧 Correo Electrónico *</label>
              <input
                type="email"
                className={`ficha-input ${errores.email ? 'ficha-input-error' : ''}`}
                value={datos.email || ''}
                onChange={(e) => onChange('email', e.target.value)}
                placeholder="ejemplo@correo.com"
              />
              {errores.email && (
                <span className="ficha-error-message">
                  {errores.email}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Nota informativa - MÁS GRANDE Y VISIBLE */}
      <div className="ficha-info-note">
        <div className="ficha-info-icon">ℹ️</div>
        <div className="ficha-info-content">
          <h6 className="ficha-info-title">Información importante</h6>
          <p className="ficha-info-text">
            Todos los campos marcados con asterisco (*) son obligatorios. 
            Esta información será utilizada para crear el expediente médico del paciente.
            {datos.rfc && datos.rfc.length === 13 && (
              <>
                <br />
                <strong>Nota:</strong> El RFC ha sido prellenado desde el registro inicial del paciente.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FichaIdentificacion;