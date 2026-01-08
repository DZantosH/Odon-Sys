import React from 'react';
import '../historial/HistorialClinico.css'; 

const HistorialVisualizacionCompleta = ({ datos, paciente }) => {
  if (!datos) return (
    <div className="seccion-vacia" style={{padding: '40px', textAlign: 'center', color: '#666'}}>
      <p>⚠️ No se encontraron datos detallados del historial clínico.</p>
    </div>
  );

  // Helpers
  const renderTexto = (val) => (val && val.trim() !== '' ? val : '---');
  const renderBool = (val) => (val ? 'Sí' : 'No');

  // Helper para mostrar objetos simples (Clave: Valor)
  const renderDetallesObjeto = (objeto, titulo) => {
    if (!objeto || Object.keys(objeto).length === 0) return null;
    return (
      <div className="subseccion-detalles" style={{marginTop: '10px'}}>
        {titulo && <strong style={{display:'block', marginBottom:'5px', color:'#555'}}>{titulo}</strong>}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', fontSize: '13px'}}>
          {Object.entries(objeto).map(([key, value]) => {
            if (typeof value !== 'string' && typeof value !== 'number') return null;
            if (!value) return null;
            // Formatear clave (ej: "boveda_palatina" -> "Boveda Palatina")
            const label = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            return (
              <div key={key} style={{background: '#fff', padding: '6px', border: '1px solid #eee', borderRadius: '4px'}}>
                <span style={{color: '#888', fontSize: '11px', display:'block'}}>{label}:</span>
                <span style={{color: '#333', fontWeight: '500'}}>{value}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const resumenOdontograma = (dientes) => {
    if (!dientes) return <div style={{fontSize: '13px', color: '#888'}}>Sin registros en odontograma</div>;
    const presentes = Object.entries(dientes).filter(([k, v]) => v === 'presente').map(([k]) => k);
    const ausentes = Object.entries(dientes).filter(([k, v]) => v === 'ausente').map(([k]) => k);
    
    if (presentes.length === 0 && ausentes.length === 0) return <div style={{fontSize: '13px', color: '#888'}}>Sin registros en odontograma</div>;

    return (
      <div style={{marginTop: '10px', fontSize: '13px'}}>
        {presentes.length > 0 && <div><strong>Dientes Presentes:</strong> {presentes.join(', ')}</div>}
        {ausentes.length > 0 && <div><strong>Dientes Ausentes:</strong> {ausentes.join(', ')}</div>}
      </div>
    );
  };

  return (
    <div className="vista-completa-historial" style={{background: 'white', padding: '40px', borderRadius: '16px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)'}}>
      
      {/* HEADER */}
      <div style={{borderBottom: '2px solid #3498db', paddingBottom: '20px', marginBottom: '30px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px'}}>
        <div>
          <h2 style={{margin: 0, color: '#2c3e50', fontSize: '24px'}}>Expediente Clínico Digital</h2>
          <span style={{fontSize: '14px', color: '#7f8c8d'}}>Folio: {paciente?.id?.toString().padStart(6, '0') || '---'}</span>
        </div>
        <div style={{textAlign: 'right', fontSize: '14px', color: '#34495e'}}>
          <div><strong>Paciente:</strong> {paciente?.nombre} {paciente?.apellido_paterno}</div>
          <div><strong>Edad:</strong> {paciente?.edad || 'N/A'} años | <strong>Sexo:</strong> {paciente?.sexo}</div>
          <div><strong>Fecha:</strong> {new Date().toLocaleDateString('es-MX')}</div>
        </div>
      </div>

      {/* I. RESUMEN */}
      <section style={{marginBottom: '30px'}}>
        <h3 style={{background: '#f8f9fa', padding: '12px', borderLeft: '4px solid #3498db', margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600'}}>I. Resumen General</h3>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px'}}>
          <div>
            <strong style={{display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '4px', textTransform: 'uppercase'}}>MOTIVO DE CONSULTA</strong>
            <div style={{fontSize: '15px'}}>{renderTexto(datos.motivoConsulta?.motivo || datos.motivo)}</div>
          </div>
          <div>
            <strong style={{display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '4px', textTransform: 'uppercase'}}>EVOLUCIÓN / PADECIMIENTO</strong>
            <div style={{fontSize: '15px'}}>{renderTexto(datos.motivoConsulta?.duracionSintomas || datos.duracionSintomas)}</div>
          </div>
        </div>
      </section>

      {/* II. ANTECEDENTES */}
      <section style={{marginBottom: '30px'}}>
        <h3 style={{background: '#f8f9fa', padding: '12px', borderLeft: '4px solid #2ecc71', margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600'}}>II. Antecedentes Médicos</h3>
        
        <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px'}}>
          <div>
            <strong style={{display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase'}}>HEREDO-FAMILIARES</strong>
            <div style={{fontSize: '14px', lineHeight: '1.6'}}>
              {datos.antecedentesHeredoFamiliares?.antecedentes?.filter(a => a.padecimientos && a.padecimientos.trim()).map((a, i) => (
                <div key={i}>• <strong>{a.parentesco}:</strong> {a.padecimientos}</div>
              ))}
              {(!datos.antecedentesHeredoFamiliares?.antecedentes || datos.antecedentesHeredoFamiliares.antecedentes.filter(a => a.padecimientos).length === 0) && 'Sin antecedentes relevantes.'}
            </div>
          </div>

          <div>
            <strong style={{display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase'}}>PATOLÓGICOS PERSONALES</strong>
            <div style={{fontSize: '14px', lineHeight: '1.6'}}>
              {datos.antecedentesPersonalesPatologicos?.padecimientos?.filter(p => p.padecimiento && p.padecimiento.trim()).map((p, i) => (
                <div key={i}>• <strong>{p.padecimiento}</strong> {p.edad ? `(A los ${p.edad} años)` : ''}</div>
              ))}
              {(!datos.antecedentesPersonalesPatologicos?.padecimientos || datos.antecedentesPersonalesPatologicos.padecimientos.filter(p => p.padecimiento).length === 0) && 'Niega padecimientos.'}
            </div>
          </div>
        </div>
        
        {/* Antecedentes No Patológicos Resumidos */}
        <div style={{marginTop: '20px', paddingTop: '15px', borderTop: '1px solid #eee'}}>
           <strong style={{display: 'block', fontSize: '12px', color: '#7f8c8d', marginBottom: '8px', textTransform: 'uppercase'}}>NO PATOLÓGICOS</strong>
           <div style={{fontSize: '13px', display: 'flex', gap: '20px', flexWrap: 'wrap'}}>
              <span><strong>Higiene:</strong> {renderTexto(datos.antecedentesPersonalesNoPatologicos?.higiene?.general)}</span>
              <span><strong>Alimentación:</strong> {datos.antecedentesPersonalesNoPatologicos?.alimentarios?.comidas_por_dia || 0} comidas/día</span>
           </div>
        </div>
      </section>

      {/* III. EXAMEN CLÍNICO (DETALLADO) */}
      <section style={{marginBottom: '30px'}}>
        <h3 style={{background: '#f8f9fa', padding: '12px', borderLeft: '4px solid #9b59b6', margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600'}}>III. Examen Clínico</h3>
        
        {/* Examen Extrabucal */}
        <div style={{marginBottom: '20px'}}>
          <h4 style={{fontSize: '15px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Examen Extrabucal</h4>
          {renderDetallesObjeto(datos.examenExtrabucal?.cabeza, 'Cabeza y Cara')}
          {renderDetallesObjeto(datos.examenExtrabucal?.atm, 'Articulación Temporomandibular (ATM)')}
          {renderDetallesObjeto(datos.examenExtrabucal?.musculos_cuello, 'Músculos y Cuello')}
        </div>

        {/* Examen Intrabucal */}
        <div>
          <h4 style={{fontSize: '15px', color: '#666', borderBottom: '1px solid #eee', paddingBottom: '5px'}}>Examen Intrabucal</h4>
          
          {datos.examenIntrabucal?.estructuras ? (
             renderDetallesObjeto(datos.examenIntrabucal.estructuras, 'Tejidos Blandos')
          ) : (
             <p style={{fontSize: '13px'}}>Sin hallazgos en tejidos blandos.</p>
          )}

          {renderDetallesObjeto(datos.examenIntrabucal?.encias, 'Encías')}
          
          {datos.examenIntrabucal?.hallazgos_adicionales && (
            <div style={{marginTop: '10px', background: '#fcf8e3', padding: '10px', borderRadius: '4px', border: '1px solid #faebcc'}}>
              <strong>Notas Adicionales:</strong> {datos.examenIntrabucal.hallazgos_adicionales}
            </div>
          )}
        </div>
      </section>

      {/* IV. OCLUSIÓN (DETALLADO) */}
      <section style={{marginBottom: '30px'}}>
        <h3 style={{background: '#f8f9fa', padding: '12px', borderLeft: '4px solid #e67e22', margin: '0 0 15px 0', fontSize: '18px', fontWeight: '600'}}>IV. Oclusión y Diagnóstico</h3>
        
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px'}}>
          
          <div>
            <h4 style={{fontSize: '14px', color: '#555'}}>Odontograma</h4>
            {resumenOdontograma(datos.oclusion?.odontograma?.dientes_presentes)}
            {datos.oclusion?.odontograma?.observaciones_generales && (
              <p style={{fontSize: '13px', fontStyle: 'italic'}}>"{datos.oclusion.odontograma.observaciones_generales}"</p>
            )}
          </div>

          <div>
            <h4 style={{fontSize: '14px', color: '#555'}}>Clasificación de Angle</h4>
            {renderDetallesObjeto(datos.oclusion?.clasificacion_angle)}
          </div>

        </div>

        <div style={{marginTop: '20px'}}>
           {renderDetallesObjeto(datos.oclusion?.armonia_maxilares, 'Armonía de Maxilares')}
           {renderDetallesObjeto(datos.oclusion?.simetria_arco, 'Simetría del Arco')}
        </div>
      </section>

      <div style={{marginTop: '60px', paddingTop: '20px', borderTop: '1px solid #eee', textAlign: 'center', fontSize: '12px', color: '#95a5a6'}}>
        <p>Documento generado electrónicamente por OdontoSys.</p>
      </div>
    </div>
  );
};

export default HistorialVisualizacionCompleta;