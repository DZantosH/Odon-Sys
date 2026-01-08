import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { buildApiUrl } from '../config/config.js';
import './HistorialClinico.css';

// Importaciones de secciones externas
import FichaIdentificacion from './secciones/FichaIdentificación';
import MotivoConsulta from './secciones/MotivoConsulta';
import AntecedentesHeredoFamiliares from './secciones/AntecedentesHeredoFamiliares';
import AntecedentesPersonalesNoPatologicos from './secciones/AntecedentesPersonalesNoPatologicos';
import AntecedentesPersonalesPatologicos from './secciones/AntecedentesPersonalesPatologicos';
import ExamenBucal from './secciones/ExamenBucal';
import ExamenIntrabucal from './secciones/ExamenIntrabucal';
import SeccionesOclusion from './secciones/SeccionesOclusion'; 

// Importar validaciones
import { validarSeccion } from './validaciones';

// Importaciones para guardado y carga
import { 
  guardarHistorialEnBaseDatos,
  generarPDFHistorial,
  guardarPDFLocal,
  guardarVersionDigital,
  cargarHistorialPaciente // ✅ IMPORTANTE: Función para cargar datos
} from '../services/historialService';

import { alerta, confirmar, mostrarErroresValidacion } from '../utils/ModalUtils';

const formatearFechaParaInput = (fecha) => {
  if (!fecha) return '';
  if (fecha.includes('-') && fecha.length === 10) return fecha;
  try { return new Date(fecha).toISOString().split('T')[0]; } 
  catch (e) { return ''; }
};

