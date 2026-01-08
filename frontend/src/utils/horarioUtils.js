// src/utils/horarioUtils.js
export const verificarHorarioAcceso = () => {
  const ahora = new Date();
  const horaActual = ahora.getHours();
  const minutoActual = ahora.getMinutes();
  
  const minutosTotales = horaActual * 60 + minutoActual;
  const inicioBloqueo = 0; // 00:00
  const finBloqueo = 8 * 60; // 08:00
  
  const bloqueado = minutosTotales >= inicioBloqueo && minutosTotales < finBloqueo;
  
  return {
    bloqueado,
    horaActual: `${horaActual.toString().padStart(2, '0')}:${minutoActual.toString().padStart(2, '0')}`,
    proximaApertura: '08:00'
  };
};

export const esAdministrador = () => {
  try {
    const userData = JSON.parse(localStorage.getItem('userData') || '{}');
    return userData.rol === 'Administrador' || userData.tipo_usuario === 'Administrador';
  } catch {
    return false;
  }
};