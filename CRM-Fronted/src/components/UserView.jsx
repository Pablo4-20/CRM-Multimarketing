import { useState } from 'react';
import { 
  FiShield, FiUser, FiMail, FiSearch, 
  FiFilter, FiMoreVertical, FiUserPlus 
} from 'react-icons/fi';

const UsersView = () => {
  // Estado base de usuarios
  const [users, setUsers] = useState([
    { id: 1001, name: 'Carlos Mendoza', email: 'carlos@crmmasivo.com', role: 'super-admin', status: 'Activo' },
    { id: 1002, name: 'Ana Gómez', email: 'ana.gomez@crmmasivo.com', role: 'admin', status: 'Activo' },
    { id: 1003, name: 'Luis Peralta', email: 'luis.agente@crmmasivo.com', role: 'agente', status: 'Inactivo' },
  ]);
  
  // Estado para el formulario
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'agente' });

  // Guardar un nuevo usuario
  const handleCreateUser = (e) => {
    e.preventDefault();
    if (!newUser.name || !newUser.email) return;

    const userToAdd = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      status: 'Activo'
    };

    setUsers([userToAdd, ...users]); // Agrega al inicio
    setNewUser({ name: '', email: '', role: 'agente' }); // Limpia el formulario
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super-admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Super Admin</span>;
      case 'admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Admin</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Agente</span>;
    }
  };

  return (
    <div className="animate-fadeIn flex flex-col xl:flex-row gap-6">
      
      {/* ======================= COLUMNA IZQUIERDA: FORMULARIO ======================= */}
      <div className="w-full xl:w-1/3 flex flex-col gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden sticky top-6">
          <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-xl shrink-0">
              <FiUserPlus />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 m-0">Nuevo Usuario</h3>
              <p className="text-xs text-slate-500 mt-0.5">Registra un miembro del equipo</p>
            </div>
          </div>

          <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-5">
            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="text" placeholder="Ej. Juan Pérez" required
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Correo Electrónico</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-3.5 text-slate-400" />
                <input 
                  type="email" placeholder="juan@crm.com" required
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel de Acceso</label>
              <div className="relative">
                <FiShield className="absolute left-3 top-3.5 text-slate-400 z-10" />
                <select 
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-semibold text-slate-700 cursor-pointer appearance-none relative"
                >
                  <option value="super-admin">👑 Super-Admin (Total)</option>
                  <option value="admin">💼 Admin (Gestor)</option>
                  <option value="agente">🎧 Agente (Ventas)</option>
                </select>
              </div>
            </div>

            <button 
              type="submit"
              className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md shadow-blue-200 transition-all"
            >
              Crear Usuario
            </button>
          </form>
        </div>
      </div>

      {/* ======================= COLUMNA DERECHA: TABLA ======================= */}
      <div className="w-full xl:w-2/3">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          
          {/* Controles de la tabla */}
          <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white">
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Personal</h3>
            
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                <input 
                  type="text" 
                  placeholder="Buscar usuario..." 
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <FiFilter /> Filtros
              </button>
            </div>
          </div>

          {/* Tabla de Datos */}
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
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-sm shrink-0">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400">ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-600 font-medium">{user.email}</div>
                      <span className={`inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider ${user.status === 'Activo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Activo' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                        {user.status}
                      </span>
                    </td>
                    <td className="p-4">{getRoleBadge(user.role)}</td>
                    <td className="p-4 text-center">
                      <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiMoreVertical size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Paginación */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center text-sm text-slate-500">
              <span>Total: <strong className="text-slate-800">{users.length}</strong> usuarios</span>
              <div className="flex gap-1">
                <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Anterior</button>
                <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Siguiente</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default UsersView;