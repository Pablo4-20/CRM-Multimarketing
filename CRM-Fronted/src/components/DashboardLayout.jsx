import { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import HomeView from './HomeView';
import UserView from './UserView';

const DashboardLayout = ({ onLogout }) => {
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
      />

      <div className="flex-1 p-6 md:p-10 overflow-y-auto w-full">
        
        <Topbar activeTab={activeTab} />

        {/* Renderizado dinámico de la pestaña activa */}
        {activeTab === 'inicio' && <HomeView setActiveTab={setActiveTab} />}
        {activeTab === 'usuarios' && <UserView />}

      </div>

    </div>
  );
};

export default DashboardLayout;