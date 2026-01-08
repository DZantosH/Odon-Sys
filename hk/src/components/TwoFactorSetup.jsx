import React, { useState, useEffect } from 'react';
import { Shield, Smartphone, Key, Copy, Check, AlertCircle } from 'lucide-react';

const TwoFactorSetup = ({ user, onComplete, onCancel }) => {
  const [step, setStep] = useState(1); // 1: PIN, 2: QR Code, 3: Verificación
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [manualKey, setManualKey] = useState('');
  const [copied, setCopied] = useState(false);

  // Auto-detectar URL base
  const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5000/api' 
    : '/api';

  // Paso 1: Configurar PIN
  const handlePinSubmit = () => {
    if (pin.length !== 6 || !/^\d{6}$/.test(pin)) {
      setError('El PIN debe tener exactamente 6 dígitos numéricos');
      return;
    }
    
    if (pin !== confirmPin) {
      setError('Los PINs no coinciden');
      return;
    }
    
    setError('');
    generateQRCode();
  };

  // Paso 2: Generar código QR
  const generateQRCode = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem();
      const response = await fetch(`${API_URL}/auth/setup-2fa`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ pin })
      });

      if (response.ok) {
        const data = await response.json();
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setManualKey(data.manualKey);
        setStep(2);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Error al generar código QR');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Paso 3: Verificar configuración
  const handleVerification = async () => {
    if (verificationCode.length !== 6 || !/^\d{6}$/.test(verificationCode)) {
      setError('El código debe tener 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem();
      const response = await fetch(`${API_URL}/auth/verify-2fa-setup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          pin,
          totpCode: verificationCode 
        })
      });

      if (response.ok) {
        setStep(3);
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Código incorrecto');
      }
    } catch (error) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(manualKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error al copiar:', err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 px-6 py-4">
          <div className="flex items-center gap-3 text-white">
            <Shield className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-semibold">Configurar Autenticación 2FA</h3>
              <p className="text-sm text-blue-100">Paso {step} de 3</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Paso 1: Configurar PIN */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Crear PIN de Administrador
                </h4>
                <p className="text-sm text-gray-600">
                  Crea un PIN de 6 dígitos para acceder al panel administrativo
                </p>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PIN de 6 dígitos
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    value={pin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setPin(value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar PIN
                  </label>
                  <input
                    type="password"
                    maxLength="6"
                    value={confirmPin}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      setConfirmPin(value);
                      setError('');
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                    placeholder="000000"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePinSubmit}
                  disabled={pin.length !== 6 || confirmPin.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Procesando...' : 'Continuar'}
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Escanear QR */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  Configurar Google Authenticator
                </h4>
                <p className="text-sm text-gray-600">
                  Escanea este código QR con tu app de autenticación
                </p>
              </div>

              {qrCode && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-4 text-center">
                  <img 
                    src={qrCode} 
                    alt="QR Code" 
                    className="mx-auto mb-4"
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                </div>
              )}

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">
                    Clave manual (opcional):
                  </span>
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copiado' : 'Copiar'}
                  </button>
                </div>
                <code className="text-xs bg-white p-2 rounded border block break-all">
                  {manualKey}
                </code>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">Apps recomendadas:</p>
                    <ul className="list-disc list-inside space-y-1 text-blue-700">
                      <li>Google Authenticator</li>
                      <li>Authy</li>
                      <li>Microsoft Authenticator</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Código de verificación (6 dígitos)
                </label>
                <input
                  type="text"
                  maxLength="6"
                  value={verificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setVerificationCode(value);
                    setError('');
                  }}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500" />
                  <span className="text-sm text-red-700">{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Volver
                </button>
                <button
                  onClick={handleVerification}
                  disabled={verificationCode.length !== 6 || loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Verificando...' : 'Verificar'}
                </button>
              </div>
            </div>
          )}

          {/* Paso 3: Confirmación */}
          {step === 3 && (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  ¡2FA Configurado Exitosamente!
                </h4>
                <p className="text-sm text-gray-600">
                  Tu cuenta ahora tiene autenticación de dos factores activada.
                  Serás redirigido automáticamente.
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 justify-center text-green-800">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Cuenta protegida con 2FA
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TwoFactorSetup;