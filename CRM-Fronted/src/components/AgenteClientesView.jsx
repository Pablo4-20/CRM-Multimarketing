import { useState, useEffect } from 'react';
import { FiSearch, FiX, FiUser, FiMail, FiPhone, FiVolume2, FiTag, FiFileText, FiSave } from 'react-icons/fi';

const AgenteClientesView = ({ user }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [notas, setNotas] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchMisClientes();
    }
  }, [user]);

  const fetchMisClientes = async () => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/agente/clientes/${user.id}`);
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar mis clientes:", error);
    }
  };

  const openDetalleModal = (cliente) => {
    setSelectedCliente(cliente);
    setNotas(cliente.notas || ''); // Cargar notas existentes si las hay
    setIsModalOpen(true);
  };

  const handleSaveNotas = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/agente/clientes/${selectedCliente.id}/notas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notas })
      });

      if (response.ok) {
        await fetchMisClientes(); // Recargar para actualizar la tabla oculta
        setIsModalOpen(false);
        setSelectedCliente(null);
      }
    } catch (error) {
      console.error("Error al guardar notas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Mis Clientes Asignados</h3>
            <p className="text-xs text-slate-500 mt-1">Revisa los detalles y agrega comentarios a tu gestión</p>
          </div>
          
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
            <input type="text" placeholder="Buscar en mis clientes..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 box-border"/>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">Cliente</th>
                <th className="p-4">Campaña</th>
                <th className="p-4">Estado Actual</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientes.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-slate-400">Aún no tienes clientes asignados.</td></tr>
              ) : clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-teal-100 text-teal-600 shrink-0 font-bold">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{cliente.nombre}</div>
                        {cliente.notas && <div className="text-[10px] text-teal-600 font-medium flex items-center gap-1 mt-0.5"><FiFileText/> Con notas</div>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {cliente.campana ? (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2 py-1 rounded text-xs font-medium w-fit"><FiVolume2/> {cliente.campana.nombre}</span>
                    ) : <span className="italic text-slate-400 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    {cliente.estado ? (
                      <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-1 rounded text-xs font-medium w-fit"><FiTag/> {cliente.estado.nombre}</span>
                    ) : <span className="italic text-slate-400 text-xs">-</span>}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openDetalleModal(cliente)} 
                      className="px-3 py-1.5 text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 rounded-lg transition-colors text-xs font-bold"
                    >
                      Ver Detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE Y NOTAS */}
      {isModalOpen && selectedCliente && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50 shrink-0">
              <h3 className="text-lg font-bold text-teal-900 m-0 flex items-center gap-2">
                <FiUser className="text-teal-600" /> Ficha del Cliente
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 flex flex-col md:flex-row gap-6">
              
              {/* Columna Izquierda: Información */}
              <div className="w-full md:w-1/2 flex flex-col gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</h4>
                  <p className="text-slate-800 font-semibold text-lg">{selectedCliente.nombre}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiMail/> Correo Electrónico</h4>
                    <p className="text-slate-700 font-medium">{selectedCliente.email || 'No registrado'}</p>
                  </div>
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiPhone/> Teléfono</h4>
                    <p className="text-slate-700 font-medium">{selectedCliente.telefono || 'No registrado'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiVolume2/> Campaña</h4>
                    <p className="text-blue-800 font-semibold text-sm">{selectedCliente.campana?.nombre || 'Ninguna'}</p>
                  </div>
                  <div className="bg-amber-50 p-3 rounded-xl border border-amber-100">
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiTag/> Estado</h4>
                    <p className="text-amber-800 font-semibold text-sm">{selectedCliente.estado?.nombre || 'Sin estado'}</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: Notas y Comentarios */}
              <form onSubmit={handleSaveNotas} className="w-full md:w-1/2 flex flex-col border-t md:border-t-0 md:border-l border-slate-200 pt-6 md:pt-0 md:pl-6">
                <div className="flex-1 flex flex-col">
                  <label className="text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                    <FiFileText className="text-teal-500"/> Comentarios y Notas de Gestión
                  </label>
                  <textarea 
                    value={notas}
                    onChange={(e) => setNotas(e.target.value)}
                    placeholder="Escribe aquí los acuerdos, próximas llamadas o información relevante del cliente..."
                    className="w-full flex-1 min-h-[150px] p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-teal-500 outline-none text-sm resize-none"
                  ></textarea>
                </div>
                
                <button 
                  type="submit" 
                  disabled={isLoading} 
                  className="mt-4 w-full flex items-center justify-center gap-2 p-3 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm disabled:bg-teal-400"
                >
                  <FiSave /> {isLoading ? 'Guardando...' : 'Guardar Notas'}
                </button>
              </form>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenteClientesView;