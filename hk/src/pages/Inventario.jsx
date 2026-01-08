import React, { useState, useEffect } from 'react';
import {
  Package, Plus, Search, Edit3, Trash2,
  TrendingDown, Grid3X3, List,
  DollarSign, AlertTriangle, X, Undo2,
  Box, CheckCircle, XCircle, AlertCircle
} from 'lucide-react';
import { buildApiUrl, getAuthHeaders } from '../config'; 

const Inventario = () => {
  // --- ESTADOS ---
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, bajo: 0, agotado: 0, valor: 0 });
  const [categorias, setCategorias] = useState([]);

  // Interfaz y Alertas
  const [viewMode, setViewMode] = useState('table');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  
  // 🔥 ESTADOS PARA NOTIFICACIONES Y BORRADO 🔥
  const [notification, setNotification] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Formulario
  const [formData, setFormData] = useState({
    nombre_producto: '',
    categoria: '',
    codigo_producto: '',
    stock_actual: 0, stock_minimo: 5, stock_maximo: 100,
    precio_unitario: 0, unidad_medida: 'unidad', proveedor: '', fecha_vencimiento: ''
  });

  useEffect(() => {
    fetchProductos();
  }, []);

  // --- FUNCIÓN DE NOTIFICACIÓN ---
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchProductos = async () => {
    try {
      setLoading(true);
      const noCacheUrl = buildApiUrl(`admin/inventario?t=${Date.now()}`);
      const response = await fetch(noCacheUrl, { headers: getAuthHeaders() });

      if (response.ok) {
        const data = await response.json();
        setProductos(data);
        
        const cats = [...new Set(data.map(p => p.categoria))].filter(Boolean).sort();
        setCategorias(cats);
        
        setStats({
          total: data.length,
          bajo: data.filter(p => p.stock_actual <= p.stock_minimo && p.stock_actual > 0).length,
          agotado: data.filter(p => p.stock_actual === 0).length,
          valor: data.reduce((acc, p) => acc + (p.stock_actual * p.precio_unitario), 0)
        });
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('Error de conexión al cargar productos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editingProduct 
        ? buildApiUrl(`admin/inventario/${editingProduct.id}`)
        : buildApiUrl('admin/inventario');
      const method = editingProduct ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        await fetchProductos();
        closeModal();
        if (editingProduct) {
            showNotification('Este producto se ha actualizado', 'success');
        } else {
            showNotification('Este producto se ha agregado', 'success');
        }
      } else {
        showNotification('Error al guardar el producto', 'error');
      }
    } catch (error) { 
        console.error(error); 
        showNotification('Error de servidor', 'error');
    }
  };

  // --- LÓGICA DE BORRADO ---
  const confirmDelete = (producto) => {
    setProductToDelete(producto);
  };

  const executeDelete = async () => {
    if (!productToDelete) return;

    try {
        const response = await fetch(buildApiUrl(`admin/inventario/${productToDelete.id}`), {
          method: 'DELETE',
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
            await fetchProductos();
            showNotification('Este producto se ha borrado', 'success');
        } else {
            showNotification('No se pudo eliminar el producto', 'error');
        }
    } catch (error) { 
        console.error(error);
        showNotification('Error de conexión', 'error');
    } finally {
        setProductToDelete(null);
    }
  };

  // --- MODALES Y FORMULARIOS ---
  const openModal = (producto = null) => {
    if (producto) {
      setEditingProduct(producto);
      setFormData({
        nombre_producto: producto.nombre_producto || '',
        categoria: producto.categoria || '',
        codigo_producto: producto.codigo_producto || '',
        stock_actual: producto.stock_actual || 0,
        stock_minimo: producto.stock_minimo || 0,
        stock_maximo: producto.stock_maximo || 0,
        precio_unitario: producto.precio_unitario || 0,
        unidad_medida: producto.unidad_medida || 'unidad',
        proveedor: producto.proveedor || '',
        fecha_vencimiento: producto.fecha_vencimiento || ''
      });
      setIsCustomCategory(false);
    } else {
      setEditingProduct(null);
      setFormData({
        nombre_producto: '', categoria: '', codigo_producto: '',
        stock_actual: 0, stock_minimo: 5, stock_maximo: 100,
        precio_unitario: 0, unidad_medida: 'unidad', proveedor: '', fecha_vencimiento: ''
      });
      setIsCustomCategory(false);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingProduct(null);
    setIsCustomCategory(false);
  };

  const handleCategoryChange = (e) => {
    const value = e.target.value;
    if (value === '__NEW__') {
      setIsCustomCategory(true);
      setFormData({ ...formData, categoria: '' });
    } else {
      setFormData({ ...formData, categoria: value });
    }
  };

  const filteredProducts = productos.filter(p => 
    (filtroCategoria === '' || p.categoria === filtroCategoria) &&
    (searchTerm === '' || p.nombre_producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
     p.codigo_producto?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 max-w-[1600px] mx-auto space-y-4">
      
      {/* 1. ESTADÍSTICAS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<Package/>} title="Total" value={stats.total} color="blue" />
        <StatCard icon={<DollarSign/>} title="Valor" value={`$${stats.valor.toLocaleString()}`} color="green" />
        <StatCard icon={<AlertTriangle/>} title="Bajo Stock" value={stats.bajo} color="yellow" />
        <StatCard icon={<TrendingDown/>} title="Agotados" value={stats.agotado} color="red" />
      </div>

      {/* 2. BARRA DE HERRAMIENTAS */}
      <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between sticky top-0 z-10 transition-colors">
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" placeholder="Buscar producto..." 
              className="w-full pl-10 pr-4 py-3 sm:py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 sm:py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm dark:text-white"
            value={filtroCategoria} onChange={e => setFiltroCategoria(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div className="flex gap-2 w-full md:w-auto justify-end">
          <button 
            onClick={() => setViewMode(viewMode === 'table' ? 'grid' : 'table')}
            className="hidden md:block p-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-200"
          >
            {viewMode === 'table' ? <Grid3X3 size={20}/> : <List size={20}/>}
          </button>
          
          <button 
            onClick={() => openModal()}
            className="flex-1 md:flex-none justify-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 sm:py-2 rounded-lg flex items-center gap-2 font-medium text-sm shadow-sm active:scale-95 transition-transform"
          >
            <Plus size={20} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* 3. VISTA DUAL: PC vs MÓVIL */}
      <div className="hidden md:block">
        {viewMode === 'table' ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden transition-colors">
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700">
                    <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {filteredProducts.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                        <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{p.nombre_producto}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">{p.codigo_producto}</div>
                        </td>
                        <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs text-gray-600 dark:text-gray-300">{p.categoria}</span>
                        </td>
                        <td className="px-4 py-3">
                        <StockBadge current={p.stock_actual} min={p.stock_minimo} unit={p.unidad_medida} />
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 font-medium">
                        ${p.precio_unitario}
                        </td>
                        <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => openModal(p)} className="p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded"><Edit3 size={16}/></button>
                            <button onClick={() => confirmDelete(p)} className="p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded"><Trash2 size={16}/></button>
                        </div>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
            </div>
        ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(p => (
                <DesktopCard key={p.id} p={p} onEdit={() => openModal(p)} onDelete={() => confirmDelete(p)} />
            ))}
            </div>
        )}
      </div>

      <div className="md:hidden space-y-3">
        {filteredProducts.map(p => (
          <div key={p.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm relative transition-colors">
            <div className="flex justify-between items-start mb-2">
                <div>
                    <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-bold uppercase rounded mb-1">
                        {p.categoria}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{p.nombre_producto}</h3>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{p.codigo_producto || 'SIN CÓDIGO'}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-bold text-gray-900 dark:text-white">${p.precio_unitario}</p>
                    <p className="text-[10px] text-gray-400">c/u</p>
                </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 mb-4 border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Box size={16} className="text-gray-400"/>
                    <div>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Stock Actual</p>
                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            {p.stock_actual} <span className="font-normal text-gray-500 dark:text-gray-400">{p.unidad_medida}s</span>
                        </p>
                    </div>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-bold uppercase 
                    ${p.stock_actual === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 
                      p.stock_actual <= p.stock_minimo ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                    {p.stock_actual === 0 ? 'Agotado' : p.stock_actual <= p.stock_minimo ? 'Bajo' : 'Normal'}
                </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => openModal(p)}
                    className="flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg font-medium active:scale-95 transition-transform"
                >
                    <Edit3 size={18}/> Editar
                </button>
                <button 
                    onClick={() => confirmDelete(p)} 
                    className="flex items-center justify-center gap-2 py-2.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg font-medium active:scale-95 transition-transform"
                >
                    <Trash2 size={18}/> Borrar
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* --- MODAL EDITAR/CREAR --- */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-white dark:bg-gray-800 w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 sm:rounded-t-2xl">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">{editingProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
              <button onClick={closeModal}><X size={24} className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white"/></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
              <form id="inventoryForm" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nombre</label>
                    <input type="text" required className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" 
                      value={formData.nombre_producto} onChange={e => setFormData({...formData, nombre_producto: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Código</label>
                    <input type="text" className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" 
                      value={formData.codigo_producto} onChange={e => setFormData({...formData, codigo_producto: e.target.value})} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Categoría</label>
                    {isCustomCategory ? (
                      <div className="flex gap-2 mt-1">
                        <input type="text" required autoFocus className="form-input flex-1 ring-2 ring-blue-100 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" placeholder="Nueva categoría..."
                          value={formData.categoria} onChange={e => setFormData({...formData, categoria: e.target.value})} />
                        <button type="button" onClick={() => { setIsCustomCategory(false); setFormData({...formData, categoria: ''}); }} className="p-2 bg-gray-100 dark:bg-gray-600 rounded hover:bg-gray-200 dark:hover:bg-gray-500 dark:text-white"><Undo2 size={18}/></button>
                      </div>
                    ) : (
                      <select required className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" value={formData.categoria} onChange={handleCategoryChange}>
                        <option value="">Seleccionar...</option>
                        {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                        <option disabled>──────────</option>
                        <option value="__NEW__" className="text-blue-600 dark:text-blue-400 font-bold">+ Crear Nueva</option>
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Proveedor</label>
                    <input type="text" className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" 
                      value={formData.proveedor} onChange={e => setFormData({...formData, proveedor: e.target.value})} />
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Actual</label>
                      <input type="number" min="0" className="form-input text-center font-bold text-blue-600 dark:text-blue-400 text-lg w-full p-1 rounded border-blue-200 dark:border-blue-700 dark:bg-gray-800"
                        value={formData.stock_actual} onChange={e => setFormData({...formData, stock_actual: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Mínimo</label>
                      <input type="number" min="0" className="form-input text-center w-full p-1 rounded border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        value={formData.stock_minimo} onChange={e => setFormData({...formData, stock_minimo: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Máximo</label>
                      <input type="number" min="0" className="form-input text-center w-full p-1 rounded border-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        value={formData.stock_maximo} onChange={e => setFormData({...formData, stock_maximo: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Precio ($)</label>
                    <input type="number" step="0.01" className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" 
                      value={formData.precio_unitario} onChange={e => setFormData({...formData, precio_unitario: Number(e.target.value)})} />
                  </div>
                  <div className="sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Unidad</label>
                    <select className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded" value={formData.unidad_medida} onChange={e => setFormData({...formData, unidad_medida: e.target.value})}>
                      <option value="unidad">Unidad</option><option value="caja">Caja</option><option value="paquete">Paquete</option><option value="litro">Litro</option><option value="par">Par</option><option value="tubo">Tubo</option><option value="ampolla">Ampolla</option>
                    </select>
                  </div>
                   <div className="col-span-2 sm:col-span-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Vencimiento</label>
                    <input type="date" className="form-input mt-1 w-full p-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded"
                      value={formData.fecha_vencimiento ? formData.fecha_vencimiento.split('T')[0] : ''} 
                      onChange={e => setFormData({...formData, fecha_vencimiento: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-2 bg-white dark:bg-gray-800 sm:rounded-b-2xl">
              <button onClick={closeModal} className="flex-1 sm:flex-none px-4 py-3 sm:py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg font-medium">Cancelar</button>
              <button type="submit" form="inventoryForm" className="flex-1 sm:flex-none px-4 py-3 sm:py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICACIÓN FLOTANTE (TOAST) --- */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-lg border-l-4 animate-bounce flex items-center gap-3 max-w-sm bg-white dark:bg-gray-800 dark:text-white
          ${notification.type === 'error' ? 'border-red-500 text-red-800 dark:text-red-300' : 'border-green-500 text-green-800 dark:text-green-300'}`}>
          {notification.type === 'error' ? <XCircle size={24} className="text-red-500"/> : <CheckCircle size={24} className="text-green-500"/>}
          <p className="font-medium text-sm">{notification.message}</p>
        </div>
      )}

      {/* --- MODAL DE ELIMINACIÓN --- */}
      {productToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm transition-opacity" onClick={() => setProductToDelete(null)}></div>
          <div className="relative bg-red-50 dark:bg-red-900/30 rounded-xl shadow-[0_0_30px_rgba(220,38,38,0.2)] border-2 border-red-500 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-200 dark:bg-red-800 p-3 rounded-full flex-shrink-0 animate-pulse">
                  <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">¿Eliminar producto?</h3>
                  <p className="text-sm text-red-700 dark:text-red-200 mt-2 font-medium">
                    Estás a punto de borrar del inventario:
                  </p>
                  
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 shadow-sm">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{productToDelete.nombre_producto}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 uppercase tracking-wide">
                        Stock actual: <span className="font-bold text-red-600 dark:text-red-400">{productToDelete.stock_actual} {productToDelete.unidad_medida}s</span>
                    </p>
                  </div>
                  
                  <p className="text-xs text-red-600 dark:text-red-300 mt-3 italic">
                    ⚠️ Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setProductToDelete(null)}
                  className="px-4 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 active:scale-95 transition-transform"
                >
                  Cancelar
                </button>
                <button
                  onClick={executeDelete}
                  className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <Trash2 size={18} />
                  Sí, Eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// --- COMPONENTES AUXILIARES ---
const StatCard = ({ icon, title, value, color }) => {
  const colors = { 
    blue: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', 
    green: 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400', 
    yellow: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', 
    red: 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400' 
  };
  return (
    <div className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 transition-colors">
      <div className={`p-2 rounded-lg ${colors[color]}`}>{React.cloneElement(icon, { size: 20 })}</div>
      <div>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">{title}</p>
        <p className="text-lg font-bold text-gray-800 dark:text-white leading-none">{value}</p>
      </div>
    </div>
  );
};

const StockBadge = ({ current, min, unit }) => {
  let color = current === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : current <= min ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
  let label = current === 0 ? 'Agotado' : current <= min ? 'Bajo' : 'Normal';
  return (
    <div>
      <p className="text-sm font-bold text-gray-900 dark:text-white">{current} <span className="text-xs font-normal text-gray-500 dark:text-gray-400">{unit}s</span></p>
      <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${color}`}>{label}</span>
    </div>
  );
};

const DesktopCard = ({ p, onEdit, onDelete }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow relative group">
        <div className="flex justify-between items-start mb-2">
        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-600 dark:text-gray-300">{p.categoria}</span>
        <div className="flex gap-1">
            <button onClick={onEdit} className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"><Edit3 size={16}/></button>
            <button onClick={onDelete} className="text-gray-400 hover:text-red-600 dark:hover:text-red-400"><Trash2 size={16}/></button>
        </div>
        </div>
        <h3 className="font-bold text-gray-800 dark:text-white mb-1 truncate">{p.nombre_producto}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">{p.codigo_producto || 'Sin código'}</p>
        <div className="flex justify-between items-end border-t border-gray-100 dark:border-gray-700 pt-3">
        <StockBadge current={p.stock_actual} min={p.stock_minimo} unit={p.unidad_medida} />
        <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Precio</p>
            <p className="font-bold text-gray-900 dark:text-white">${p.precio_unitario}</p>
        </div>
        </div>
    </div>
);

export default Inventario;