import { 
  FiHome, FiUserCheck, FiUsers, FiBarChart2, 
  FiSettings, FiLogOut, FiChevronLeft, FiChevronRight, FiTag, FiCheckSquare, FiUser
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed, toggleSidebar, activeTab, setActiveTab, onLogout, user }) => {
  const initial = user?.name ? user.name.charAt(0).toUpperCase() : 'U';
  
  // Variable para saber si es administrador
  const isAdmin = user?.role === 'super-admin' || user?.role === 'admin';

  return (
    // CAMBIO IMPORTANTE: Añadí h-screen para que el menú ocupe el alto total de la ventana
    <div className={`${isCollapsed ? 'w-20' : 'w-[260px]'} bg-white border-r border-slate-200 h-screen transition-all duration-300 flex flex-col shrink-0 z-10`}>
      
      {/* 1. CABECERA (Fija arriba) */}
      <div className={`p-6 flex items-center shrink-0 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="font-bold text-xl text-blue-900 truncate">Panel CRM</span>}
        <button onClick={toggleSidebar} className="bg-slate-100 hover:bg-slate-200 text-slate-500 w-8 h-8 rounded-md flex items-center justify-center transition-colors shrink-0">
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>
      
      {/* 2. NAVEGACIÓN (Hace scroll solo esta parte si hay muchos items) */}
      <ul className="flex-1 px-4 flex flex-col gap-2 m-0 list-none overflow-y-auto overflow-x-hidden custom-scrollbar">
        
        {/* VISTA COMPARTIDA (Todos pueden ver) */}
        <li 
          onClick={() => setActiveTab('inicio')}
          className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'inicio' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FiHome className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Inicio</span>}
        </li>

        <li 
          onClick={() => setActiveTab('mis_clientes')}
          className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'mis_clientes' ? 'bg-teal-50 text-teal-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FiUser className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Mis Clientes</span>}
        </li>

        {/* VISTAS EXCLUSIVAS PARA ADMINISTRADORES */}
        {isAdmin && (
          <>
            <div className="mt-4 mb-2 px-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
              {!isCollapsed && "Administración"}
            </div>

            <li onClick={() => setActiveTab('usuarios')} className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'usuarios' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FiUserCheck className="text-xl shrink-0" />
              {!isCollapsed && <span className="truncate">Gestión Usuarios</span>}
            </li>
            
            <li onClick={() => setActiveTab('asignaciones')} className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'asignaciones' ? 'bg-slate-800 text-white font-semibold shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FiCheckSquare className="text-xl shrink-0" />
              {!isCollapsed && <span className="truncate">Asignaciones</span>}
            </li>

            <li onClick={() => setActiveTab('campanas')} className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'campanas' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="text-xl shrink-0" height="1em" width="1em"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              {!isCollapsed && <span className="truncate">Campañas</span>}
            </li>
            
            <li onClick={() => setActiveTab('estados')} className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'estados' ? 'bg-amber-50 text-amber-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FiTag className="text-xl shrink-0" />
              {!isCollapsed && <span className="truncate">Estados</span>}
            </li>

            <li onClick={() => setActiveTab('clientes')} className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors shrink-0 ${activeTab === 'clientes' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}>
              <FiUsers className="text-xl shrink-0" />
              {!isCollapsed && <span className="truncate">Clientes Generales</span>}
            </li>
            
          </>
        )}
      </ul>

      {/* 3. PERFIL / CERRAR SESIÓN (Fijo abajo, nunca hace scroll) */}
      <div className={`p-5 border-t border-slate-200 mt-auto shrink-0 flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : 'justify-start'}`}>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0 shadow-md">
          {initial}
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate">{user?.name}</div>
            <div className="text-xs text-slate-500 truncate">{user?.email}</div>
          </div>
        )}
        <button onClick={onLogout} title="Cerrar Sesión" className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-colors flex items-center justify-center shrink-0">
          <FiLogOut className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;