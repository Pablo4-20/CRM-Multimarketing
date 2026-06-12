import { useState, useEffect } from 'react';
import { 
  FiShield, FiUser, FiMail, FiSearch, 
  FiFilter, FiPlus, FiX, FiChevronDown, FiLock,
  FiEdit2, FiTrash2, FiAlertTriangle, FiCheckCircle,
  FiEye, FiEyeOff, FiUploadCloud, FiDownload, FiFileText
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import api from '../api';

const UserView = () => {
  const [users, setUsers] = useState([]);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Estados para manejar los datos
  const [editingUser, setEditingUser] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);
  const [transferUserId, setTransferUserId] = useState('');
  
  // Estados para Carga Masiva
  const [selectedFile, setSelectedFile] = useState(null);
  const [importError, setImportError] = useState(null);

  // Estados de filtros y ordenamiento
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // NUEVO: Estado de ordenamiento

  // Estado para alternar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);

  // Estado del formulario
  const [formData, setFormData] = useState({ 
    name: '', email: '', password: '', role: 'agente', status: 'Activo' 
  });

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

  // Lógica de filtrado
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === '' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // NUEVO: Lógica de Ordenamiento
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (sortOrder === 'az') return a.name.localeCompare(b.name);
    if (sortOrder === 'za') return b.name.localeCompare(a.name);
    if (sortOrder === 'newest') return b.id - a.id;
    if (sortOrder === 'oldest') return a.id - b.id;
    return 0;
  });

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setSortOrder('newest'); // Reinicia el orden
  };

  // 2. Manejadores de Modales
  const openCreateModal = () => {
    setEditingUser(null);
    setErrorMessage(null);
    setShowPassword(false);
    setFormData({ name: '', email: '', password: '', role: 'agente', status: 'Activo' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setErrorMessage(null);
    setShowPassword(false);
    setFormData({ 
      name: user.name, 
      email: user.email, 
      password: '',
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

  const openUploadModal = () => {
    setSelectedFile(null);
    setImportError(null);
    setIsUploadModalOpen(true);
  };

  // 3. Crear o Editar Usuario Manualmente
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
        setSuccessMessage("Usuario actualizado exitosamente.");
      } else {
        await api.post('/users', formData);
        setSuccessMessage("Usuario creado exitosamente.");
      }

      fetchUsers(); 
      setIsModalOpen(false);
      setErrorMessage(null);
      
      setTimeout(() => setSuccessMessage(null), 3500);
      
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

  // 4. Procesar Carga Masiva (Excel)
  const handleUploadSave = (e) => {
    e.preventDefault();
    setImportError(null);

    if (!selectedFile) {
      setImportError("Debes seleccionar un archivo Excel para continuar.");
      return; 
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const usuariosAEnviar = [];

        jsonData.forEach((row) => {
          const name = row['Usuario'] || row['usuario'] || row['Nombre'] || row['nombre'] || '';
          const email = row['Contacto'] || row['contacto'] || row['Email'] || row['email'] || '';
          const password = row['Contraseña'] || row['contraseña'] || row['Password'] || row['password'] || '';
          const role = row['Rol'] || row['rol'] || 'agente'; 
          
          if (name && email && password) {
            usuariosAEnviar.push({ 
              name: String(name).trim(), 
              email: String(email).trim(), 
              password: String(password).trim(),
              role: String(role).trim()
            });
          }
        });

        if (usuariosAEnviar.length > 0) {
          await api.post('/users/masivo', { usuarios: usuariosAEnviar });
          await fetchUsers(); 
          setSuccessMessage(`Se importaron los usuarios correctamente.`);
          setTimeout(() => setSuccessMessage(null), 4000);
          
          setIsUploadModalOpen(false);
          setSelectedFile(null);
        } else {
          setImportError("El archivo Excel no contiene registros válidos o faltan columnas requeridas (Usuario, Contacto, Contraseña).");
        }
      } catch (error) {
        console.error("Error leyendo Excel:", error);
        if (error.response && error.response.data?.errors) {
          setImportError(Object.values(error.response.data.errors).flat().join(' | '));
        } else {
          setImportError("Hubo un error al procesar o conectar con el servidor. Verifica que no haya correos duplicados.");
        }
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const datosEjemplo = [
      { Usuario: "Alejandro Real", Contacto: "alejandro@ejemplo.com", Contraseña: "Segura123*", Rol: "agente" },
      { Usuario: "Gabriela Silva", Contacto: "gabriela@ejemplo.com", Contraseña: "Admin987#", Rol: "admin" }
    ];

    const hoja = XLSX.utils.json_to_sheet(datosEjemplo);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Usuarios");
    XLSX.writeFile(libro, "Plantilla_Carga_Usuarios.xlsx");
  };

  // 5. Eliminar Usuario y Transferir Datos
  const handleDelete = async (e) => {
    e.preventDefault();
    try {
      await api.delete(`/users/${userToDelete.id}`, {
        data: { transfer_to_user_id: transferUserId || null }
      });
      
      fetchUsers(); 
      setIsDeleteModalOpen(false);
      setTransferUserId(''); 

      if (transferUserId) {
        setSuccessMessage("Usuario eliminado y todo su historial fue transferido exitosamente.");
      } else {
        setSuccessMessage("Usuario eliminado exitosamente.");
      }

      setTimeout(() => setSuccessMessage(null), 3500);

    } catch (error) {
      console.error("Error al eliminar el usuario:", error);
      setErrorMessage("Hubo un error al intentar eliminar el usuario.");
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
    <div className="animate-fadeIn w-full relative">
      
      {/* NOTIFICACIÓN FLOTANTE DE ÉXITO */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 bg-emerald-50 border-l-4 border-emerald-500 text-emerald-800 p-4 rounded-lg shadow-lg z-[100] animate-slideUp flex items-center gap-3">
          <FiCheckCircle className="text-emerald-500 text-xl shrink-0" />
          <p className="font-semibold text-sm">{successMessage}</p>
        </div>
      )}

      {/* ======================= TABLA DE USUARIOS ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Personal</h3>
            <p className="text-xs text-slate-500 mt-1">Gestiona los accesos de tu equipo</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
            {/* INPUT DE BÚSQUEDA POR NOMBRE */}
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
              />
            </div>
            
            {/* SELECTOR DE ROL */}
            <div className="relative w-full sm:w-40">
              <FiFilter className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <select 
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none box-border text-slate-600 font-medium"
              >
                <option value="">Todos los roles</option>
                <option value="super-admin">Super Admin</option>
                <option value="admin">Admin</option>
                <option value="agente">Agente</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>

            {/* NUEVO: SELECTOR DE ORDENAMIENTO (A-Z, Fechas) */}
            <div className="relative w-full sm:w-44">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none box-border text-slate-600 font-medium"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="az">Nombre (A - Z)</option>
                <option value="za">Nombre (Z - A)</option>
              </select>
              <FiChevronDown className="absolute right-3 top-3 text-slate-500 pointer-events-none" />
            </div>

            {/* BOTÓN LIMPIAR FILTROS */}
            {(searchTerm || roleFilter || sortOrder !== 'newest') && (
              <button 
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors w-full sm:w-auto"
                title="Limpiar filtros"
              >
                <FiX /> Limpiar
              </button>
            )}

            <button 
              onClick={openUploadModal}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiUploadCloud className="text-lg" /> Carga Masiva
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
              {sortedUsers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-8 text-slate-400">
                    {users.length === 0 ? 'No hay usuarios o no hay conexión con Laravel.' : 'No se encontraron usuarios con esos filtros.'}
                  </td>
                </tr>
              ) : sortedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.charAt(0).toUpperCase()}
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
              
              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-sm" role="alert">
                  <div className="flex items-center">
                    <span className="text-xl mr-2">⚠️</span>
                    <p className="font-medium text-sm">{errorMessage}</p>
                  </div>
                </div>
              )}

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
                  <input 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    required={!editingUser} 
                    value={formData.password} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none text-sm font-medium transition-all box-border" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                  </button>
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

      {/* ======================= MODAL: CARGA MASIVA DE EXCEL ======================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 m-0 flex items-center gap-2">
                <FiUploadCloud className="text-emerald-600" /> Importar Usuarios
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSave} className="p-6 flex flex-col gap-4">
              {importError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3.5 rounded text-xs font-medium flex gap-2 items-start animate-fadeIn">
                  <FiAlertTriangle className="text-base shrink-0 mt-0.5" />
                  <span className="break-words">{importError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-2xl p-6 text-center hover:bg-emerald-50 transition-colors">
                <FiFileText className="text-3xl text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Sube tu archivo .xlsx o .xls</p>
                <p className="text-xs text-slate-500 mb-3">Columnas requeridas: Usuario, Contacto, Contraseña, Rol</p>
                
                <label className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-emerald-50 shadow-sm inline-block">
                  Seleccionar Archivo
                  <input type="file" required accept=".xlsx, .xls" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </label>
              </div>

              <div className="flex justify-center -mt-1">
                <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  <FiDownload /> Descargar plantilla de ejemplo oficial
                </button>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                  <span className="truncate pr-4 font-medium">📄 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700"><FiX /></button>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!selectedFile || isLoading} className={`flex-1 p-2.5 font-semibold rounded-xl text-sm transition-colors ${selectedFile ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  {isLoading ? 'Procesando...' : 'Procesar Carga'}
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