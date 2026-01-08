import React, { useState, useCallback } from 'react';
import '../../css/HistorialFormularios.css'; 
import OdontogramaVisual from '../../components/OdontogramaVisual';

const SeccionesOclusion = ({ datos: externalData, onChange: externalOnChange, errores = {} }) => {
  const [localData, setLocalData] = useState({
    oclusion: {
      odontograma: {
        estados_dientes: {}, 
        observaciones_generales: ''
      },
      armonia_maxilares: {
        amplitud_arco_superior: '',
        boveda_palatina: '',
        amplitud_arco_inferior: '',
        descripcion_armonia: ''
      },
      simetria_arco: {
        relacion_antero_posterior_derecho: '',
        relacion_antero_posterior_izquierdo: '',
        relacion_buco_lingual_derecho: '',
        relacion_buco_lingual_izquierdo: ''
      },
      clasificacion_angle: {
        relacion_molar_derecho: '',
        relacion_molar_izquierdo: '',
        relacion_canina_derecho: '',
        relacion_canina_izquierdo: '',
        sobremordida_vertical: '',
        sobremordida_horizontal: '',
        borde_a_borde: '',
        mordida_abierta: '',
        mordida_cruzada_anterior: '',
        mordida_cruzada_posterior: '',
        linea_media_maxilar: '',
        linea_media_mandibular: '',
        diastemas: '',
        apiñamiento: '',
        facetas_desgaste: '',
        alteraciones_dentales: []
      }
    },
    examen_higiene_oral: {
      numero_total_dientes: '',
      superficies_placa: {},
      total_superficies_revisadas: '',
      ipdb_porcentaje: '',
      observaciones_oleary: ''
    },
    encias: {
      alteraciones_gingivales: [],
      localizaciones_afectadas: ''
    },
    examen_dental: {
      dientes_evaluados: {},
      hallazgos_dentales: '',
      procedimientos_realizados: ''
    },
    periodontograma: {
      lesiones_gingivales: {},
      estados_periodonto: {},
      observaciones_periodonto: ''
    },
    modelos_estudio: {
      hallazgos: ''
    }
  });

  const data = externalData || localData;

  const handleChange = useCallback((field, value) => {
    if (externalOnChange) {
      externalOnChange(field, value);
    } else {
      setLocalData(prev => ({ ...prev, [field]: value }));
    }
  }, [externalOnChange]);

  const handleNestedChange = useCallback((section, field, value) => {
    const newData = { ...data[section], [field]: value };
    handleChange(section, newData);
  }, [data, handleChange]);

  const handleSuperNestedChange = useCallback((mainSection, subSection, field, value) => {
    const newData = {
      ...data[mainSection],
      [subSection]: { ...data[mainSection]?.[subSection], [field]: value }
    };
    handleChange(mainSection, newData);
  }, [data, handleChange]);

  // --- FUNCIONES DE AYUDA ---
  const agregarAlteracionDental = () => {
    const nuevas = [...(data.oclusion?.clasificacion_angle?.alteraciones_dentales || []), { diente: '', descripcion: '' }];
    handleSuperNestedChange('oclusion', 'clasificacion_angle', 'alteraciones_dentales', nuevas);
  };
  const eliminarAlteracionDental = (i) => {
    const nuevas = (data.oclusion?.clasificacion_angle?.alteraciones_dentales || []).filter((_, idx) => idx !== i);
    handleSuperNestedChange('oclusion', 'clasificacion_angle', 'alteraciones_dentales', nuevas);
  };
  const actualizarAlteracionDental = (i, f, v) => {
    const nuevas = [...(data.oclusion?.clasificacion_angle?.alteraciones_dentales || [])];
    nuevas[i] = { ...nuevas[i], [f]: v };
    handleSuperNestedChange('oclusion', 'clasificacion_angle', 'alteraciones_dentales', nuevas);
  };

  const agregarAlteracionGingival = () => {
    const nuevas = [...(data.encias?.alteraciones_gingivales || []), { localizacion: '', descripcion: '' }];
    handleNestedChange('encias', 'alteraciones_gingivales', nuevas);
  };
  const eliminarAlteracionGingival = (i) => {
    const nuevas = (data.encias?.alteraciones_gingivales || []).filter((_, idx) => idx !== i);
    handleNestedChange('encias', 'alteraciones_gingivales', nuevas);
  };
  const actualizarAlteracionGingival = (i, f, v) => {
    const nuevas = [...(data.encias?.alteraciones_gingivales || [])];
    nuevas[i] = { ...nuevas[i], [f]: v };
    handleNestedChange('encias', 'alteraciones_gingivales', nuevas);
  };

  const toggleSuperficiePlaca = (num) => {
    const actuales = data.examen_higiene_oral?.superficies_placa || {};
    handleNestedChange('examen_higiene_oral', 'superficies_placa', { ...actuales, [num]: !actuales[num] });
  };
  const calcularIPDB = () => {
    const conPlaca = Object.values(data.examen_higiene_oral?.superficies_placa || {}).filter(Boolean).length;
    const total = parseInt(data.examen_higiene_oral?.total_superficies_revisadas) || 128;
    return total === 0 ? '0%' : `${((conPlaca / total) * 100).toFixed(1)}%`;
  };

  const toggleEstadoPeriodonto = (diente, tipo) => {
    const estados = data.periodontograma?.estados_periodonto || {};
    const estadoDiente = estados[diente] || {};
    handleNestedChange('periodontograma', 'estados_periodonto', {
      ...estados,
      [diente]: { ...estadoDiente, [tipo]: !estadoDiente[tipo] }
    });
  };

  const getColorRaizPeriodonto = (diente) => {
    const st = data.periodontograma?.estados_periodonto?.[diente] || {};
    if (st.gingival && st.periodontal) return 'gingival-periodontal';
    if (st.gingival) return 'gingival';
    if (st.periodontal) return 'periodontal';
    return '';
  };

  // Arreglos de dientes para el periodontograma
  const dientesSuperior = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
  const dientesInferior = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

  return (
    <div className="secciones-oclusion-container">
      {/* 16. Oclusión */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">16. Oclusión</h4>
          <span className="intrabucal-badge dental">ODONTOGRAMA</span>
        </div>
        <div className="intrabucal-form-group">
          <OdontogramaVisual 
            datos={data.oclusion?.odontograma} 
            onChange={(c, v) => handleSuperNestedChange('oclusion', 'odontograma', c, v)}
          />
          <div className="intrabucal-field" style={{marginTop:'20px'}}>
            <label className="intrabucal-label">Observaciones generales</label>
            <textarea
              className="intrabucal-textarea"
              value={data.oclusion?.odontograma?.observaciones_generales || ''}
              onChange={(e) => handleSuperNestedChange('oclusion', 'odontograma', 'observaciones_generales', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 16.1 Armonía */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header"><h4 className="intrabucal-card-title">16.1 Armonía de los Maxilares</h4></div>
        <div className="intrabucal-form-group">
          <div className="intrabucal-grid-3">
             {['amplitud_arco_superior', 'boveda_palatina', 'amplitud_arco_inferior'].map(field => (
               <div key={field} className="intrabucal-field">
                 <label className="intrabucal-label">{field.replace(/_/g, ' ').toUpperCase()}</label>
                 <select className="intrabucal-select" value={data.oclusion?.armonia_maxilares?.[field] || ''} onChange={(e) => handleSuperNestedChange('oclusion', 'armonia_maxilares', field, e.target.value)}>
                   <option value="">Seleccionar...</option>
                   <option value="Normal">Normal</option>
                   <option value="Amplio">Amplio</option>
                   <option value="Estrecho">Estrecho</option>
                 </select>
               </div>
             ))}
          </div>
          <div className="intrabucal-field">
             <label className="intrabucal-label">Descripción</label>
             <textarea className="intrabucal-textarea" value={data.oclusion?.armonia_maxilares?.descripcion_armonia || ''} onChange={(e) => handleSuperNestedChange('oclusion', 'armonia_maxilares', 'descripcion_armonia', e.target.value)} />
          </div>
        </div>
      </div>

      {/* 16.3 Angle */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header"><h4 className="intrabucal-card-title">16.3 Clasificación de Angle</h4></div>
        <div className="intrabucal-form-group">
           <div className="intrabucal-grid-2">
              <div className="intrabucal-field">
                 <label className="intrabucal-label">Relación Molar Derecha</label>
                 <select className="intrabucal-select" value={data.oclusion?.clasificacion_angle?.relacion_molar_derecho || ''} onChange={(e) => handleSuperNestedChange('oclusion', 'clasificacion_angle', 'relacion_molar_derecho', e.target.value)}>
                    <option value="">Seleccionar...</option><option value="Clase I">Clase I</option><option value="Clase II">Clase II</option><option value="Clase III">Clase III</option>
                 </select>
              </div>
              <div className="intrabucal-field">
                 <label className="intrabucal-label">Relación Molar Izquierda</label>
                 <select className="intrabucal-select" value={data.oclusion?.clasificacion_angle?.relacion_molar_izquierdo || ''} onChange={(e) => handleSuperNestedChange('oclusion', 'clasificacion_angle', 'relacion_molar_izquierdo', e.target.value)}>
                    <option value="">Seleccionar...</option><option value="Clase I">Clase I</option><option value="Clase II">Clase II</option><option value="Clase III">Clase III</option>
                 </select>
              </div>
           </div>
           
           <div style={{marginTop: '20px'}}>
             <div className="intrabucal-alteraciones-header">
                <h5>Alteraciones Dentales</h5>
                <button type="button" onClick={agregarAlteracionDental} className="intrabucal-btn-add">+ Agregar</button>
             </div>
             {(data.oclusion?.clasificacion_angle?.alteraciones_dentales || []).map((alt, i) => (
                <div key={i} className="intrabucal-alteracion-item" style={{display:'flex', gap:'10px'}}>
                   <input className="intrabucal-small-input" placeholder="Diente" value={alt.diente} onChange={(e) => actualizarAlteracionDental(i, 'diente', e.target.value)} />
                   <input className="intrabucal-small-input" placeholder="Descripción" value={alt.descripcion} onChange={(e) => actualizarAlteracionDental(i, 'descripcion', e.target.value)} />
                   <button type="button" onClick={() => eliminarAlteracionDental(i)} className="intrabucal-btn-remove">X</button>
                </div>
             ))}
           </div>
        </div>
      </div>

      {/* 17. O'Leary */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header"><h4 className="intrabucal-card-title">17. Índice O'Leary</h4></div>
        <div className="intrabucal-form-group">
           <div className="oleary-grid">
              {Array.from({length: 32}, (_, i) => i + 1).map(num => (
                 <div key={num} className={`oleary-diente ${data.examen_higiene_oral?.superficies_placa?.[num] ? 'con-placa' : 'sin-placa'}`} onClick={() => toggleSuperficiePlaca(num)}>{num}</div>
              ))}
           </div>
           <p style={{textAlign:'center', fontWeight:'bold', marginTop:'10px'}}>IPDB: {calcularIPDB()}</p>
        </div>
      </div>

      {/* 20. PERIODONTOGRAMA (Corregido) */}
      <div className="intrabucal-section-card">
        <div className="intrabucal-card-header">
          <h4 className="intrabucal-card-title">20. Periodontograma</h4>
          <span className="intrabucal-badge periodonto">PERIODONTO</span>
        </div>
        <div className="intrabucal-form-group">
           <p className="intrabucal-section-description">
             Click: Lesión Gingival (Rojo) | Ctrl+Click: Lesión Periodontal (Azul)
           </p>
           
           <div className="periodontograma-container">
             <div className="periodonto-visual">
               
               {/* ARCADA SUPERIOR */}
               <div className="periodonto-superior">
                 {dientesSuperior.map(diente => (
                    <div key={diente} className="diente-periodonto">
                       <span className="corona-periodonto">{diente}</span>
                       <div 
                         className={`raiz-periodonto superior ${getColorRaizPeriodonto(diente)}`}
                         onClick={(e) => {
                            e.preventDefault();
                            if (e.ctrlKey) toggleEstadoPeriodonto(diente, 'periodontal');
                            else toggleEstadoPeriodonto(diente, 'gingival');
                         }}
                         title="Raíz - Click para marcar lesión"
                       ></div>
                    </div>
                 ))}
               </div>

               {/* ARCADA INFERIOR */}
               <div className="periodonto-inferior">
                 {dientesInferior.map(diente => (
                    <div key={diente} className="diente-periodonto">
                       <div 
                         className={`raiz-periodonto inferior ${getColorRaizPeriodonto(diente)}`}
                         onClick={(e) => {
                            e.preventDefault();
                            if (e.ctrlKey) toggleEstadoPeriodonto(diente, 'periodontal');
                            else toggleEstadoPeriodonto(diente, 'gingival');
                         }}
                         title="Raíz - Click para marcar lesión"
                       ></div>
                       <span className="corona-periodonto">{diente}</span>
                    </div>
                 ))}
               </div>

             </div>
           </div>

           <div className="leyenda-periodonto">
              <div className="leyenda-item"><div className="indicador-gingival"></div> Gingival</div>
              <div className="leyenda-item"><div className="indicador-periodontal"></div> Periodontal</div>
              <div className="leyenda-item"><div className="indicador-mixto"></div> Ambas</div>
           </div>

           <div className="intrabucal-field" style={{marginTop:'20px'}}>
              <label className="intrabucal-label">Observaciones:</label>
              <textarea
                className="intrabucal-textarea"
                value={data.periodontograma?.observaciones_periodonto || ''}
                onChange={(e) => handleNestedChange('periodontograma', 'observaciones_periodonto', e.target.value)}
              />
           </div>
        </div>
      </div>

    </div>
  );
};

export default SeccionesOclusion;