const HistorialClinico = () => {
  const { pacienteId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Estados
  const [seccionActiva, setSeccionActiva] = useState(1);
  const [datosFormulario, setDatosFormulario] = useState({});
  const [errores, setErrores] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [historialId, setHistorialId] = useState(null);
  const [seccionesValidadas, setSeccionesValidadas] = useState(new Set());
  
  // Estados de progreso visual
  const [progreso, setProgreso] = useState({
    baseDatos: false, pdfGenerado: false, pdfGuardado: false, versionDigital: false
  });
  
  const carruselRef = useRef(null);

  const secciones = [
    { id: 1, titulo: 'Ficha Identificación' },
    { id: 2, titulo: 'Motivo Consulta' },
    { id: 3, titulo: 'Ant. Heredo-Familiares' },
    { id: 4, titulo: 'Ant. Pers. No Patológicos' },
    { id: 5, titulo: 'Ant. Pers. Patológicos' },
    { id: 6, titulo: 'Examen Extrabucal' },
    { id: 7, titulo: 'Examen Intrabucal' },
    { id: 8, titulo: 'Oclusión' }
  ];

  // --- CARGA DE DATOS INICIAL ---
  useEffect(() => {
    const inicializar = async () => {
      try {
        console.log(`📥 Cargando datos para paciente ID: ${pacienteId}`);
        
        // 1. INTENTAR CARGAR HISTORIAL EXISTENTE DE LA DB
        const historialExistente = await cargarHistorialPaciente(pacienteId);
        
        let datosCargados = {};
        let historialEncontrado = null;

        // Detectar si vino un array o un objeto
        if (Array.isArray(historialExistente) && historialExistente.length > 0) {
          historialEncontrado = historialExistente[0]; // Tomar el más reciente
        } else if (historialExistente && historialExistente.id) {
          historialEncontrado = historialExistente;
        }

        if (historialEncontrado) {
          console.log("✅ Historial encontrado en DB, rellenando formulario...");
          setHistorialId(historialEncontrado.id);

          // Helper para parsear JSON si viene como string
          const parse = (val) => {
            if (!val) return {};
            if (typeof val === 'string') {
              try { return JSON.parse(val); } catch (e) { return {}; }
            }
            return val;
          };

          // Extraer y parsear cada columna de la BD
          const ficha = parse(historialEncontrado.datos_personales || historialEncontrado.ficha_identificacion);
          const motivo = parse(historialEncontrado.motivo_consulta);
          const heredo = parse(historialEncontrado.antecedentes_heredo_familiares);
          const noPatol = parse(historialEncontrado.antecedentes_personales_no_patologicos);
          const patol = parse(historialEncontrado.antecedentes_personales_patologicos);
          const extra = parse(historialEncontrado.examen_extrabucal);
          const intra = parse(historialEncontrado.examen_intrabucal);
          const oclusion = parse(historialEncontrado.oclusion);

          // MAPEO DB -> ESTADO DEL FORMULARIO
          datosCargados = {
            // Ficha de Identificación
            nombre: ficha.nombre || ficha.nombre_completo?.split(' ')[0] || '',
            apellidoPaterno: ficha.apellidoPaterno || ficha.nombre_completo?.split(' ')[1] || '',
            apellidoMaterno: ficha.apellidoMaterno || '',
            sexo: ficha.sexo || '',
            fechaNacimiento: formatearFechaParaInput(ficha.fechaNacimiento || ficha.fecha_nacimiento),
            telefono: ficha.telefono || '',
            email: ficha.email || ficha.correo_electronico || '',
            rfc: ficha.rfc || '',

            // Motivo Consulta
            motivo: motivo.motivo || motivo.descripcion || '',
            escalaDolor: motivo.escalaDolor || (motivo.dolor ? 5 : 0),
            nivelUrgencia: motivo.nivelUrgencia || motivo.urgencia || 'normal',
            duracionSintomas: motivo.duracionSintomas || motivo.duracion || '',
            tratamientoPrevio: motivo.tratamientoPrevio || '',

            // Antecedentes
            antecedentes: heredo.antecedentes || [],
            enfermedades_relevantes: heredo.enfermedades_relevantes || {},

            // No Patológicos
            servicios_publicos: noPatol.servicios_publicos || {},
            higiene: noPatol.higiene || {},
            alimentarios: noPatol.alimentarios || {},
            habitos_perniciosos: noPatol.habitos_perniciosos || {},

            // Patológicos
            padecimientos: patol.padecimientos || [],
            somatometria: patol.somatometria || {},
            signos_vitales: patol.signos_vitales || {},

            // Exámenes
            cabeza: extra.cabeza || {},
            atm: extra.atm || {},
            musculos_cuello: extra.musculos_cuello || {},
            
            estructuras: intra.estructuras || {},
            higiene_bucal: intra.higiene_bucal || {},
            encias: intra.encias || {},
            hallazgos_adicionales: intra.hallazgos_adicionales || '',

            // Oclusión (Completo)
            oclusion: oclusion || {},
            odontograma: oclusion.odontograma || {},
            armonia_maxilares: oclusion.armonia_maxilares || {},
            simetria_arco: oclusion.simetria_arco || {},
            clasificacion_angle: oclusion.clasificacion_angle || {},
            examen_higiene_oral: oclusion.examen_higiene_oral || {},
            periodontograma: oclusion.periodontograma || {},
            modelos_estudio: oclusion.modelos_estudio || {}
          };

          // Marcar secciones como validadas si tienen datos
          const seccionesLlenas = new Set();
          if (datosCargados.nombre) seccionesLlenas.add(1); // Ficha
          if (datosCargados.motivo) seccionesLlenas.add(2); // Motivo
          if (datosCargados.antecedentes?.length > 0) seccionesLlenas.add(3);
          // ... lógica simple para marcar como validados pasos anteriores
          setSeccionesValidadas(seccionesLlenas);

        } else {
          // 2. SI NO HAY HISTORIAL, CARGAR DATOS BÁSICOS DEL PACIENTE
          console.log("⚠️ No hay historial, cargando datos básicos...");
          
          let datosPaciente = location.state?.paciente;
          
          // Si no vinieron por navegación, buscarlos
          if (!datosPaciente) {
            const res = await fetch(buildApiUrl(`/pacientes/${pacienteId}`), {
               headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) datosPaciente = await res.json();
          }

          if (datosPaciente) {
            datosCargados = {
              nombre: datosPaciente.nombre || '',
              apellidoPaterno: datosPaciente.apellido_paterno || '',
              apellidoMaterno: datosPaciente.apellido_materno || '',
              sexo: datosPaciente.sexo === 'M' ? 'Masculino' : datosPaciente.sexo === 'F' ? 'Femenino' : '',
              fechaNacimiento: formatearFechaParaInput(datosPaciente.fecha_nacimiento),
              telefono: datosPaciente.telefono || '',
              email: datosPaciente.correo_electronico || '',
              rfc: datosPaciente.rfc || ''
            };
          }
        }

        setDatosFormulario(prev => ({ ...prev, ...datosCargados }));

      } catch (error) {
        console.error("❌ Error inicializando historial:", error);
      }
    };

    if (pacienteId) {
      inicializar();
    }
  }, [pacienteId, location.state]);

  // Manejo de cambios en formulario
  const handleInputChange = (campo, valor) => {
    setDatosFormulario(prev => ({ ...prev, [campo]: valor }));
  };

  // Validaciones y navegación
  const validarSeccionActual = () => {
    const validacion = validarSeccion(seccionActiva, datosFormulario);
    setErrores(validacion.errores);
    if (!validacion.esValido) mostrarErroresValidacion(validacion.errores);
    if (validacion.esValido) setSeccionesValidadas(prev => new Set([...prev, seccionActiva]));
    return validacion.esValido;
  };

  const siguienteSeccion = () => {
    if (validarSeccionActual() && seccionActiva < secciones.length) {
      setSeccionActiva(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const anteriorSeccion = () => {
    if (seccionActiva > 1) {
      setSeccionActiva(prev => prev - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Helpers de extracción de datos para guardado
  const extractFichaData = () => ({
    nombre: datosFormulario.nombre,
    apellidoPaterno: datosFormulario.apellidoPaterno,
    apellidoMaterno: datosFormulario.apellidoMaterno,
    sexo: datosFormulario.sexo,
    fechaNacimiento: datosFormulario.fechaNacimiento,
    rfc: datosFormulario.rfc,
    telefono: datosFormulario.telefono,
    email: datosFormulario.email
  });

  // Guardado Final
  const finalizarHistorial = async () => {
    if (!validarSeccionActual()) return;
    setGenerandoPDF(true);
    
    try {
      // Objeto completo para guardar
      const historialCompleto = {
        pacienteId: pacienteId,
        fechaCreacion: new Date().toISOString(),
        estado: 'completado',
        version: '1.0',
        datos: {
          // Guardamos con la estructura que espera la DB (snake_case si es necesario o directa)
          fichaIdentificacion: extractFichaData(),
          motivoConsulta: {
             motivo: datosFormulario.motivo,
             urgencia: datosFormulario.nivelUrgencia,
             duracion: datosFormulario.duracionSintomas
          },
          antecedentesHeredoFamiliares: {
             antecedentes: datosFormulario.antecedentes,
             enfermedades_relevantes: datosFormulario.enfermedades_relevantes
          },
          antecedentesPersonalesNoPatologicos: {
             servicios_publicos: datosFormulario.servicios_publicos,
             higiene: datosFormulario.higiene,
             habitos_perniciosos: datosFormulario.habitos_perniciosos
          },
          antecedentesPersonalesPatologicos: {
             padecimientos: datosFormulario.padecimientos,
             signos_vitales: datosFormulario.signos_vitales
          },
          examenExtrabucal: {
             cabeza: datosFormulario.cabeza,
             atm: datosFormulario.atm
          },
          examenIntrabucal: {
             estructuras: datosFormulario.estructuras,
             encias: datosFormulario.encias,
             hallazgos_adicionales: datosFormulario.hallazgos_adicionales
          },
          oclusion: {
             odontograma: datosFormulario.odontograma,
             clasificacion_angle: datosFormulario.clasificacion_angle,
             periodontograma: datosFormulario.periodontograma
          }
        }
      };

      // 1. Guardar BD
      const res = await guardarHistorialEnBaseDatos(historialCompleto);
      setProgreso(p => ({...p, baseDatos: true}));
      
      // 2. Generar y descargar PDF
      const pdfBlob = await generarPDFHistorial(historialCompleto);
      setProgreso(p => ({...p, pdfGenerado: true}));
      
      const nombrePDF = `Historial_${datosFormulario.nombre}_${Date.now()}.pdf`;
      await guardarPDFLocal(pdfBlob, nombrePDF);
      
      await alerta('✅ Historial actualizado correctamente', 'success');
      navigate(`/pacientes/${pacienteId}/historial`);

    } catch (error) {
      console.error("Error guardando:", error);
      alerta('Error al guardar el historial', 'error');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const renderSeccionActual = () => {
    const props = { datos: datosFormulario, errores, onChange: handleInputChange };
    switch (seccionActiva) {
      case 1: return <FichaIdentificacion {...props} />;
      case 2: return <MotivoConsulta {...props} />;
      case 3: return <AntecedentesHeredoFamiliares {...props} />;
      case 4: return <AntecedentesPersonalesNoPatologicos {...props} />;
      case 5: return <AntecedentesPersonalesPatologicos {...props} />;
      case 6: return <ExamenBucal {...props} />;
      case 7: return <ExamenIntrabucal {...props} />;
      case 8: return <SeccionesOclusion {...props} />;
      default: return null;
    }
  };

  const avanceProgreso = (seccionActiva / secciones.length) * 100;

  return (
    <div className="historial-clinico-container">
      {/* HEADER NAV */}
      <div className="secciones-nav">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${avanceProgreso}%` }}></div>
        </div>
        <div className="secciones-carrusel" ref={carruselRef}>
          {secciones.map((seccion) => (
            <div
              key={seccion.id}
              className={`seccion-card ${seccion.id === seccionActiva ? 'active' : ''} ${seccionesValidadas.has(seccion.id) ? 'validated' : ''}`}
              onClick={() => setSeccionActiva(seccion.id)}
            >
              <div className="seccion-numero">{seccionesValidadas.has(seccion.id) ? '✓' : seccion.id}</div>
              <div className="seccion-titulo">{seccion.titulo}</div>
            </div>
          ))}
        </div>
      </div>

      {/* CONTENIDO */}
      <div className="seccion-content">
        <div className="seccion-form">
          {renderSeccionActual()}
        </div>
      </div>

      {/* FOOTER */}
      <div className="navegacion-footer">
        <div className="paciente-info-footer">
          <h2>{secciones[seccionActiva - 1].titulo}</h2>
        </div>
        <div className="navegacion-botones">
          <button className="btn btn-volver" onClick={anteriorSeccion} disabled={seccionActiva === 1}>
            ← Atrás
          </button>
          
          {seccionActiva === secciones.length ? (
            <button className="btn btn-guardar-final" onClick={finalizarHistorial} disabled={generandoPDF}>
              {generandoPDF ? 'Guardando...' : 'Finalizar ✅'}
            </button>
          ) : (
            <button className="btn btn-siguiente" onClick={siguienteSeccion}>
              Siguiente →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HistorialClinico;