import { useState, useEffect } from 'react';
import { FiSearch, FiCheckSquare, FiX, FiUsers, FiTag, FiVolume2, FiUser } from 'react-icons/fi';

const AsignacionesView = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Datos para los Selects del Modal
  const [usuarios, setUsuarios] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [estados, setEstados] = useState([]);

  // Formulario de asignación
  const [formData, setFormData] = useState({ user_id: '', campana_id: '', estado_id: '' });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchClientes();
    fetchDatosModal();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/clientes');
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  const fetchDatosModal = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/asignaciones/datos');
      const data = await response.json();
      setUsuarios(data.usuarios);
      setCampanas(data.campanas);
      setEstados(data.estados);
    } catch (error) {
      console.error("Error al cargar datos del modal:", error);
    }
  };

  // Manejo de Checkboxes
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(clientes.map(c => c.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const openAssignModal = () => {
    if (selectedIds.length === 0) return;
    setFormData({ user_id: '', campana_id: '', estado_id: '' });
    setIsModalOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/api/asignaciones/procesar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_ids: selectedIds,
          user_id: formData.user_id,
          campana_id: formData.campana_id,
          estado_id: formData.estado_id
        })
      });

      if (response.ok) {
        await fetchClientes(); // Recargar la tabla para ver los cambios
        setSelectedIds([]); // Limpiar selección
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("Error en la asignación:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Asignación de Clientes</h3>
            <p className="text-xs text-slate-500 mt-1">Selecciona clientes y asígnalos a tu equipo</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"/>
            </div>
            
            <button 
              onClick={openAssignModal}
              disabled={selectedIds.length === 0}
              className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0 ${selectedIds.length > 0 ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
            >
              <FiCheckSquare className="text-lg" /> Asignar ({selectedIds.length})
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={selectedIds.length === clientes.length && clientes.length > 0}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Agente Asignado</th>
                <th className="p-4">Campaña</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientes.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-8 text-slate-400">No hay clientes importados.</td></tr>
              ) : clientes.map((cliente) => (
                <tr key={cliente.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(cliente.id) ? 'bg-blue-50/30' : ''}`}>
                  <td className="p-4 text-center">
                    <input 
                      type="checkbox" 
                      onChange={(e) => handleSelectOne(e, cliente.id)}
                      checked={selectedIds.includes(cliente.id)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                  </td>
                  <td className="p-4 font-semibold text-slate-900">{cliente.nombre}</td>
                  
                  <td className="p-4">
                    {cliente.user ? (
                      <span className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium w-fit"><FiUser className="text-slate-500"/> {cliente.user.name}</span>
                    ) : <span className="text-slate-400 text-xs italic">Sin Asignar</span>}
                  </td>
                  
                  <td className="p-4">
                    {cliente.campana ? (
                      <span className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-medium w-fit"><FiVolume2/> {cliente.campana.nombre}</span>
                    ) : <span className="text-slate-400 text-xs italic">-</span>}
                  </td>

                  <td className="p-4">
                    {cliente.estado ? (
                      <span className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded text-xs font-medium w-fit"><FiTag/> {cliente.estado.nombre}</span>
                    ) : <span className="text-slate-400 text-xs italic">-</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE ASIGNACIÓN */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiUsers className="text-slate-600" /> Asignar {selectedIds.length} Cliente(s)
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleAssign} className="p-6 flex flex-col gap-4">
              
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">1. Asignar a Usuario / Agente</label>
                <select required value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-500 outline-none text-sm">
                  <option value="" disabled>-- Selecciona un Agente --</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">2. Vincular a Campaña</label>
                <select required value={formData.campana_id} onChange={(e) => setFormData({...formData, campana_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm">
                  <option value="" disabled>-- Selecciona una Campaña --</option>
                  {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">3. Definir Estado Inicial</label>
                <select required value={formData.estado_id} onChange={(e) => setFormData({...formData, estado_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none text-sm">
                  <option value="" disabled>-- Selecciona un Estado --</option>
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading || !formData.user_id || !formData.campana_id || !formData.estado_id} className="flex-1 p-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:bg-slate-400">
                  {isLoading ? 'Procesando...' : 'Aplicar Asignación'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AsignacionesView;