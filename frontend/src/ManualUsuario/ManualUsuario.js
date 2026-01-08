import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // 🆕 IMPORT AGREGADO
import './ManualUsuario.css';

const ManualUsuario = () => {
  const [seccionActiva, setSeccionActiva] = useState('introduccion');
  const navigate = useNavigate(); // 🆕 HOOK DE NAVEGACIÓN

  // 🆕 FUNCIÓN PARA VOLVER ATRÁS
  const handleVolver = () => {
    navigate(-1); // Vuelve a la página anterior
  };

  const secciones = [
    {
      id: 'introduccion',
      titulo: 'Introducción',
      icono: '📋'
    },
    {
      id: 'navegacion',
      titulo: 'Navegación',
      icono: '🧭'
    },
    {
      id: 'pacientes',
      titulo: 'Gestión de Pacientes',
      icono: '👥'
    },
    {
      id: 'citas',
      titulo: 'Agendar Citas',
      icono: '📅'
    },
    {
      id: 'calendario',
      titulo: 'Calendario',
      icono: '🗓️'
    },
    {
      id: 'historial',
      titulo: 'Historial Clínico',
      icono: '📋'
    },
    {
      id: 'reportes',
      titulo: 'Reportes',
      icono: '📊'
    },
    {
      id: 'configuracion',
      titulo: 'Configuración',
      icono: '⚙️'
    },
    {
      id: 'faq',
      titulo: 'Preguntas Frecuentes',
      icono: '❓'
    }
  ];

  const renderSeccion = () => {
    switch(seccionActiva) {
      case 'introduccion':
        return (
          <div className="seccion-content">
            <h2>🏥 Bienvenido al Sistema Odontológico</h2>
            <p>Este manual le ayudará a navegar y utilizar todas las funcionalidades del sistema de gestión odontológica de manera eficiente.</p>
            
            <div className="info-box">
              <h3>🎯 Funcionalidades Principales</h3>
              <ul>
                <li><strong>Gestión de Pacientes:</strong> Registrar, editar y consultar información de pacientes</li>
                <li><strong>Agendar Citas:</strong> Programar y gestionar citas médicas</li>
                <li><strong>Calendario Dinámico:</strong> Visualizar citas por día, semana y mes</li>
                <li><strong>Historial Clínico:</strong> Mantener registros detallados de tratamientos</li>
                <li><strong>Reportes:</strong> Generar estadísticas y reportes del consultorio</li>
              </ul>
            </div>

            <div className="warning-box">
              <h3>⚠️ Antes de Comenzar</h3>
              <p>Asegúrese de tener los permisos adecuados y una conexión estable a internet para usar todas las funcionalidades.</p>
            </div>
          </div>
        );

      case 'navegacion':
        return (
          <div className="seccion-content">
            <h2>🧭 Navegación del Sistema</h2>
            
            <div className="step-box">
              <h3>📍 Panel Principal</h3>
              <p>El panel principal es su centro de control donde puede:</p>
              <ul>
                <li>Ver las citas del día actual</li>
                <li>Acceder rápidamente a todas las secciones</li>
                <li>Visualizar el calendario mensual</li>
                <li>Agendar nuevas citas</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>🔝 Barra de Navegación</h3>
              <p>En la parte superior encontrará:</p>
              <ul>
                <li><strong>Logo y nombre:</strong> Odont-SISTEMA</li>
                <li><strong>Página actual:</strong> Muestra dónde se encuentra</li>
                <li><strong>Hora y fecha:</strong> Información en tiempo real</li>
                <li><strong>Notificaciones:</strong> Alertas importantes</li>
                <li><strong>Perfil de usuario:</strong> Configuración de cuenta</li>
              </ul>
            </div>

            <div className="tip-box">
              <h3>💡 Consejo</h3>
              <p>Use las tarjetas de acceso rápido en el panel principal para navegar más eficientemente entre las secciones.</p>
            </div>
          </div>
        );

      case 'pacientes':
        return (
          <div className="seccion-content">
            <h2>👥 Gestión de Pacientes</h2>
            
            <div className="step-box">
              <h3>➕ Registrar Nuevo Paciente</h3>
              <ol>
                <li>Haga clic en "Pacientes" desde el panel principal</li>
                <li>Seleccione "Agregar Nuevo Paciente"</li>
                <li>Complete todos los campos obligatorios:</li>
                <ul>
                  <li>Nombre completo</li>
                  <li>Fecha de nacimiento</li>
                  <li>Teléfono de contacto</li>
                  <li>Email (opcional)</li>
                  <li>Dirección</li>
                </ul>
                <li>Guarde la información</li>
              </ol>
            </div>

            <div className="step-box">
              <h3>🔍 Buscar Pacientes</h3>
              <p>Para encontrar un paciente existente:</p>
              <ul>
                <li>Use la barra de búsqueda por nombre</li>
                <li>Filtre por fecha de registro</li>
                <li>Busque por número de teléfono</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>✏️ Editar Información</h3>
              <ol>
                <li>Localice el paciente deseado</li>
                <li>Haga clic en el botón "Editar"</li>
                <li>Modifique los campos necesarios</li>
                <li>Guarde los cambios</li>
              </ol>
            </div>

            <div className="warning-box">
              <h3>⚠️ Importante</h3>
              <p>Los datos de los pacientes son confidenciales. Asegúrese de mantener la privacidad y solo acceder a la información necesaria.</p>
            </div>
          </div>
        );

      case 'citas':
        return (
          <div className="seccion-content">
            <h2>📅 Agendar Citas</h2>
            
            <div className="step-box">
              <h3>🆕 Nueva Cita</h3>
              <ol>
                <li>Haga clic en "Agendar Cita" (botón verde)</li>
                <li>Se abrirá el panel lateral derecho</li>
                <li>Busque o seleccione el paciente:</li>
                <ul>
                  <li>Escriba el nombre para buscar</li>
                  <li>Seleccione de la lista</li>
                  <li>O registre un paciente temporal</li>
                </ul>
                <li>Complete los detalles:</li>
                <ul>
                  <li>Fecha de la cita</li>
                  <li>Hora disponible</li>
                  <li>Tipo de consulta</li>
                  <li>Observaciones (opcional)</li>
                </ul>
                <li>Confirme la cita</li>
              </ol>
            </div>

            <div className="step-box">
              <h3>📋 Tipos de Cita</h3>
              <ul>
                <li><strong>Consulta General:</strong> Revisión rutinaria</li>
                <li><strong>Limpieza:</strong> Profilaxis dental</li>
                <li><strong>Tratamiento:</strong> Procedimientos específicos</li>
                <li><strong>Emergencia:</strong> Atención urgente</li>
                <li><strong>Control:</strong> Seguimiento post-tratamiento</li>
              </ul>
            </div>

            <div className="tip-box">
              <h3>💡 Consejos</h3>
              <ul>
                <li>Revise la disponibilidad en el calendario antes de agendar</li>
                <li>Confirme los datos del paciente antes de guardar</li>
                <li>Use observaciones para notas importantes</li>
              </ul>
            </div>
          </div>
        );

      case 'calendario':
        return (
          <div className="seccion-content">
            <h2>🗓️ Calendario</h2>
            
            <div className="step-box">
              <h3>📊 Visualización</h3>
              <p>El calendario muestra diferentes estados:</p>
              <div className="calendar-legend">
                <div className="legend-item">
                  <div className="color-sample" style={{backgroundColor: '#10D9C4'}}></div>
                  <span>Día libre - Disponible para citas</span>
                </div>
                <div className="legend-item">
                  <div className="color-sample" style={{backgroundColor: '#0EA5E9'}}></div>
                  <span>Día medio - Algunas citas programadas</span>
                </div>
                <div className="legend-item">
                  <div className="color-sample" style={{backgroundColor: '#6B7280'}}></div>
                  <span>Día ocupado - Muchas citas</span>
                </div>
                <div className="legend-item">
                  <div className="color-sample" style={{backgroundColor: '#1F2937'}}></div>
                  <span>Día completo - Sin disponibilidad</span>
                </div>
              </div>
            </div>

            <div className="step-box">
              <h3>🔄 Navegación</h3>
              <ul>
                <li><strong>Botones de mes:</strong> Use ← → para cambiar mes</li>
                <li><strong>Botón "Hoy":</strong> Regresa al día actual</li>
                <li><strong>Año:</strong> Cambie el año usando los controles</li>
                <li><strong>Días con citas:</strong> Muestran un número indicando cantidad</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>👆 Interacción</h3>
              <ul>
                <li>Haga clic en cualquier día para ver citas de ese día</li>
                <li>El día actual aparece resaltado</li>
                <li>Los días pasados tienen menor opacidad</li>
              </ul>
            </div>
          </div>
        );

      case 'historial':
        return (
          <div className="seccion-content">
            <h2>📋 Historial Clínico</h2>
            
            <div className="step-box">
              <h3>📝 Crear Entrada</h3>
              <ol>
                <li>Seleccione el paciente</li>
                <li>Vaya a "Historial Clínico"</li>
                <li>Haga clic en "Nueva Entrada"</li>
                <li>Complete la información:</li>
                <ul>
                  <li>Fecha de la consulta</li>
                  <li>Diagnóstico</li>
                  <li>Tratamiento realizado</li>
                  <li>Observaciones</li>
                  <li>Próxima cita (si aplica)</li>
                </ul>
                <li>Guarde el registro</li>
              </ol>
            </div>

            <div className="step-box">
              <h3>🔍 Consultar Historial</h3>
              <ul>
                <li>Busque por nombre del paciente</li>
                <li>Filtre por fecha de consulta</li>
                <li>Ordene por tratamiento o diagnóstico</li>
                <li>Exporte registros para referencia</li>
              </ul>
            </div>

            <div className="tip-box">
              <h3>💡 Buenas Prácticas</h3>
              <ul>
                <li>Registre información inmediatamente después de cada consulta</li>
                <li>Sea específico en diagnósticos y tratamientos</li>
                <li>Incluya recomendaciones para el paciente</li>
                <li>Revise historial antes de cada cita</li>
              </ul>
            </div>
          </div>
        );

      case 'reportes':
        return (
          <div className="seccion-content">
            <h2>📊 Reportes</h2>
            
            <div className="step-box">
              <h3>📈 Tipos de Reportes</h3>
              <ul>
                <li><strong>Citas por período:</strong> Estadísticas de citas diarias/mensuales</li>
                <li><strong>Ingresos:</strong> Reportes financieros</li>
                <li><strong>Pacientes nuevos:</strong> Crecimiento de la base de pacientes</li>
                <li><strong>Tratamientos:</strong> Tipos de tratamientos más comunes</li>
                <li><strong>Ocupación:</strong> Porcentaje de ocupación del consultorio</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>🎯 Generar Reporte</h3>
              <ol>
                <li>Seleccione el tipo de reporte</li>
                <li>Establezca el período de tiempo</li>
                <li>Configure filtros adicionales</li>
                <li>Haga clic en "Generar"</li>
                <li>Visualice o descargue el reporte</li>
              </ol>
            </div>

            <div className="tip-box">
              <h3>💡 Recomendaciones</h3>
              <ul>
                <li>Genere reportes mensualmente para seguimiento</li>
                <li>Use filtros para análisis específicos</li>
                <li>Exporte datos para análisis externos</li>
                <li>Compare períodos para identificar tendencias</li>
              </ul>
            </div>
          </div>
        );

      case 'configuracion':
        return (
          <div className="seccion-content">
            <h2>⚙️ Configuración</h2>
            
            <div className="step-box">
              <h3>👤 Perfil de Usuario</h3>
              <ul>
                <li>Cambiar información personal</li>
                <li>Actualizar contraseña</li>
                <li>Configurar notificaciones</li>
                <li>Preferencias de idioma</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>🏥 Configuración del Consultorio</h3>
              <ul>
                <li>Información de la clínica</li>
                <li>Horarios de atención</li>
                <li>Tipos de consulta disponibles</li>
                <li>Precios de servicios</li>
              </ul>
            </div>

            <div className="step-box">
              <h3>🔔 Notificaciones</h3>
              <ul>
                <li>Recordatorios de citas</li>
                <li>Alertas de pacientes nuevos</li>
                <li>Notificaciones de cancelaciones</li>
                <li>Reportes automáticos</li>
              </ul>
            </div>

            <div className="warning-box">
              <h3>🔒 Seguridad</h3>
              <p>Mantenga su contraseña segura y cierre sesión al terminar de usar el sistema.</p>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="seccion-content">
            <h2>❓ Preguntas Frecuentes</h2>
            
            <div className="faq-item">
              <h3>¿Cómo recupero mi contraseña?</h3>
              <p>Contacte al administrador del sistema o use la opción "Olvidé mi contraseña" en la pantalla de inicio de sesión.</p>
            </div>

            <div className="faq-item">
              <h3>¿Puedo cancelar una cita agendada?</h3>
              <p>Sí, desde el calendario haga clic en la cita y seleccione "Cancelar". También puede cambiar el estado de la cita.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo agrego un nuevo tipo de tratamiento?</h3>
              <p>Vaya a Configuración Tipos de Consulta y agregue las opciones que necesite.</p>
            </div>

            <div className="faq-item">
              <h3>¿Los datos están respaldados?</h3>
              <p>Sí, el sistema realiza respaldos automáticos diarios. Para respaldos adicionales, contacte al soporte técnico.</p>
            </div>

            <div className="faq-item">
              <h3>¿Puedo acceder desde mi teléfono?</h3>
              <p>Sí, el sistema es responsivo y se adapta a dispositivos móviles y tablets.</p>
            </div>

            <div className="faq-item">
              <h3>¿Cómo contacto al soporte técnico?</h3>
              <p>Puede contactar al soporte a través de:</p>
              <ul>
                <li>Email: soporte@odont-sistema.com</li>
                <li>Teléfono: +52 (555) 123-4567</li>
                <li>WhatsApp: +52 (555) 123-4567</li>
              </ul>
            </div>
          </div>
        );

      default:
        return <div>Sección no encontrada</div>;
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f8fafc',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1F2937 0%, #6B7280 100%)',
        color: 'white',
        padding: '20px 0',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span style={{ fontSize: '32px' }}>🦷</span>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800' }}>
                Manual de Usuario
              </h1>
              <p style={{ margin: 0, opacity: 0.8, fontSize: '14px' }}>
                Sistema Odontológico - Guía Completa
              </p>
            </div>
          </div>
          
          {/* 🆕 BOTÓN CORREGIDO QUE NAVEGA DE VUELTA */}
          <button
            onClick={handleVolver}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.2)';
              e.target.style.transform = 'translateY(-1px)';
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            <span>←</span>
            <span>Volver</span>
          </button>
        </div>
      </header>

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '300px 1fr',
        gap: '30px',
        padding: '30px 20px'
      }}>
        {/* Sidebar */}
        <nav style={{
          background: 'white',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          height: 'fit-content',
          position: 'sticky',
          top: '20px'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            fontSize: '16px',
            fontWeight: '700',
            color: '#1F2937',
            borderBottom: '2px solid #10D9C4',
            paddingBottom: '10px'
          }}>
            📚 Contenido
          </h3>
          
          {secciones.map((seccion) => (
            <button
              key={seccion.id}
              onClick={() => setSeccionActiva(seccion.id)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 15px',
                margin: '5px 0',
                border: 'none',
                borderRadius: '8px',
                background: seccionActiva === seccion.id 
                  ? 'linear-gradient(135deg, #10D9C4 0%, #0EA5E9 100%)' 
                  : 'transparent',
                color: seccionActiva === seccion.id ? 'white' : '#4B5563',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if (seccionActiva !== seccion.id) {
                  e.target.style.background = '#f3f4f6';
                  e.target.style.color = '#1F2937';
                }
              }}
              onMouseOut={(e) => {
                if (seccionActiva !== seccion.id) {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#4B5563';
                }
              }}
            >
              <span>{seccion.icono}</span>
              {seccion.titulo}
            </button>
          ))}
        </nav>

        {/* Content */}
        <main style={{
          background: 'white',
          borderRadius: '12px',
          padding: '40px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          minHeight: '600px'
        }}>
          {renderSeccion()}
        </main>
      </div>
    </div>
  );
};

export default ManualUsuario;