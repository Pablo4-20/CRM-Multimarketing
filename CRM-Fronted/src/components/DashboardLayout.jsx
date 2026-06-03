import { useState, useEffect } from 'react';

const DashboardLayout = ({ onLogout }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar el reloj cada minuto
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Formatear la fecha y hora
  const formatTime = (date) => {
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  };
  const formatDate = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();
  };

  const stats = [
    { title: 'CLIENTES', value: '1,245', tag: 'Activos este mes', borderClass: 'border-blue-500', icon: '👥' },
    { title: 'VENTAS', value: '348', tag: 'Completadas', borderClass: 'border-green-500', icon: '💰' },
    { title: 'CAMPAÑAS', value: '12', tag: 'En ejecución', borderClass: 'border-purple-500', icon: '📢' },
    { title: 'SOPORTE', value: '5', tag: 'Tickets abiertos', borderClass: 'border-orange-500', icon: '🎫' }
  ];

  const actions = [
    { title: 'Gestionar Clientes', desc: 'Crear, editar o eliminar registros.', bgClass: 'bg-blue-500', icon: '👥' },
    { title: 'Nuevas Campañas', desc: 'Lanzar promociones masivas.', bgClass: 'bg-orange-500', icon: '📧' },
    { title: 'Catálogo Productos', desc: 'Administrar stock y precios.', bgClass: 'bg-purple-500', icon: '📦' },
    { title: 'Métricas de Ventas', desc: 'Ver reportes de rendimiento.', bgClass: 'bg-pink-500', icon: '📈' }
  ];

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans">
      
      {/* ======================= SIDEBAR ======================= */}
      <div className={`${isCollapsed ? 'w-20' : 'w-[260px]'} bg-white border-r border-slate-200 transition-all duration-300 flex flex-col overflow-hidden shrink-0`}>
        
        {/* Top del Sidebar */}
        <div className={`p-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && <span className="font-bold text-xl text-blue-900">Panel CRM</span>}
          <button 
            onClick={toggleSidebar} 
            className="bg-slate-100 hover:bg-slate-200 text-slate-500 w-8 h-8 rounded-md flex items-center justify-center transition-colors"
          >
            {isCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>
        
        {/* Menú de Navegación */}
        <ul className="flex-1 px-4 flex flex-col gap-2 m-0 list-none">
          <li className="px-4 py-3 bg-blue-50 text-blue-600 rounded-lg cursor-pointer flex items-center gap-3 font-semibold">
            <span className="text-xl">🏠</span> {!isCollapsed && 'Inicio'}
          </li>
          <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
            <span className="text-xl">👥</span> {!isCollapsed && 'Clientes'}
          </li>
          <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
            <span className="text-xl">📊</span> {!isCollapsed && 'Reportes'}
          </li>
          <li className="px-4 py-3 text-slate-500 hover:bg-slate-50 rounded-lg cursor-pointer flex items-center gap-3 font-medium transition-colors">
            <span className="text-xl">⚙️</span> {!isCollapsed && 'Configuración'}
          </li>
        </ul>

        {/* Perfil de Usuario y Logout */}
        <div className={`p-5 border-t border-slate-200 flex items-center gap-3 ${isCollapsed ? 'justify-center' : 'justify-start'}`}>
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
            className="text-red-500 hover:text-red-700 p-1 text-xl transition-colors"
          >
             🚪
          </button>
        </div>
      </div>

      {/* ======================= MAIN CONTENT ======================= */}
      <div className="flex-1 p-10 overflow-y-auto">
        
        {/* Cabecera Oscura */}
        <div className="bg-slate-800 rounded-2xl p-8 flex flex-col md:flex-row justify-between md:items-center text-white mb-8 shadow-lg gap-6">
          <div>
            <div className="text-xs text-slate-400 font-bold tracking-wider mb-2">⚙️ ADMINISTRACIÓN</div>
            <h1 className="m-0 text-3xl font-bold">Hola, Administrador</h1>
            <p className="mt-2 text-slate-300">Aquí tienes el resumen de hoy en tu CRM.</p>
          </div>
          
          {/* Reloj */}
          <div className="bg-slate-700 p-4 px-6 rounded-xl text-center min-w-[150px]">
            <div className="text-slate-400 mb-1">🕒</div>
            <div className="text-2xl font-bold mb-1">{formatTime(currentTime)}</div>
            <div className="text-[10px] text-slate-300 tracking-wider">{formatDate(currentTime)}</div>
          </div>
        </div>

        {/* Tarjetas de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {stats.map((stat, i) => (
            <div key={i} className={`bg-white rounded-2xl p-6 relative shadow-sm border-b-4 ${stat.borderClass}`}>
              <div className="text-xs font-bold text-slate-400 tracking-wide">{stat.title}</div>
              <div className="text-4xl font-bold text-slate-900 my-2">{stat.value}</div>
              <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium inline-block">{stat.tag}</div>
              <div className="absolute top-6 right-6 text-4xl opacity-10">{stat.icon}</div>
            </div>
          ))}
        </div>

        {/* Sección de Gestión Rápida */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-yellow-500 text-xl">✨</span>
          <h2 className="text-xl font-bold text-slate-800 m-0">Gestión Rápida</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {actions.map((action, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 flex items-center gap-4 cursor-pointer shadow-sm border border-slate-100 hover:shadow-md transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white text-2xl shrink-0 ${action.bgClass}`}>
                {action.icon}
              </div>
              <div className="flex-1">
                <div className="text-sm font-bold text-slate-900 mb-1">{action.title}</div>
                <div className="text-xs text-slate-500">{action.desc}</div>
              </div>
              <div className="text-slate-300 font-bold">→</div>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default DashboardLayout;