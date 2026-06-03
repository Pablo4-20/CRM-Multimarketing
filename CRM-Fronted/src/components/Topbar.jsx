import { useState, useEffect } from 'react';
import { FiSettings, FiClock } from 'react-icons/fi';

const Topbar = ({ activeTab }) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date) => date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (date) => date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).toUpperCase();

  return (
    <div className="bg-slate-800 rounded-2xl p-6 md:p-8 flex flex-col lg:flex-row justify-between lg:items-center text-white mb-8 shadow-lg gap-6">
      <div>
        <div className="text-xs text-slate-400 font-bold tracking-wider mb-2 flex items-center gap-2">
          <FiSettings /> {activeTab === 'inicio' ? 'ADMINISTRACIÓN' : 'SEGURIDAD'}
        </div>
        <h1 className="m-0 text-2xl md:text-3xl font-bold">
          {activeTab === 'inicio' ? 'Hola, Administrador' : 'Control de Accesos'}
        </h1>
        <p className="mt-2 text-slate-300">
          {activeTab === 'inicio' ? 'Aquí tienes el resumen de hoy en tu CRM.' : 'Administra los roles y permisos del equipo de trabajo.'}
        </p>
      </div>
      
      {/* Reloj */}
      <div className="bg-slate-700 p-4 px-6 rounded-xl text-center min-w-[150px] flex flex-col items-center shadow-inner">
        <FiClock className="text-slate-400 mb-2 text-xl" />
        <div className="text-2xl font-bold mb-1">{formatTime(currentTime)}</div>
        <div className="text-[10px] text-slate-300 tracking-wider">{formatDate(currentTime)}</div>
      </div>
    </div>
  );
};

export default Topbar;