import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HomeView from './HomeView';
import UserView from './UserView';
import CampanasView from './CampanasView';
import EstadosView from './EstadosView';
import ClientesView from './ClientesView';
import AsignacionesView from './AsignacionesView';
import AgenteClientesView from './AgenteClientesView';
import SeguimientoAgentesView from './SeguimientoAgentesView';

const DashboardLayout = ({ onLogout, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // ================= CAMBIO AQUÍ =================
  // 1. Leemos el localStorage al cargar por primera vez
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('activeTabCRM');
    return savedTab ? savedTab : 'inicio';
  });

  // 2. Guardamos en el localStorage cada vez que activeTab cambie
  useEffect(() => {
    localStorage.setItem('activeTabCRM', activeTab);
  }, [activeTab]);
  // ===============================================

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    // CAMBIO 1: Quitamos "min-h-screen" y ponemos "h-screen overflow-hidden"
    // Esto asegura que el layout general nunca crezca más allá de la pantalla del monitor
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* El Sidebar ahora se quedará fijo e intacto a la izquierda */}
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        user={user} 
      />

      {/* CAMBIO 2: Agregamos "h-full" al contenedor derecho. 
          Esto obliga a que el scroll ocurra SÓLO aquí adentro, sin afectar al Sidebar */}
      <div className="flex-1 h-full p-6 md:p-10 overflow-y-auto w-full relative">
        
        <Topbar activeTab={activeTab} user={user} />

        {/* Vistas dinámicas */}
        {activeTab === 'inicio' && <HomeView setActiveTab={setActiveTab} user={user} />}
        {activeTab === 'usuarios' && <UserView />}
        {activeTab === 'campanas' && <CampanasView />}
        {activeTab === 'estados' && <EstadosView />}
        {activeTab === 'clientes' && <ClientesView />}
        {activeTab === 'asignaciones' && <AsignacionesView />}
        {activeTab === 'mis_clientes' && <AgenteClientesView user={user} />}
        {activeTab === 'seguimiento_agentes' && <SeguimientoAgentesView user={user} />} {/* <-- NUEVA VISTA */}
      </div>

    </div>
  );
};

export default DashboardLayout;