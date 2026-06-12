import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FiSearch, FiCheckSquare, FiX, FiUsers, FiTag, FiVolume2, FiUser,
  FiEdit2, FiUserMinus, FiFilter
} from 'react-icons/fi';
import api from '../api';

const AsignacionesView = ({ currentUser }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [idsToUnassign, setIdsToUnassign] = useState([]); 
  
  const [usuarios, setUsuarios] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [estados, setEstados] = useState([]);

  const [formData, setFormData] = useState({ user_id: '', campana_id: '', estado_id: '' });
  const [isLoading, setIsLoading] = useState(false);

  // ======================= ESTADOS DE FILTROS Y ORDENAMIENTO =======================
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgente, setFilterAgente] = useState('');
  const [filterCampana, setFilterCampana] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest', 'oldest', 'name-asc', 'name-desc'

  // Verificación de permisos para ver la ficha del cliente
  const canViewFicha = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  useEffect(() => {
    fetchClientes();
    fetchDatosModal();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  const fetchDatosModal = async () => {
    try {
      const response = await api.get('/asignaciones/datos');
      setUsuarios(response.data.usuarios);
      setCampanas(response.data.campanas);
      setEstados(response.data.estados);
    } catch (error) {
      console.error("Error al cargar datos del modal:", error);
    }
  };

  // ======================= LÓGICA DE FILTRADO Y ORDENAMIENTO =======================
  const clientesFiltrados = clientes
    .filter(cliente => {
      // 1. Filtro por búsqueda de texto (nombre)
      const matchSearch = cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // 2. Filtros por selectores (Agente, Campaña, Estado)
      const matchAgente = filterAgente === '' || 
        (filterAgente === 'unassigned' ? !cliente.user : cliente.user?.id?.toString() === filterAgente);
        
      const matchCampana = filterCampana === '' || 
        (filterCampana === 'unassigned' ? !cliente.campana : cliente.campana?.id?.toString() === filterCampana);
        
      const matchEstado = filterEstado === '' || 
        (filterEstado === 'unassigned' ? !cliente.estado : cliente.estado?.id?.toString() === filterEstado);

      return matchSearch && matchAgente && matchCampana && matchEstado;
    })
    .sort((a, b) => {
      // 3. Aplicación del criterio de ordenamiento seleccionado
      if (sortBy === 'name-asc') {
        return (a.nombre || '').localeCompare(b.nombre || '');
      }
      if (sortBy === 'name-desc') {
        return (b.nombre || '').localeCompare(a.nombre || '');
      }
      if (sortBy === 'oldest') {
        // Compara por fecha de creación o en su defecto por ID incremental
        return (a.created_at || a.id) > (b.created_at || b.id) ? 1 : -1;
      }
      if (sortBy === 'newest') {
        return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
      }
      return 0;
    });

  const clearFilters = () => {
    setSearchTerm('');
    setFilterAgente('');
    setFilterCampana('');
    setFilterEstado('');
    setSortBy('newest');
  };

  // ======================= LÓGICA DE CHECKBOXES INTELIGENTES =======================
  const isAllFilteredSelected = clientesFiltrados.length > 0 && 
    clientesFiltrados.every(c => selectedIds.includes(c.id));

  const handleSelectAll = (e) => {
    const visibleIds = clientesFiltrados.map(c => c.id);
    if (e.target.checked) {
      setSelectedIds(prev => [...new Set([...prev, ...visibleIds])]);
    } else {
      setSelectedIds(prev => prev.filter(id => !visibleIds.includes(id)));
    }
  };

  const handleSelectOne = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  // ======================= ASIGNAR / EDITAR =======================
  const openAssignModalBulk = () => {
    if (selectedIds.length === 0) return;
    if (selectedIds.length === 1) {
      const clienteSeleccionado = clientes.find(c => c.id === selectedIds[0]);
      setFormData({
        user_id: clienteSeleccionado?.user_id || '',
        campana_id: clienteSeleccionado?.campana_id || '',
        estado_id: clienteSeleccionado?.estado_id || ''
      });
    } else {
      setFormData({ user_id: '', campana_id: '', estado_id: '' });
    }
    setIsModalOpen(true);
  };

  const openAssignModalSingle = (cliente) => {
    setSelectedIds([cliente.id]); 
    setFormData({
      user_id: cliente.user_id || '',
      campana_id: cliente.campana_id || '',
      estado_id: cliente.estado_id || ''
    });
    setIsModalOpen(true);
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await api.post('/asignaciones/procesar', {
        cliente_ids: selectedIds,
        user_id: formData.user_id,
        campana_id: formData.campana_id,
        estado_id: formData.estado_id
      });
      
      await fetchClientes(); 
      setSelectedIds([]); 
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error en la asignación:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ======================= REMOVER ASIGNACIÓN =======================
  const openUnassignModalSingle = (id) => {
    setIdsToUnassign([id]);
    setIsUnassignModalOpen(true);
  };

  const openUnassignModalBulk = () => {
    if (selectedIds.length === 0) return;
    setIdsToUnassign(selectedIds);
    setIsUnassignModalOpen(true);
  };

  const confirmUnassign = async () => {
    setIsLoading(true);
    try {
      await api.post('/asignaciones/desasignar', { 
        cliente_ids: idsToUnassign 
      });

      await fetchClientes();
      setSelectedIds([]);
      setIdsToUnassign([]);
      setIsUnassignModalOpen(false);
    } catch (error) {
      console.error("Error al remover asignaciones:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // El botón limpiar se activa si cambias los filtros o si el orden no es el predeterminado
  const hasActiveFilters = searchTerm || filterAgente || filterCampana || filterEstado || sortBy !== 'newest';

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 bg-white w-full flex flex-col gap-4">
          
          {/* Fila 1: Títulos y Botones de Acción */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 m-0">Asignación de Clientes</h3>
              <p className="text-xs text-slate-500 mt-1">Selecciona clientes y asígnalos a tu equipo</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {selectedIds.length > 0 && (
                <button 
                  onClick={openUnassignModalBulk}
                  className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                >
                  <FiUserMinus className="text-lg" /> Remover ({selectedIds.length})
                </button>
              )}

              <button 
                onClick={openAssignModalBulk}
                disabled={selectedIds.length === 0}
                className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0 ${
                  selectedIds.length > 0 
                    ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-md' 
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
              >
                <FiCheckSquare className="text-lg" /> Asignar / Editar ({selectedIds.length})
              </button>
            </div>
          </div>

          {/* Fila 2: Barra de Filtros */}
          <div className="flex flex-col lg:flex-row gap-3 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            {/* Input Nombre */}
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input 
                type="text" 
                placeholder="Buscar por nombre..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 box-border"
              />
            </div>

            {/* Select Agente */}
            <select 
              value={filterAgente}
              onChange={(e) => setFilterAgente(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]"
            >
              <option value="">Todos los Agentes</option>
              <option value="unassigned">Sin Agente</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>

            {/* Select Campaña */}
            <select 
              value={filterCampana}
              onChange={(e) => setFilterCampana(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]"
            >
              <option value="">Todas las Campañas</option>
              <option value="unassigned">Sin Campaña</option>
              {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>

            {/* Select Estado */}
            <select 
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]"
            >
              <option value="">Todos los Estados</option>
              <option value="unassigned">Sin Estado</option>
              {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>

            {/* Select Ordenamiento */}
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 font-semibold focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[150px] bg-slate-50"
            >
              <option value="newest">Más reciente</option>
              <option value="oldest">Más antiguo</option>
              <option value="name-asc">Nombre (A-Z)</option>
              <option value="name-desc">Nombre (Z-A)</option>
            </select>

            {/* Botón Limpiar */}
            {hasActiveFilters && (
              <button 
                onClick={clearFilters}
                className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors shrink-0"
              >
                <FiX /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* TABLA DE ASIGNACIONES */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 w-12 text-center">
                  <input 
                    type="checkbox" 
                    onChange={handleSelectAll} 
                    checked={isAllFilteredSelected}
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="p-4 w-16 text-center">ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Agente Asignado</th>
                <th className="p-4">Campaña</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center w-28">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center p-8 text-slate-400">
                    {clientes.length === 0 ? 'No hay clientes importados.' : 'No se encontraron clientes con esos filtros.'}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(cliente.id) ? 'bg-slate-100/60' : ''}`}>
                    <td className="p-4 text-center">
                      <input 
                        type="checkbox" 
                        onChange={(e) => handleSelectOne(e, cliente.id)}
                        checked={selectedIds.includes(cliente.id)}
                        className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                      />
                    </td>
                    <td className="p-4 text-center font-medium text-slate-500">
                      #{cliente.id}
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      {canViewFicha ? (
                        <Link 
                          to={`/clientes/ficha/${cliente.id}`} 
                          className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                        >
                          {cliente.nombre}
                        </Link>
                      ) : (
                        <span>{cliente.nombre}</span>
                      )}
                    </td>
                    
                    <td className="p-4">
                      {cliente.user ? (
                        <span className="flex items-center gap-2 text-slate-700 bg-slate-100 px-3 py-1 rounded-full text-xs font-medium w-fit">
                          <FiUser className="text-slate-500"/> {cliente.user.name}
                        </span>
                      ) : <span className="text-slate-400 text-xs italic">Sin Asignar</span>}
                    </td>
                    
                    <td className="p-4">
                      {cliente.campana ? (
                        <span className="flex items-center gap-2 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-medium w-fit">
                          <FiVolume2/> {cliente.campana.nombre}
                        </span>
                      ) : <span className="text-slate-400 text-xs italic">-</span>}
                    </td>

                    <td className="p-4">
                      {cliente.estado ? (
                        <span 
                          className="flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold w-fit text-slate-700"
                          style={{ 
                            backgroundColor: `${cliente.estado.color || '#f59e0b'}26`, 
                            border: `1px solid ${cliente.estado.color || '#f59e0b'}40` 
                          }}
                        >
                          <FiTag style={{ color: cliente.estado.color || '#f59e0b' }} /> {cliente.estado.nombre}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs italic">-</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => openAssignModalSingle(cliente)} 
                          className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors" 
                          title="Editar Asignación"
                        >
                          <FiEdit2 size={16} />
                        </button>
                        <button 
                          onClick={() => openUnassignModalSingle(cliente.id)} 
                          className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                          title="Remover Asignación"
                          disabled={!cliente.user && !cliente.campana && !cliente.estado} 
                        >
                          <FiUserMinus size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DE ASIGNAR / EDITAR ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiUsers className="text-slate-600" /> {selectedIds.length === 1 ? 'Editar Asignación' : `Asignar ${selectedIds.length} Clientes`}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm"><FiX size={18} /></button>
            </div>
            
            <form onSubmit={handleAssign} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">1. Agente Asignado</label>
                <select value={formData.user_id} onChange={(e) => setFormData({...formData, user_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-slate-500 outline-none text-sm">
                  <option value="">-- Sin cambios (Mantener actual) --</option>
                  {usuarios.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">2. Vincular a Campaña</label>
                <select value={formData.campana_id} onChange={(e) => setFormData({...formData, campana_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm">
                  <option value="">-- Sin cambios (Mantener actual) --</option>
                  {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">3. Definir Estado</label>
                <select value={formData.estado_id} onChange={(e) => setFormData({...formData, estado_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none text-sm">
                  <option value="">-- Sin cambios (Mantener actual) --</option>
                  {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>

              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isLoading || (!formData.user_id && !formData.campana_id && !formData.estado_id)} 
                  className="flex-1 p-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:bg-slate-400"
                >
                  {isLoading ? 'Procesando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL REMOVER ASIGNACIÓN ================= */}
      {isUnassignModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 bg-red-50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-200">
                <FiUserMinus />
              </div>
              <h3 className="text-xl font-bold text-red-900 m-0">¿Remover Asignación?</h3>
              <p className="text-sm text-red-600 mt-2 font-medium">
                Se limpiará el Agente, Campaña y Estado de {idsToUnassign.length} cliente(s). <br/>
                <strong>El cliente no se borrará del CRM.</strong>
              </p>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <div className="flex gap-3">
                <button onClick={() => setIsUnassignModalOpen(false)} disabled={isLoading} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Cancelar</button>
                <button onClick={confirmUnassign} disabled={isLoading} className="flex-1 p-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:bg-red-400">
                  {isLoading ? 'Removiendo...' : 'Sí, remover datos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default AsignacionesView;