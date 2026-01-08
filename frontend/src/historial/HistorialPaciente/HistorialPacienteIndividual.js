import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { buildApiUrl } from '../../config/config.js';
import { useAuth } from '../../services/AuthContext.js';
import '../../css/HistorialPacienteIndividual.css';

// Componentes
import RadiografiasSection from './RadiografiasSection.js';
import CitasHistorialSection from './CitasHistorialSection.js';
import ConsultaActual from './ConsultaActual.js';
import EstudiosLaboratorioSection from './EstudiosLaboratorioSection';

// ✅ CORRECCIÓN 1: Importación con el nombre correcto
import HistorialVisualizacionCompleta from '../../components/HistorialVisualizacionCompleta'; 

import DentalLoading from '../../components/DentalLoading';
import { cargarHistorialPaciente, generarPDFHistorial, guardarPDFLocal } from '../../services/historialService';

const HistorialPacienteIndividual = () => {
  const { pacienteId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const [paciente, setPaciente] = useState(location.state?.paciente || null);
  const [loading, setLoading] = useState(true);
  const [vistaActiva, setVistaActiva] = useState('resumen');
  
  // ESTADOS DE DATOS
  const [dataRadiografias, setDataRadiografias] = useState([]);
  const [dataEstudios, setDataEstudios] = useState([]);
  const [dataCitas, setDataCitas] = useState([]);
  const [dataHistorial, setDataHistorial] = useState(null); 

  // --- CARGA DE DATOS SINCRONIZADA CON DB ---
  const fetchData = useCallback(async () => {
    try {
      const headers = { 'Authorization': `Bearer ${localStorage.getItem('token')}` };
      
      // 1. Cargar Paciente
      if (!paciente) {
        const res = await fetch(buildApiUrl(`/pacientes/${pacienteId}`), { headers });
        if (res.ok) setPaciente(await res.json());
      }

      // 2. Cargar Todo en Paralelo
      const [resRadio, resEstudios, resCitas, historialResponse] = await Promise.all([
        fetch(buildApiUrl(`/radiografias/paciente/${pacienteId}`), { headers }),
        fetch(buildApiUrl(`/estudios-laboratorio/paciente/${pacienteId}`), { headers }),
        fetch(buildApiUrl(`/citas?paciente_id=${pacienteId}`), { headers }),
        cargarHistorialPaciente(pacienteId)
      ]);

      // 3. Procesar Listas
      const radios = resRadio.ok ? await resRadio.json() : [];
      const estudiosData = resEstudios.ok ? await resEstudios.json() : {};
      const estudios = Array.isArray(estudiosData.data) ? estudiosData.data : (Array.isArray(estudiosData) ? estudiosData : []);
      const citasData = resCitas.ok ? await resCitas.json() : {};
      const citas = Array.isArray(citasData.data) ? citasData.data : (Array.isArray(citasData) ? citasData : []);

      setDataRadiografias(Array.isArray(radios) ? radios : []);
      setDataEstudios(estudios);
      setDataCitas(citas);
      
      // 4. PROCESAMIENTO DEL HISTORIAL (DB -> FRONTEND)
      let rawHistorial = null;

      if (Array.isArray(historialResponse) && historialResponse.length > 0) {
        rawHistorial = historialResponse[0];
      } else if (historialResponse && (historialResponse.id || historialResponse.paciente_id)) {
        rawHistorial = historialResponse;
      }

      if (rawHistorial) {
        // Función helper para parsear JSON si viene como string
        const parse = (val) => {
          if (typeof val === 'string') {
            try { return JSON.parse(val); } catch (e) { return {}; }
          }
          return val || {};
        };

        // ✅ MAPEO EXACTO SEGÚN TU TABLA 'historial_clinico'
        const historialMapeado = {
          id: rawHistorial.id,
          // DB: motivo_consulta -> Frontend: motivoConsulta
          motivoConsulta: parse(rawHistorial.motivo_consulta),
          
          // DB: antecedentes_heredo_familiares -> Frontend: antecedentesHeredoFamiliares
          antecedentesHeredoFamiliares: parse(rawHistorial.antecedentes_heredo_familiares),
          
          // DB: antecedentes_personales_no_patologicos -> Frontend: antecedentesPersonalesNoPatologicos
          antecedentesPersonalesNoPatologicos: parse(rawHistorial.antecedentes_personales_no_patologicos),
          
          // DB: antecedentes_personales_patologicos -> Frontend: antecedentesPersonalesPatologicos
          antecedentesPersonalesPatologicos: parse(rawHistorial.antecedentes_personales_patologicos),
          
          // DB: examen_extrabucal -> Frontend: examenExtrabucal
          examenExtrabucal: parse(rawHistorial.examen_extrabucal),
          
          // DB: examen_intrabucal -> Frontend: examenIntrabucal
          examenIntrabucal: parse(rawHistorial.examen_intrabucal),
          
          // DB: oclusion -> Frontend: oclusion
          oclusion: parse(rawHistorial.oclusion),
          
          // DB: ficha_identificacion -> Frontend: fichaIdentificacion
          fichaIdentificacion: parse(rawHistorial.ficha_identificacion),
          
          // Datos extra planos
          diagnostico: rawHistorial.diagnostico,
          tratamiento: rawHistorial.tratamiento,
          fechaConsulta: rawHistorial.fecha_consulta
        };

        console.log("✅ Historial Sincronizado con DB:", historialMapeado);
        setDataHistorial(historialMapeado);
      } else {
        setDataHistorial(null);
      }

    } catch (error) {
      console.error("❌ Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, [pacienteId, paciente]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatearFecha = (fecha) => {
    if (!fecha) return '---';
    return new Date(fecha).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleDescargarPDF = async () => {
    if (!dataHistorial) return;
    try {
        const blob = await generarPDFHistorial(dataHistorial);
        const nombreArchivo = `Historial_${paciente.nombre}_${paciente.apellido_paterno}.pdf`;
        guardarPDFLocal(blob, nombreArchivo);
    } catch (error) {
        alert('Error al generar el PDF: ' + error.message);
    }
  };

  // --- RENDERIZADO ---
  const renderContent = () => {
    const propsComunes = {
      pacienteId, paciente, buildApiUrl,
      getAuthHeaders: () => ({ 'Authorization': `Bearer ${localStorage.getItem('token')}` }),
      formatearFecha,
      onRecargar: fetchData
    };

    switch (vistaActiva) {
      case 'resumen':
        return (
          <ResumenView 
            paciente={paciente}
            citas={dataCitas}
            radiografias={dataRadiografias}
            estudios={dataEstudios}
            historial={dataHistorial} 
            cambiarVista={setVistaActiva}
            navigate={navigate}
            pacienteId={pacienteId}
            onDescargarPDF={handleDescargarPDF}
          />
        );
      
      case 'vista_completa':
        return (
          <div className="seccion-completa">
             <div className="seccion-header">
                <h2>📋 Expediente Clínico Completo</h2>
                <div style={{display:'flex', gap:'10px'}}>
                  <button className="btn-secundario" onClick={handleDescargarPDF}>⬇️ Descargar PDF</button>
                  <button className="btn-primario" onClick={() => navigate(`/historial-clinico/${pacienteId}`)}>✏️ Editar</button>
                </div>
             </div>
             {/* ✅ CORRECCIÓN 2: Uso del componente con el nombre correcto importado */}
             <HistorialVisualizacionCompleta datos={dataHistorial} paciente={paciente} />
          </div>
        );

      case 'radiografias': 
        return <RadiografiasSection {...propsComunes} radiografias={dataRadiografias} loadingRadiografias={loading} onSolicitarNueva={() => {}} />;
      case 'estudios': 
        return <EstudiosLaboratorioSection {...propsComunes} estudiosLaboratorio={dataEstudios} loadingEstudios={loading} onSolicitarNuevo={() => {}} />;
      case 'citas': 
        return <CitasHistorialSection {...propsComunes} citas={dataCitas} loadingCitas={loading} formatearFechaHora={formatearFecha} />;
      case 'consulta': 
        return <ConsultaActual {...propsComunes} user={user} onConsultaFinalizada={fetchData} />;
      default: return null;
    }
  };

  if (loading && !paciente) return <DentalLoading isLoading={true} message="Cargando expediente..." />;

  return (
    <div className="historial-container">
      {/* HEADER PACIENTE */}
      {paciente && (
        <div className="header-paciente-minimalista">
          <button onClick={() => navigate('/pacientes')} className="btn-regresar-minimalista">← Regresar</button>
          <div className="header-minimalista-content">
            <div className="avatar-container">
              <div className="avatar-paciente">{paciente.nombre?.charAt(0).toUpperCase()}</div>
              <div className="avatar-estado-online"></div>
            </div>
            <div className="info-paciente-minimalista">
              <h1 className="nombre-paciente-principal">{paciente.nombre} {paciente.apellido_paterno}</h1>
              <div className="detalles-paciente-grid-expandido">
                <DetalleItem icon="🎂" label="Edad" value={`${paciente.edad || 'N/A'} años`} />
                <DetalleItem icon="👤" label="Sexo" value={paciente.sexo} />
                <DetalleItem icon="📞" label="Teléfono" value={paciente.telefono} />
                <DetalleItem icon="🆔" label="Matrícula" value={paciente.matricula || 'N/A'} />
              </div>
            </div>
            <div className="estadisticas-paciente">
              <StatCard num={dataHistorial ? 1 : 0} label="HISTORIAL" />
              <StatCard num={dataRadiografias.length} label="RADIOGRAFÍAS" />
              <StatCard num={dataEstudios.length} label="ESTUDIOS" />
              <StatCard num={dataCitas.length} label="CITAS" />
            </div>
          </div>
        </div>
      )}

      {/* MENÚ DE NAVEGACIÓN */}
      <div className="navegacion-principal">
        <NavButton active={vistaActiva === 'resumen'} onClick={() => setVistaActiva('resumen')} icon="📋" label="Resumen" />
        
        {dataHistorial && (
           <NavButton active={vistaActiva === 'vista_completa'} onClick={() => setVistaActiva('vista_completa')} icon="📑" label="Expediente Completo" />
        )}

        <NavButton active={vistaActiva === 'consulta'} onClick={() => setVistaActiva('consulta')} icon="🩺" label="Consulta" />
        <NavButton active={vistaActiva === 'citas'} onClick={() => setVistaActiva('citas')} icon="📅" label="Citas" count={dataCitas.length} />
        <NavButton active={vistaActiva === 'radiografias'} onClick={() => setVistaActiva('radiografias')} icon="📸" label="Radiografías" count={dataRadiografias.length} />
        <NavButton active={vistaActiva === 'estudios'} onClick={() => setVistaActiva('estudios')} icon="🔬" label="Estudios" count={dataEstudios.length} />
      </div>

      <div className="contenido-principal">
        {renderContent()}
      </div>
    </div>
  );
};

// === COMPONENTE RESUMEN VIEW ===
const ResumenView = ({ paciente, citas, radiografias, estudios, historial, cambiarVista, navigate, pacienteId, onDescargarPDF }) => {
  const ultimaCita = citas[0] || null;
  
  return (
    <div className="resumen-dashboard">
      
      <div className="seccion-completa" style={{textAlign: 'center', padding: '40px', background: '#e3f2fd', border: '1px solid #90caf9'}}>
        
        {historial ? (
          <>
            <h2 style={{color: '#1565c0'}}>✅ Expediente Clínico Activo</h2>
            <p style={{color: '#546e7a', marginBottom: '20px'}}>Este paciente tiene un historial clínico registrado.</p>
            <div style={{display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap'}}>
              <button 
                className="btn-primario" 
                onClick={() => cambiarVista('vista_completa')} 
              >
                👁️ Ver Historial Completo
              </button>

              <button 
                className="btn-secundario" 
                onClick={() => navigate(`/historial-clinico/${pacienteId}`)} 
              >
                ✏️ Editar Datos
              </button>
              
              <button 
                className="btn-secundario" 
                style={{background: 'white', color: '#d32f2f', borderColor: '#d32f2f'}}
                onClick={onDescargarPDF}
              >
                ⬇️ Descargar PDF
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{color: '#e65100'}}>⚠️ Expediente Incompleto</h2>
            <p style={{color: '#546e7a', marginBottom: '20px'}}>Este paciente aún no tiene un historial clínico registrado.</p>
            <button 
              className="btn-primario" 
              style={{background: 'linear-gradient(135deg, #ff9800, #f57c00)', padding: '15px 30px', fontSize: '16px'}}
              onClick={() => navigate(`/historial-clinico/${pacienteId}`)}
            >
              📝 Iniciar Historial Clínico
            </button>
          </>
        )}
      </div>

      <div className="resumen-grid" style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '20px'}}>
        <div className="seccion-completa" style={{margin: 0}}>
          <h3>🩺 Consulta Rápida</h3>
          <p>Inicia una nueva nota de evolución.</p>
          <button className="btn-primario" onClick={() => cambiarVista('consulta')}>Iniciar Consulta</button>
        </div>
        <div className="seccion-completa" style={{margin: 0}}>
          <h3>📅 Última Cita</h3>
          {ultimaCita ? (
            <div>
              <p><strong>Fecha:</strong> {new Date(ultimaCita.fecha_cita).toLocaleDateString()}</p>
              <p><strong>Estado:</strong> {ultimaCita.estado}</p>
            </div>
          ) : <p>No hay citas recientes.</p>}
        </div>
      </div>
    </div>
  );
};

const DetalleItem = ({ icon, label, value }) => (
  <div className="detalle-item-minimalista">
    <span className="detalle-icono">{icon}</span>
    <div className="detalle-contenido">
      <span className="detalle-label">{label}</span>
      <span className="detalle-valor">{value}</span>
    </div>
  </div>
);

const StatCard = ({ num, label }) => (
  <div className="estadistica-card">
    <span className="estadistica-numero">{num}</span>
    <span className="estadistica-label">{label}</span>
  </div>
);

const NavButton = ({ active, onClick, icon, label, count }) => (
  <button className={`nav-tab ${active ? 'activo' : ''}`} onClick={onClick} data-count={count > 0 ? count : null}>
    <span>{icon}</span> {label}
  </button>
);

export default HistorialPacienteIndividual;