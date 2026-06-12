import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HomeView from './HomeView';
import UserView from './UserView';
import CampanasView from './CampanasView';
import EstadosView from './EstadosView';
import ClientesView from './ClientesView';
import AsignacionesView from './AsignacionesView';
import AgenteClientesView from './AgenteClientesView';

const DashboardLayout = ({ onLogout, user, children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('inicio');

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      <Sidebar 
        isCollapsed={isCollapsed} 
        toggleSidebar={toggleSidebar} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={onLogout} 
        user={user} 
      />

      <div className="flex-1 h-full p-6 md:p-10 overflow-y-auto w-full relative">
        
        <Topbar activeTab={activeTab} user={user} />

        {/* Lógica para renderizar 'children' (FichaCliente) si existe en la URL, 
            caso contrario renderiza las pestañas normales */}
        {children ? (
          children
        ) : (
          <>
            {activeTab === 'inicio' && <HomeView setActiveTab={setActiveTab} user={user} />}
            {activeTab === 'usuarios' && <UserView />}
            {activeTab === 'campanas' && <CampanasView />}
            {activeTab === 'estados' && <EstadosView />}
            {activeTab === 'clientes' && <ClientesView />}
            {activeTab === 'asignaciones' && <AsignacionesView currentUser={user} />}
            {activeTab === 'mis_clientes' && <AgenteClientesView user={user} />}
          </>
        )}

      </div>

    </div>
  );
};

export default DashboardLayout;