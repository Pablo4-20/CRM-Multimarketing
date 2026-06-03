import { useState } from 'react';
import { 
  FiShield, FiUser, FiMail, FiSearch, 
  FiFilter, FiMoreVertical, FiPlus, FiX, FiChevronDown, FiLock
} from 'react-icons/fi';

const UserView = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [users, setUsers] = useState([
    { id: 1001, name: 'Carlos Mendoza', email: 'carlos@crmmasivo.com', role: 'super-admin', status: 'Activo' },
    { id: 1002, name: 'Ana Gómez', email: 'ana.gomez@crmmasivo.com', role: 'admin', status: 'Activo' },
    { id: 1003, name: 'Luis Peralta', email: 'luis.agente@crmmasivo.com', role: 'agente', status: 'Inactivo' },
  ]);
  
  // 1. Agregamos 'password' al estado inicial
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'agente' });

  const handleCreateUser = (e) => {
    e.preventDefault();
    // 2. Validamos que la contraseña también esté presente
    if (!newUser.name || !newUser.email || !newUser.password) return;

    const userToAdd = {
      id: Math.floor(Math.random() * 9000) + 1000,
      name: newUser.name,
      email: newUser.email,
      // Nota: En un entorno real, la contraseña no se guarda en el estado visible de la tabla, 
      // se envía al backend cifrada. Aquí solo la usamos para el registro.
      role: newUser.role,
      status: 'Activo'
    };

    setUsers([userToAdd, ...users]); 
    // 3. Limpiamos el campo de contraseña al guardar
    setNewUser({ name: '', email: '', password: '', role: 'agente' }); 
    setIsModalOpen(false); 
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super-admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-red-100 text-red-700">Super Admin</span>;
      case 'admin': return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-700">Admin</span>;
      default: return <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-100 text-blue-700">Agente</span>;
    }
  };

  return (
    <div className="animate-fadeIn w-full">
      
      {/* ======================= TABLA PRINCIPAL ======================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Personal</h3>
            <p className="text-xs text-slate-500 mt-1">Gestiona los accesos de tu equipo</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input 
                type="text" 
                placeholder="Buscar usuario..." 
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all box-border"
              />
            </div>
            
            <button className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 bg-white rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors w-full sm:w-auto shrink-0">
              <FiFilter /> Filtros
            </button>

            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm w-full sm:w-auto shrink-0"
            >
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
              {users.map((user) => (
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
          
          <div className="p-4 border-t border-slate-200 bg-white flex flex-col sm:flex-row justify-between items-center text-sm text-slate-500 gap-3">
            <span>Total: <strong className="text-slate-800">{users.length}</strong> usuarios</span>
            <div className="flex gap-1 shrink-0">
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed hover:bg-slate-50 transition-colors">Anterior</button>
              <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed hover:bg-slate-50 transition-colors">Siguiente</button>
            </div>
          </div>
        </div>
      </div>

      {/* ======================= MODAL EMERGENTE ======================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiShield className="text-blue-600" /> Registrar Personal
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm transition-colors"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nombre Completo</label>
                <div className="relative">
                  <FiUser className="absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    type="text" placeholder="Ej. Juan Pérez" required
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium box-border"
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium box-border"
                  />
                </div>
              </div>

              {/* 4. Nuevo campo: Contraseña */}
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Contraseña Temporal</label>
                <div className="relative">
                  <FiLock className="absolute left-3 top-3.5 text-slate-400" />
                  <input 
                    type="password" placeholder="••••••••" required
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium box-border"
                  />
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase tracking-wide">Nivel de Acceso</label>
                <div className="relative">
                  <FiShield className="absolute left-3 top-3.5 text-slate-400 z-10 pointer-events-none" />
                  <select 
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-semibold text-slate-700 cursor-pointer appearance-none box-border relative"
                  >
                    <option value="super-admin">👑 Super-Admin (Total)</option>
                    <option value="admin">💼 Admin (Gestor)</option>
                    <option value="agente">🎧 Agente (Ventas)</option>
                  </select>
                  <FiChevronDown className="absolute right-3 top-3.5 text-slate-500 pointer-events-none" />
                </div>
              </div>

              <div className="flex gap-3 mt-4 border-t border-slate-100 pt-5">
                <button 
                  type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-200 transition-colors"
                >
                  Guardar
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