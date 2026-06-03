import { 
  FiHome, FiUserCheck, FiUsers, FiBarChart2, 
  FiSettings, FiLogOut, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';

const Sidebar = ({ isCollapsed, toggleSidebar, activeTab, setActiveTab, onLogout }) => {
  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-[260px]'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col overflow-hidden shrink-0 z-10`}>
      
      {/* Top del Sidebar */}
      <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="font-bold text-xl text-blue-900 truncate">Panel CRM</span>}
        <button 
          onClick={toggleSidebar} 
          className="bg-slate-100 hover:bg-slate-200 text-slate-500 w-8 h-8 rounded-md flex items-center justify-center transition-colors shrink-0"
        >
          {isCollapsed ? <FiChevronRight size={18} /> : <FiChevronLeft size={18} />}
        </button>
      </div>
      
      {/* Menú de Navegación */}
      <ul className="flex-1 px-4 flex flex-col gap-2 m-0 list-none">
        <li 
          onClick={() => setActiveTab('inicio')}
          className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors ${activeTab === 'inicio' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FiHome className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Inicio</span>}
        </li>

        <li 
          onClick={() => setActiveTab('usuarios')}
          className={`px-4 py-3 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors ${activeTab === 'usuarios' ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-500 hover:bg-slate-50'}`}
        >
          <FiUserCheck className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Gestión Usuarios</span>}
        </li>

        <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
          <FiUsers className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Clientes</span>}
        </li>
        <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
          <FiBarChart2 className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Reportes</span>}
        </li>
        <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
          <FiSettings className="text-xl shrink-0" />
          {!isCollapsed && <span className="truncate">Configuración</span>}
        </li>
      </ul>

      {/* Perfil de Usuario y Logout */}
      <div className={`p-5 border-t border-slate-200 flex items-center gap-3 ${isCollapsed ? 'justify-center flex-col' : 'justify-start'}`}>
        <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold shrink-0">
          A
        </div>
        {!isCollapsed && (
          <div className="flex-1 overflow-hidden">
            <div className="text-sm font-bold text-slate-900 truncate">Admin Sistema</div>
            <div className="text-xs text-slate-500 truncate">admin@crm.com</div>
          </div>
        )}
        <button 
          onClick={onLogout} 
          title="Cerrar Sesión" 
          className="text-red-500 hover:text-white hover:bg-red-500 p-2 rounded-lg transition-colors flex items-center justify-center"
        >
          <FiLogOut className="text-lg" />
        </button>
      </div>
    </div>
  );
};

export default Sidebar;