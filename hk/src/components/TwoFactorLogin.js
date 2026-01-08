import React, { useState, useRef, useEffect } from 'react';
import '../css/Login.css'; // Reusamos los estilos del login

const TwoFactorLogin = ({ user, tempToken, onSuccess, onBack, apiUrl }) => {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputsRef = useRef([]);

  useEffect(() => {
    // Enfocar el primer input al cargar
    if (inputsRef.current[0]) {
      inputsRef.current[0].focus();
    }
  }, []);

  const handleChange = (index, value) => {
    if (isNaN(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Saltar al siguiente input
    if (value && index < 5) {
      inputsRef.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Borrar y retroceder
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1].focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    if (pastedData.every(char => !isNaN(char))) {
      const newCode = [...code];
      pastedData.forEach((char, i) => {
        if (i < 6) newCode[i] = char;
      });
      setCode(newCode);
      if (inputsRef.current[Math.min(pastedData.length, 5)]) {
        inputsRef.current[Math.min(pastedData.length, 5)].focus();
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCode = code.join('');
    if (finalCode.length !== 6) return;

    setLoading(true);
    setError('');

    try {
      // Verificar código con el backend
      const response = await fetch(`${apiUrl}/auth/verify-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tempToken}` // Enviamos el token temporal
        },
        body: JSON.stringify({ token: finalCode }) // 'token' es el código TOTP
      });

      const data = await response.json();

      if (response.ok) {
        // Si el backend devuelve un nuevo token renovado, úsalo. Si no, usa el temporal.
        onSuccess(data.token || tempToken);
      } else {
        setError(data.message || 'Código incorrecto');
        setLoading(false);
        setCode(['', '', '', '', '', '']); // Limpiar
        inputsRef.current[0].focus();
      }
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-screen-container fade-in">
      <div className="absolute-bg"></div>

      <div className="login-card" style={{ maxWidth: '400px' }}>
        <div className="card-header">
          <div className="logo-container" style={{ background: '#ecfdf5', borderColor: '#a7f3d0' }}>
            <span style={{ fontSize: '28px' }}>🔐</span>
          </div>
          <h1 className="welcome-text">Autenticación de 2 Factores</h1>
          <p className="subtitle-text">
            Ingresa el código de 6 dígitos de tu aplicación Google Authenticator.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
            {code.map((digit, index) => (
              <input
                key={index}
                ref={el => inputsRef.current[index] = el}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="tailwind-input"
                style={{
                  width: '45px',
                  height: '50px',
                  textAlign: 'center',
                  fontSize: '20px',
                  fontWeight: 'bold',
                  padding: '0'
                }}
              />
            ))}
          </div>

          {error && (
            <div className="error-alert">
              <span>⚠️ {error}</span>
            </div>
          )}

          <button 
            type="submit" 
            className={`btn-primary ${loading ? 'loading' : ''}`}
            disabled={code.join('').length !== 6 || loading}
          >
            {loading ? <span className="spinner"></span> : "Verificar Código"}
          </button>

          <button 
            type="button" 
            onClick={onBack}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--slate-500)',
              fontSize: '14px',
              cursor: 'pointer',
              marginTop: '10px',
              textDecoration: 'underline'
            }}
          >
            ← Volver al inicio de sesión
          </button>
        </form>
      </div>
    </div>
  );
};

export default TwoFactorLogin;