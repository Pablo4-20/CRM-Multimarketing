import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HomeView from './HomeView';
import UserView from './UserView';
import CampanasView from './CampanasView';
import EstadosView from './EstadosView';
import ClientesView from './ClientesView';
import AsignacionesView from './AsignacionesView';


const DashboardLayout = ({ onLogout, user }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex min-h-screen w-full bg-slate-50 font-sans text-slate-800">
      
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        user={user} 
      />

      <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        
        <Topbar activeTab={activeTab} user={user} />

        {/* Renderizado dinámico de la pestaña activa */}
        {activeTab === 'inicio' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'usuarios' && <UserView />}
        {activeTab === 'campanas' && <CampanasView />}
        {activeTab === 'estados' && <EstadosView />}
        {activeTab === 'clientes' && <ClientesView />}
        {activeTab === 'asignaciones' && <AsignacionesView />}
        
      </div>

    </div>
  );
};

export default DashboardLayout;