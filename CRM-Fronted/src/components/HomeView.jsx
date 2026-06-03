import { 
  FiUsers, FiDollarSign, FiVolume2, FiLifeBuoy, 
  FiZap, FiUserCheck, FiPackage, FiTrendingUp, FiArrowRight 
} from 'react-icons/fi';

const HomeView = ({ setActiveTab }) => {
  const stats = [
    { title: 'CLIENTES', value: '1,245', tag: 'Activos este mes', borderClass: 'border-blue-500', icon: <FiUsers /> },
    { title: 'VENTAS', value: '348', tag: 'Completadas', borderClass: 'border-green-500', icon: <FiDollarSign /> },
    { title: 'CAMPAÑAS', value: '12', tag: 'En ejecución', borderClass: 'border-purple-500', icon: <FiVolume2 /> },
    { title: 'SOPORTE', value: '5', tag: 'Tickets abiertos', borderClass: 'border-orange-500', icon: <FiLifeBuoy /> }
  ];

  const actions = [
    { title: 'Gestionar Clientes', desc: 'Crear, editar o eliminar.', bgClass: 'bg-blue-500', icon: <FiUsers />, tab: 'inicio' },
    { title: 'Control Usuarios', desc: 'Asignar roles y accesos.', bgClass: 'bg-indigo-500', icon: <FiUserCheck />, tab: 'usuarios' },
    { title: 'Catálogo Productos', desc: 'Administrar stock y precios.', bgClass: 'bg-purple-500', icon: <FiPackage />, tab: 'inicio' },
    { title: 'Métricas de Ventas', desc: 'Ver reportes de rendimiento.', bgClass: 'bg-pink-500', icon: <FiTrendingUp />, tab: 'inicio' }
  ];

  return (
    <div className="animate-fadeIn">
      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-6 relative shadow-sm border-b-4 ${stat.borderClass} overflow-hidden`}>
            <div className="text-xs font-bold text-slate-400 tracking-wide">{stat.title}</div>
            <div className="text-4xl font-bold text-slate-900 my-2">{stat.value}</div>
            <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium inline-block">{stat.tag}</div>
            <div className="absolute -bottom-2 -right-2 text-7xl text-slate-900 opacity-5">{stat.icon}</div>
          </div>
        ))}
      </div>

      {/* Sección de Gestión Rápida */}
      <div className="flex items-center gap-2 mb-6">
        <FiZap className="text-yellow-500 text-xl fill-yellow-500" />
        <h2 className="text-xl font-bold text-slate-800 m-0">Gestión Rápida</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {actions.map((action, i) => (
          <div 
            key={i} 
            onClick={() => action.tab !== 'inicio' && setActiveTab(action.tab)}
            className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer shadow-sm border border-slate-100 hover:shadow-md hover:border-slate-200 transition-all group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl shrink-0 ${action.bgClass} shadow-inner`}>
              {action.icon}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm font-bold text-slate-900 mb-1 truncate">{action.title}</div>
              <div className="text-xs text-slate-500 truncate">{action.desc}</div>
            </div>
            <FiArrowRight className="text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HomeView;