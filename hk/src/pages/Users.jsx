import React, { useState, useEffect } from 'react';
import {
  Users as UsersIcon,
  Plus,
  Search,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Shield,
  Stethoscope,
  Clipboard,
  CheckCircle,
  XCircle,
  AlertCircle,
  Camera
} from 'lucide-react';
import { getAdminToken, getAuthHeaders, buildApiUrl } from '../config';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [notification, setNotification] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedUserForAvatar, setSelectedUserForAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Formulario
  const [formNombre, setFormNombre] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formRol, setFormRol] = useState('Secretaria');
  const [formPassword, setFormPassword] = useState('');
  const [formActivo, setFormActivo] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    administradores: 0,
    doctores: 0,
    secretarias: 0,
    activos: 0,
    inactivos: 0
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, selectedRole, selectedStatus]);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAdminToken();
      if (!token) {
        showNotification('No hay token de autenticación', 'error');
        setLoading(false);
        return;
      }

      const response = await fetch(buildApiUrl('admin/users'), {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
        calculateStats(data);
        showNotification(`${data.length} usuarios cargados correctamente`);
      } else {
        const errorData = await response.json().catch(() => ({ 
          message: `Error HTTP ${response.status}` 
        }));
        showNotification(errorData.message || 'Error al cargar usuarios', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (usersData) => {
    const newStats = {
      total: usersData.length,
      administradores: usersData.filter(u => u.rol === 'Administrador').length,
      doctores: usersData.filter(u => u.rol === 'Doctor').length,
      secretarias: usersData.filter(u => u.rol === 'Secretaria').length,
      activos: usersData.filter(u => u.activo).length,
      inactivos: usersData.filter(u => !u.activo).length
    };
    setStats(newStats);
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.telefono && user.telefono.includes(searchTerm))
      );
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.rol === selectedRole);
    }

    if (selectedStatus !== '') {
      filtered = filtered.filter(user => 
        selectedStatus === 'activo' ? user.activo : !user.activo
      );
    }

    setFilteredUsers(filtered);
  };

  const clearForm = () => {
    setFormNombre('');
    setFormEmail('');
    setFormTelefono('');
    setFormRol('Secretaria');
    setFormPassword('');
    setFormActivo(true);
  };

  const openModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormNombre(`${user.nombre} ${user.apellido_completo || ''}`.trim());
      setFormEmail(user.email);
      setFormTelefono(user.telefono || '');
      setFormRol(user.rol);
      setFormPassword('');
      setFormActivo(user.activo);
    } else {
      setEditingUser(null);
      clearForm();
    }
    setShowModal(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setSubmitting(false);
    clearForm();
    document.body.style.overflow = 'auto';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Validaciones (abreviadas)
    if (!formNombre.trim() || !formEmail.trim()) {
      showNotification('Complete campos obligatorios', 'error');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = getAdminToken();
      if (!token) return;
      
      const url = editingUser 
        ? buildApiUrl(`admin/users/${editingUser.id}`)
        : buildApiUrl('admin/users');
      
      const method = editingUser ? 'PUT' : 'POST';
      
      const submitData = {
        nombre: formNombre,
        email: formEmail,
        telefono: formTelefono || null,
        rol: formRol,
        activo: formActivo
      };
      
      if (!editingUser || (editingUser && formPassword.trim())) {
        submitData.password = formPassword;
      }

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        await fetchUsers();
        closeModal();
        showNotification(
          editingUser ? 'Usuario actualizado exitosamente' : 'Usuario creado exitosamente',
          'success'
        );
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error al guardar usuario', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const response = await fetch(buildApiUrl(`admin/users/${userId}/toggle-status`), {
        method: 'PATCH',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        await fetchUsers();
        showNotification(result.message, 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error al cambiar estado', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    }
  };

  const confirmDeleteUser = (user) => {
    setUserToDelete(user);
  };

  const executeDelete = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await fetch(buildApiUrl(`admin/users/${userToDelete.id}`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        await fetchUsers();
        showNotification(result.message, 'success');
      } else {
        const error = await response.json();
        showNotification(error.message || 'Error al eliminar usuario', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      setUserToDelete(null);
    }
  };

  const handleAvatarUpload = (user) => {
    setSelectedUserForAvatar(user);
    setShowAvatarModal(true);
    setAvatarFile(null);
    setAvatarPreview(null);
  };

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setAvatarPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const uploadAvatar = async () => {
    if (!avatarFile || !selectedUserForAvatar) return;

    try {
      setUploadingAvatar(true);
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      const token = getAdminToken();
      const response = await fetch(buildApiUrl(`admin/users/${selectedUserForAvatar.id}/avatar`), {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        await fetchUsers();
        setShowAvatarModal(false);
        showNotification('Avatar actualizado exitosamente', 'success');
      } else {
        showNotification('Error al subir avatar', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const removeAvatar = async (userId) => {
    if (!window.confirm('¿Está seguro de eliminar el avatar?')) return;
    try {
      const response = await fetch(buildApiUrl(`admin/users/${userId}/avatar`), {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (response.ok) {
        await fetchUsers();
        showNotification('Avatar eliminado exitosamente', 'success');
      } else {
        showNotification('Error al eliminar avatar', 'error');
      }
    } catch (error) {
      showNotification(`Error de conexión: ${error.message}`, 'error');
    }
  };

  const getRoleIcon = (rol) => {
    switch (rol) {
      case 'Administrador': return <Shield className="w-4 h-4" />;
      case 'Doctor': return <Stethoscope className="w-4 h-4" />;
      case 'Secretaria': return <Clipboard className="w-4 h-4" />;
      default: return <UsersIcon className="w-4 h-4" />;
    }
  };

  const getRoleColor = (rol) => {
    switch (rol) {
      case 'Administrador': return 'text-red-600 bg-red-50 dark:bg-red-900/30 dark:text-red-400';
      case 'Doctor': return 'text-blue-600 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Secretaria': return 'text-green-600 bg-green-50 dark:bg-green-900/30 dark:text-green-400';
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-700 dark:text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando usuarios...</span>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Notificaciones */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg border-l-4 ${
          notification.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900 border-green-400 text-green-800 dark:text-green-100' 
            : notification.type === 'error'
            ? 'bg-red-50 dark:bg-red-900 border-red-400 text-red-800 dark:text-red-100'
            : 'bg-blue-50 dark:bg-blue-900 border-blue-400 text-blue-800 dark:text-blue-100'
        }`}>
          <div className="flex items-center">
            {notification.type === 'success' && <CheckCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'error' && <XCircle className="w-5 h-5 mr-2" />}
            {notification.type === 'info' && <AlertCircle className="w-5 h-5 mr-2" />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-7 h-7" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra usuarios del sistema y sus permisos
          </p>
        </div>
        <button
          onClick={() => openModal()}
          disabled={submitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatsCard label="Total" value={stats.total} icon={UsersIcon} color="gray" />
        <StatsCard label="Admins" value={stats.administradores} icon={Shield} color="red" />
        <StatsCard label="Doctores" value={stats.doctores} icon={Stethoscope} color="blue" />
        <StatsCard label="Secretarias" value={stats.secretarias} icon={Clipboard} color="green" />
        <StatsCard label="Activos" value={stats.activos} icon={UserCheck} color="green" />
        <StatsCard label="Inactivos" value={stats.inactivos} icon={UserX} color="red" />
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-6 transition-colors">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Buscar por nombre, email o teléfono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white outline-none"
            />
          </div>
          
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white outline-none"
          >
            <option value="">Todos los roles</option>
            <option value="Administrador">Administrador</option>
            <option value="Doctor">Doctor</option>
            <option value="Secretaria">Secretaria</option>
          </select>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="activo">Activos</option>
            <option value="inactivo">Inactivos</option>
          </select>
        </div>
      </div>

      {/* VISTA DE ESCRITORIO */}
      <div className="hidden md:block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b dark:border-gray-700">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase w-16">Foto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Teléfono</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Registro</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                     <div className="flex justify-center">
                       {user.avatar_url ? (
                         <img src={`http://localhost:5000${user.avatar_url}`} className="rounded-full object-cover border border-gray-200 dark:border-gray-600" style={{ width: '40px', height: '40px' }} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
                       ) : null}
                       <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${user.avatar_url ? 'hidden' : 'flex'} ${user.rol === 'Administrador' ? 'bg-red-500' : user.rol === 'Doctor' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ display: user.avatar_url ? 'none' : 'flex' }}>
                         {user.nombre.charAt(0).toUpperCase()}
                       </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user.nombre} {user.apellido_paterno}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.rol)}`}>
                      {getRoleIcon(user.rol)} {user.rol}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.telefono || '-'}</td>
                  <td className="px-6 py-4">
                     <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.activo ? 'text-green-800 bg-green-100 dark:bg-green-900/30 dark:text-green-400' : 'text-red-800 bg-red-100 dark:bg-red-900/30 dark:text-red-400'}`}>
                        {user.activo ? 'Activo' : 'Inactivo'}
                     </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{user.fecha_registro ? new Date(user.fecha_registro).toLocaleDateString() : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openModal(user)} className="text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 p-1 rounded" title="Editar"><Edit size={18}/></button>
                      <button onClick={() => handleAvatarUpload(user)} className="text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30 p-1 rounded" title="Foto"><Camera size={18}/></button>
                      <button onClick={() => toggleUserStatus(user.id, user.activo)} className={`${user.activo ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'} hover:bg-gray-100 dark:hover:bg-gray-700 p-1 rounded`} title="Estado">
                        {user.activo ? <UserX size={18}/> : <UserCheck size={18}/>}
                      </button>
                      <button onClick={() => confirmDeleteUser(user)} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 p-1 rounded" title="Eliminar"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* VISTA MÓVIL */}
      <div className="md:hidden grid grid-cols-1 gap-4">
        {filteredUsers.map((user) => (
          <div key={user.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div className="flex gap-3 items-center">
                <div className="relative">
                    {user.avatar_url ? (
                         <img src={`http://localhost:5000${user.avatar_url}`} className="rounded-full object-cover border border-gray-200 dark:border-gray-600" style={{ width: '48px', height: '48px' }} onError={(e) => {e.target.style.display='none'; e.target.nextSibling.style.display='flex'}} />
                       ) : null}
                    <div className={`h-12 w-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${user.avatar_url ? 'hidden' : 'flex'} ${user.rol === 'Administrador' ? 'bg-red-500' : user.rol === 'Doctor' ? 'bg-blue-500' : 'bg-green-500'}`} style={{ display: user.avatar_url ? 'none' : 'flex' }}>
                      {user.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${user.activo ? 'bg-green-500' : 'bg-red-500'}`}></div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-base">{user.nombre} {user.apellido_paterno}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium mt-1 ${getRoleColor(user.rol)}`}>
                    {getRoleIcon(user.rol)} {user.rol}
                  </span>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300 mb-4 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-400 dark:text-gray-500 text-xs uppercase w-16">Email:</span>
                <span className="truncate">{user.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-400 dark:text-gray-500 text-xs uppercase w-16">Teléfono:</span>
                <span>{user.telefono || 'No registrado'}</span>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2 border-t dark:border-gray-700 pt-3">
              <button onClick={() => openModal(user)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Edit size={20} /> <span className="text-[10px] mt-1 font-medium">Editar</span>
              </button>
              <button onClick={() => handleAvatarUpload(user)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                <Camera size={20} /> <span className="text-[10px] mt-1 font-medium">Foto</span>
              </button>
              <button onClick={() => toggleUserStatus(user.id, user.activo)} className={`flex flex-col items-center justify-center p-2 rounded-lg ${user.activo ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400' : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'}`}>
                {user.activo ? <UserX size={20}/> : <UserCheck size={20}/>} <span className="text-[10px] mt-1 font-medium">{user.activo ? 'Desactivar' : 'Activar'}</span>
              </button>
              <button onClick={() => confirmDeleteUser(user)} className="flex flex-col items-center justify-center p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <Trash2 size={20} /> <span className="text-[10px] mt-1 font-medium">Borrar</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODAL USUARIO */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-blue-900/40 backdrop-blur-sm transition-opacity" onClick={closeModal}></div>
          <div className="relative bg-blue-50 dark:bg-gray-800 rounded-2xl shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border-2 border-blue-200 dark:border-gray-700 max-w-md w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 bg-blue-600 dark:bg-blue-700 text-white sticky top-0 z-10 shadow-md">
              <h3 className="text-xl font-bold flex items-center gap-2">{editingUser ? <Edit size={20}/> : <Plus size={20}/>} {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
              <button onClick={closeModal} className="text-blue-100 hover:text-white hover:bg-blue-500 rounded-full p-1"><XCircle size={24} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              <div className="bg-white dark:bg-gray-700/50 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 dark:text-blue-300 uppercase tracking-wider mb-2">Información Personal</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo *</label>
                  <input type="text" required value={formNombre} onChange={(e) => setFormNombre(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="Ej: Juan Pérez García" disabled={submitting} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                  <input type="email" required value={formEmail} onChange={(e) => setFormEmail(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="usuario@ejemplo.com" disabled={submitting} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                  <input type="tel" value={formTelefono} onChange={(e) => setFormTelefono(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder="5512345678" disabled={submitting} />
                </div>
              </div>
              <div className="bg-white dark:bg-gray-700/50 p-4 rounded-xl shadow-sm border border-blue-100 dark:border-gray-600 space-y-4">
                <h4 className="text-xs font-bold text-blue-400 dark:text-blue-300 uppercase tracking-wider mb-2">Acceso y Seguridad</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol *</label>
                    <select required value={formRol} onChange={(e) => setFormRol(e.target.value)} className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" disabled={submitting}>
                      <option value="Secretaria">Secretaria</option><option value="Doctor">Doctor</option><option value="Administrador">Admin</option>
                    </select>
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center cursor-pointer select-none group">
                      <div className="relative">
                        <input type="checkbox" checked={formActivo} onChange={(e) => setFormActivo(e.target.checked)} className="sr-only" disabled={submitting} />
                        <div className={`block w-10 h-6 rounded-full transition-colors ${formActivo ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-500'}`}></div>
                        <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${formActivo ? 'transform translate-x-4' : ''}`}></div>
                      </div>
                      <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-blue-600">Usuario Activo</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{editingUser ? 'Cambiar Contraseña (Opcional)' : 'Contraseña *'}</label>
                  <input type="password" required={!editingUser} value={formPassword} onChange={(e) => setFormPassword(e.target.value)} className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white" placeholder={editingUser ? '••••••••' : 'Mínimo 6 caracteres'} disabled={submitting} />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} disabled={submitting} className="flex-1 px-4 py-3 text-sm font-bold text-blue-700 dark:text-blue-200 bg-blue-100 dark:bg-blue-900/40 hover:bg-blue-200 rounded-xl transition-colors">Cancelar</button>
                <button type="submit" disabled={submitting} className="flex-1 px-4 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform active:scale-95 flex items-center justify-center gap-2">
                  {submitting ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle size={18}/>}
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AVATAR */}
      {showAvatarModal && selectedUserForAvatar && (
        <div className="fixed inset-0 z-50 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">📷 Cambiar Avatar</h3>
              <button onClick={() => { setShowAvatarModal(false); setSelectedUserForAvatar(null); setAvatarFile(null); setAvatarPreview(null); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl leading-none">×</button>
            </div>
            <div className="p-6">
              <div className="text-center mb-6">
                <div className="flex items-center justify-center mb-2">
                  <div className={`h-16 w-16 rounded-full flex items-center justify-center text-white font-bold text-xl ${selectedUserForAvatar.rol === 'Administrador' ? 'bg-red-500' : selectedUserForAvatar.rol === 'Doctor' ? 'bg-blue-500' : 'bg-green-500'}`}>{selectedUserForAvatar.nombre.charAt(0).toUpperCase()}</div>
                </div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">{selectedUserForAvatar.nombre} {selectedUserForAvatar.apellido_completo}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">{selectedUserForAvatar.rol}</p>
              </div>
              {avatarPreview && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Vista previa:</p>
                <img src={avatarPreview} alt="Preview" className="rounded-full object-cover mx-auto border-2 border-gray-200 dark:border-gray-600" style={{ width: '96px', height: '96px', objectFit: 'cover' }} />
              </div>
            )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar imagen</label>
                <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" onChange={handleAvatarFileChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500" disabled={uploadingAvatar} />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Formatos: JPG, PNG, GIF, WEBP. Máximo: 5MB</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setShowAvatarModal(false); setSelectedUserForAvatar(null); setAvatarFile(null); setAvatarPreview(null); }} disabled={uploadingAvatar} className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600">Cancelar</button>
                {selectedUserForAvatar.avatar_url && (
                  <button onClick={() => removeAvatar(selectedUserForAvatar.id)} disabled={uploadingAvatar} className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50">🗑️ Eliminar</button>
                )}
                <button onClick={uploadAvatar} disabled={!avatarFile || uploadingAvatar} className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 flex items-center justify-center">
                  {uploadingAvatar ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div> : '📷 Subir Avatar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ELIMINAR */}
      {userToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-red-900/30 backdrop-blur-sm transition-opacity" onClick={() => setUserToDelete(null)}></div>
          <div className="relative bg-red-50 dark:bg-red-900/30 border-2 border-red-500 rounded-xl shadow-[0_0_40px_rgba(239,68,68,0.3)] max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-red-200 dark:bg-red-800 p-3 rounded-full flex-shrink-0 animate-pulse">
                  <AlertCircle className="w-8 h-8 text-red-700 dark:text-red-200" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-red-900 dark:text-red-100">¿Estás absolutamente seguro?</h3>
                  <p className="text-sm text-red-800 dark:text-red-200 mt-2">Estás a punto de eliminar a:</p>
                  <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-red-200 dark:border-red-800 shadow-inner">
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{userToDelete.nombre}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{userToDelete.email}</p>
                    <span className="inline-block mt-2 px-2 py-1 bg-red-100 dark:bg-red-900/50 text-red-800 dark:text-red-200 text-xs font-bold rounded-full uppercase">{userToDelete.rol}</span>
                  </div>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-4 font-medium bg-red-100 dark:bg-red-900/40 p-2 rounded border border-red-200 dark:border-red-800">⚠️ Advertencia: Se borrará todo el historial permanentemente.</p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => setUserToDelete(null)} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 rounded-lg transition-colors">Cancelar</button>
                <button onClick={executeDelete} className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-lg shadow-red-600/30 flex items-center gap-2 transition-all transform active:scale-95"><Trash2 size={18} /> SÍ, ELIMINAR</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponente StatsCard extraído para limpieza
const StatsCard = ({ label, value, icon: Icon, color }) => {
  const colorClasses = {
    red: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20",
    blue: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20",
    green: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20",
    gray: "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-700"
  };
  
  // Extraemos la clase base del color
  const baseColor = colorClasses[color] || colorClasses.gray;
  // Para el texto del título/valor usamos lógica separada si es necesario, 
  // pero aquí reutilizamos el color principal para el valor.
  
  return (
    <div className="bg-white dark:bg-gray-800 p-3 md:p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col justify-center transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-xs md:text-sm font-medium uppercase ${color === 'gray' ? 'text-gray-600 dark:text-gray-400' : baseColor.split(' ')[0]}`}>{label}</p>
          <p className={`text-xl md:text-2xl font-bold mt-1 ${color === 'gray' ? 'text-gray-900 dark:text-white' : baseColor.split(' ')[0]}`}>{value}</p>
        </div>
        <Icon className={`w-6 h-6 md:w-8 md:h-8 opacity-50 ${baseColor.split(' ')[0]}`} />
      </div>
    </div>
  );
};

export default Users;