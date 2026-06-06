import { useState, useEffect } from 'react';
import { 
  FiShield, FiUser, FiMail, FiSearch, 
  FiFilter, FiPlus, FiX, FiChevronDown, FiLock,
  FiEdit2, FiTrash2, FiAlertTriangle
} from 'react-icons/fi';
import api from '../api';

const UserView = () => {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Estados para manejar los datos
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [transferUserId, setTransferUserId] = useState('');
  
  // Estado del formulario
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'agente', status: 'Activo' 
  });

  // URL de tu API de Laravel (Asegúrate de tener php artisan serve corriendo)
  

  // 1. Cargar usuarios desde Laravel al iniciar
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data);
    } catch (error) {
      console.error("Error al conectar con la API:", error);
    }
  };

  // 2. Manejadores de Modales
  const openCreateModal = () => {
    setEditingUser(null);
    setErrorMessage(null); // Limpiamos errores al abrir
    setFormData({ name: '', email: '', password: '', role: 'agente', status: 'Activo' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setErrorMessage(null); // Limpiamos errores al abrir
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '', // La contraseña se deja en blanco por seguridad
      role: user.role, 
      status: user.status || 'Activo' 
    });
    setIsModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setUserToDelete(user);
    setTransferUserId('');
    setIsDeleteModalOpen(true);
  };

  // 3. Crear o Editar Usuario
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!editingUser || formData.password) {
      if (formData.password.length < 6) {
        setErrorMessage("La contraseña debe tener al menos 6 caracteres.");
        return;
      }
    }

    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, formData);
      } else {
        await api.post('/users', formData);
      }

      fetchUsers(); 
      setIsModalOpen(false);
      setErrorMessage(null);
      
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const errorData = error.response.data;
        const errorMessages = Object.values(errorData.errors).flat().join(' | ');
        setErrorMessage(`No se pudo guardar: ${errorMessages}`);
      } else {
        console.error("Error al guardar el usuario:", error);
        setErrorMessage("Hubo un error de conexión al guardar el usuario.");
      }
    }
  };

  // 4. Eliminar Usuario y Transferir Datos (Conectado a Laravel)
  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      // Axios envía el body en peticiones DELETE usando la propiedad "data"
      await api.delete(`/users/${userToDelete.id}`, {
        data: { transfer_to_user_id: transferUserId || null }
      });
      fetchUsers(); 
      setIsDeleteModalOpen(false);
    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
    }
  };

  // Diseño visual de los roles
  const getRoleBadge = (role) => {
    switch (role) {
      case 'super-admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Super Admin</span>;
      case 'admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Admin</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Agente</span>;
    }
  };

  return (
    <div className="animate-fadeIn w-full">
      
      {/* ======================= TABLA DE USUARIOS ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Personal</h3>
            <p className="text-xs text-slate-500 mt-1">Gestiona los accesos de tu equipo</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input type="text" placeholder="Buscar usuario..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"/>
            </div>
            
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto">
              <FiFilter /> Filtros
            </button>

            <button onClick={openCreateModal} className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm w-full sm:w-auto shrink-0">
              <FiPlus className="text-lg" /> Nuevo Usuario
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">Usuario</th>
                <th className="p-4">Contacto</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {users.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-slate-400">No hay usuarios o no hay conexión con Laravel.</td></tr>
              ) : users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0)}
                      </div>
                      <div className="min-w-0 overflow-hidden">
                        <div className="font-semibold text-slate-900 truncate">{user.name}</div>
                        <div className="text-xs text-slate-400">ID: #{user.id}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-slate-600 font-medium truncate">{user.email}</div>
                    <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${user.status === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {user.status || 'Activo'}
                    </span>
                  </td>
                  <td className="p-4">{getRoleBadge(user.role)}</td>
                  
                  {/* BOTONES DE EDICIÓN Y ELIMINACIÓN */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(user)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(user)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= MODAL: CREAR/EDITAR USUARIO ======================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiShield className="text-blue-600" /> {editingUser ? 'Editar Personal' : 'Registrar Personal'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm transition-colors">
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
              
              {/* ================= NUEVO: ALERTA DE ERROR VISUAL ================= */}
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⚠️</span>
                    <p className="font-medium text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}
              {/* ================================================================= */}

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="text" placeholder="Ej. Juan Pérez" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium transition-all box-border" />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Correo Electrónico</label>
                <div className="relative">
                  <FiMail className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="email" placeholder="juan@crm.com" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium transition-all box-border" />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">
                  {editingUser ? 'Nueva Contraseña (Opcional)' : 'Contraseña Temporal'}
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3.5 text-slate-400" />
                  <input type="password" placeholder="••••••••" required={!editingUser} value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium transition-all box-border" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Rol</label>
                  <div className="relative">
                    <FiShield className="absolute left-3 top-3.5 text-slate-400 z-10 pointer-events-none" />
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-semibold text-slate-700 appearance-none box-border">
                      <option value="super-admin">👑 Super</option>
                      <option value="admin">💼 Admin</option>
                      <option value="agente">🎧 Agente</option>
                    </select>
                    <FiChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
                  </div>
                </div>

                {editingUser && (
                  <div>
                    <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Estado</label>
                    <div className="relative">
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 appearance-none box-border">
                        <option value="Activo">🟢 Activo</option>
                        <option value="Inactivo">🔴 Inactivo</option>
                      </select>
                      <FiChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-4 border-t border-slate-100 pt-5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-200 transition-colors">
                  {editingUser ? 'Actualizar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ELIMINAR CON TRANSFERENCIA ======================= */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-6 bg-red-50 border-b border-red-100 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mb-3">
                <FiAlertTriangle />
              </div>
              <h3 className="text-lg font-bold text-red-900 m-0">¿Eliminar a {userToDelete.name}?</h3>
              <p className="text-xs text-red-600 mt-1">Esta acción no se puede deshacer.</p>
            </div>

            <form onSubmit={handleDelete} className="p-6 flex flex-col gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <label className="block mb-2 text-sm font-bold text-slate-700">
                  Transferir datos asignados a:
                </label>
                <p className="text-xs text-slate-500 mb-3">
                  Si este usuario tiene clientes o ventas, puedes transferirlos a otro miembro antes de eliminarlo.
                </p>
                <div className="relative">
                  <select 
                    value={transferUserId}
                    onChange={(e) => setTransferUserId(e.target.value)}
                    className="w-full pl-3 pr-8 py-2.5 rounded-lg border border-slate-300 bg-white focus:border-blue-500 outline-none text-sm font-medium text-slate-700 appearance-none box-border"
                  >
                    <option value="">No transferir (Se perderán los datos)</option>
                    {/* Lista todos los usuarios MENOS el que se va a eliminar */}
                    {users.filter(u => u.id !== userToDelete.id).map(u => (
                      <option key={u.id} value={u.id}>Transferir a: {u.name}</option>
                    ))}
                  </select>
                  <FiChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 p-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-red-200 transition-colors">
                  Eliminar Definitivamente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default UserView;