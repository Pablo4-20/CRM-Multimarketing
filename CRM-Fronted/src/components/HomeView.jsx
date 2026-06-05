import { useState, useEffect } from 'react';
import { 
  FiUsers, FiVolume2, FiActivity, FiUser, 
  FiZap, FiUserCheck, FiPackage, FiTrendingUp, FiArrowRight 
} from 'react-icons/fi';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#10b981', '#14b8a6', '#0ea5e9'];

const HomeView = ({ setActiveTab, user }) => {
  const [statsData, setStatsData] = useState({
    clientes: 0,
    campanas: 0,
    estados: 0,
    usuarios: 0,
    agentes_chart: []
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/dashboard-stats');
        
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const data = await response.json();
          if (response.ok) {
            setStatsData(data);
          } else {
            console.error("Error SQL del backend:", data.message);
          }
        } else {
          console.error("El servidor no devolvió JSON.");
        }
      } catch (error) {
        console.error("Error de conexión:", error);
      }
    };

    fetchStats();
  }, []);

  // ==========================================
  // MEJORA EN LA VALIDACIÓN DE ROLES
  // ==========================================
  // Obtenemos el rol, lo pasamos a minúsculas y le quitamos espacios extra
  const userRole = (user?.role || user?.rol || '').toLowerCase().trim();
  
  // Aceptamos cualquier variación de Admin o Super Admin
  const isAdminOrSuper = [
    'admin', 
    'super_admin', 
    'superadmin', 
    'super admin',
    'super-admin'
  ].includes(userRole);

  // ==========================================
  // CONFIGURACIÓN PARA ADMIN / SUPER ADMIN
  // ==========================================
  const adminStats = [
    { title: 'TOTAL CLIENTES', value: statsData.clientes, tag: 'Registrados en DB', borderClass: 'border-blue-500', icon: <FiUsers /> },
    { title: 'CAMPAÑAS', value: statsData.campanas, tag: 'Gestiones creadas', borderClass: 'border-purple-500', icon: <FiVolume2 /> },
    { title: 'ESTADOS', value: statsData.estados, tag: 'Tipos de estados', borderClass: 'border-green-500', icon: <FiActivity /> },
    { title: 'USUARIOS', value: statsData.usuarios, tag: 'Accesos al sistema', borderClass: 'border-orange-500', icon: <FiUser /> }
  ];

  const adminActions = [
    { title: 'Gestionar Clientes', desc: 'Crear, editar o eliminar.', bgClass: 'bg-blue-500', icon: <FiUsers />, tab: 'clientes' },
    { title: 'Control Usuarios', desc: 'Asignar roles y accesos.', bgClass: 'bg-indigo-500', icon: <FiUserCheck />, tab: 'usuarios' },
    { title: 'Administrar Campañas', desc: 'Ver campañas activas.', bgClass: 'bg-purple-500', icon: <FiPackage />, tab: 'campanas' },
    { title: 'Asignaciones Masivas', desc: 'Asignar clientes a agentes.', bgClass: 'bg-pink-500', icon: <FiTrendingUp />, tab: 'asignaciones' }
  ];

  // ==========================================
  // CONFIGURACIÓN PARA AGENTES
  // ==========================================
  const myClientCount = statsData.agentes_chart?.find(a => a.name === user?.name)?.value || 0;

  const agenteStats = [
    { title: 'MIS CLIENTES', value: myClientCount, tag: 'Asignados a mí', borderClass: 'border-blue-500', icon: <FiUsers /> }
  ];

  const agenteActions = [
    { title: 'Ver Mis Clientes', desc: 'Gestionar y contactar a mis clientes asignados.', bgClass: 'bg-blue-500', icon: <FiUsers />, tab: 'mis_clientes' }
  ];

  // Seleccionamos qué mostrar dependiendo del rol
  const currentStats = isAdminOrSuper ? adminStats : agenteStats;
  const currentActions = isAdminOrSuper ? adminActions : agenteActions;

  // Calculamos el total de clientes asignados para la dona
  const totalAsignados = (statsData.agentes_chart || []).reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="animate-fadeIn">
      
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10 ${isAdminOrSuper ? 'xl:grid-cols-4' : ''}`}>
        {currentStats.map((stat, i) => (
          <div key={i} className={`bg-white rounded-2xl p-6 relative shadow-sm border-b-4 ${stat.borderClass} overflow-hidden`}>
            <div className="text-xs font-bold text-slate-400 tracking-wide">{stat.title}</div>
            <div className="text-4xl font-bold text-slate-900 my-2">{stat.value}</div>
            <div className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-medium inline-block">{stat.tag}</div>
            <div className="absolute -bottom-2 -right-2 text-7xl text-slate-900 opacity-5">{stat.icon}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        
        <div className={`col-span-1 ${isAdminOrSuper ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
          <div className="flex items-center gap-2 mb-6">
            <FiZap className="text-yellow-500 text-xl fill-yellow-500" />
            <h2 className="text-xl font-bold text-slate-800 m-0">
              {isAdminOrSuper ? 'Gestión Rápida' : 'Mis Herramientas'}
            </h2>
          </div>

          <div className={`grid grid-cols-1 gap-6 ${isAdminOrSuper ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
            {currentActions.map((action, i) => (
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

        {/* --- GRÁFICA DE DONA (SÓLO ADMIN / SUPER ADMIN) --- */}
        {isAdminOrSuper && (
          <div className="col-span-1 bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-1">Distribución de Clientes</h2>
            <p className="text-xs text-slate-500 mb-6">Asignaciones actuales por agente</p>
            
            {statsData.agentes_chart && statsData.agentes_chart.length > 0 ? (
              <div className="flex-1 flex flex-col">
                <div className="relative h-[200px] w-full mb-6">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statsData.agentes_chart}
                        cx="50%"
                        cy="50%"
                        innerRadius={65}
                        outerRadius={85}
                        paddingAngle={6}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={8}
                      >
                        {statsData.agentes_chart.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900/95 backdrop-blur-sm text-white text-xs rounded-lg py-2 px-3 shadow-lg border border-slate-700/50">
                                <div className="flex items-center gap-2">
                                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[statsData.agentes_chart.findIndex(e => e.name === payload[0].name) % COLORS.length] }}></span>
                                  <span>{payload[0].name}: <span className="font-bold text-white ml-1">{payload[0].value} clientes</span></span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-slate-800 leading-none">{totalAsignados}</span>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mt-1">Total</span>
                  </div>
                </div>

                <div className="w-full max-h-32 overflow-y-auto pr-2 space-y-2" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 transparent' }}>
                  {statsData.agentes_chart.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-sm group">
                      <div className="flex items-center gap-3">
                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                        <span className="text-slate-600 font-medium truncate max-w-[140px] transition-colors group-hover:text-slate-900">
                          {entry.name}
                        </span>
                      </div>
                      <span className="text-slate-700 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md">
                        {entry.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                  <FiUsers className="text-2xl text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-500">No hay datos</p>
                <p className="text-xs">Aún no hay asignaciones</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomeView;