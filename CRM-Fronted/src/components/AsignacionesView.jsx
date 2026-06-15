import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiCheckSquare, FiX, FiUsers, FiTag, FiVolume2, FiUser,
  FiEdit2, FiUserMinus, FiPhone, FiMail, FiEdit3, FiSave, FiCalendar, 
  FiMessageSquare, FiStar, FiCheckCircle, FiChevronLeft, FiChevronRight
} from 'react-icons/fi';
import api from '../api';

const AsignacionesView = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modales Principales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [idsToUnassign, setIdsToUnassign] = useState([]); 
  
  // ================= MODAL FICHA DE CLIENTE =================
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Estados de edición
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingEstado, setIsEditingEstado] = useState(false);
  
  const [editFormData, setEditFormData] = useState({ nombre: '', email: '', telefono: '' });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  
  // Estados para la columna derecha del modal (Comentarios y Citas)
  const [activeTab, setActiveTab] = useState('gestion');
  const comentariosEndRef = useRef(null);
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);

  const [usuarios, setUsuarios] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [estados, setEstados] = useState([]);

  const [formData, setFormData] = useState({ user_id: '', campana_id: '', estado_id: '' });
  const [isLoading, setIsLoading] = useState(false);

  // ======================= ESTADOS DE FILTROS Y ORDENAMIENTO =======================
  const [searchTerm, setSearchTerm] = useState('');
  const [sortCliente, setSortCliente] = useState(''); 
  const [filterAgente, setFilterAgente] = useState('');
  const [filterCampana, setFilterCampana] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  // Listas ordenadas alfabéticamente para los selectores
  const estadosOrdenados = [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const campanasOrdenadas = [...campanas].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const usuariosOrdenados = [...usuarios].sort((a, b) => a.name.localeCompare(b.name));

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

  const clientesFiltrados = clientes
    .filter(cliente => {
      // BUSCAR POR NOMBRE O POR ID
      const matchSearch = 
        cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cliente.id?.toString().includes(searchTerm);
      
      const matchAgente = (!filterAgente || filterAgente.startsWith('sort-')) ? true : (filterAgente === 'unassigned' ? !cliente.user : cliente.user?.id?.toString() === filterAgente);
      const matchCampana = (!filterCampana || filterCampana.startsWith('sort-')) ? true : (filterCampana === 'unassigned' ? !cliente.campana : cliente.campana?.id?.toString() === filterCampana);
      const matchEstado = (!filterEstado || filterEstado.startsWith('sort-')) ? true : (filterEstado === 'unassigned' ? !cliente.estado : cliente.estado?.id?.toString() === filterEstado);
      
      return matchSearch && matchAgente && matchCampana && matchEstado;
    })
    .sort((a, b) => {
      if (filterAgente === 'sort-asc') return (a.user?.name || '').localeCompare(b.user?.name || '');
      if (filterAgente === 'sort-desc') return (b.user?.name || '').localeCompare(a.user?.name || '');
      
      if (filterCampana === 'sort-asc') return (a.campana?.nombre || '').localeCompare(b.campana?.nombre || '');
      if (filterCampana === 'sort-desc') return (b.campana?.nombre || '').localeCompare(a.campana?.nombre || '');
      
      if (filterEstado === 'sort-asc') return (a.estado?.nombre || '').localeCompare(b.estado?.nombre || '');
      if (filterEstado === 'sort-desc') return (b.estado?.nombre || '').localeCompare(a.estado?.nombre || '');

      if (sortCliente === 'asc') return (a.nombre || '').localeCompare(b.nombre || '');
      if (sortCliente === 'desc') return (b.nombre || '').localeCompare(a.nombre || '');

      return (b.created_at || b.id) > (a.created_at || a.id) ? 1 : -1;
    });

  const clearFilters = () => {
    setSearchTerm('');
    setSortCliente('');
    setFilterAgente('');
    setFilterCampana('');
    setFilterEstado('');
  };

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

  // ======================= ASIGNAR / REMOVER =======================
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
      await api.post('/asignaciones/desasignar', { cliente_ids: idsToUnassign });
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

  // ======================= LÓGICA FICHA DE CLIENTE =======================
  
  // ---> AQUI MODIFICAMOS PARA TRAER LOS COMENTARIOS DEL CLIENTE <---
  const openDetailModal = async (cliente) => {
    // 1. Abrimos el modal con los datos básicos que ya tenemos en memoria
    setSelectedCliente(cliente);
    setEditFormData({
      nombre: cliente.nombre || '',
      email: cliente.email || cliente.correo || '',
      telefono: cliente.telefono || ''
    });
    setIsEditingInfo(false);
    setIsEditingEstado(false); 
    setActiveTab('gestion');
    setIsDetailModalOpen(true);
    setIsLoadingComentarios(true); // Empezamos a cargar los comentarios

    // 2. Hacemos la petición a la API para traer todo el historial de ese cliente
    try {
      // Hacemos un GET al endpoint de detalle del cliente
      const response = await api.get(`/clientes/${cliente.id}`);
      const dataClienteCompleto = response.data.cliente || response.data;
      
      // Actualizamos el estado con los datos completos (que incluyen los 'comentarios')
      if (dataClienteCompleto) {
        setSelectedCliente(prev => ({ ...prev, ...dataClienteCompleto }));
      }
    } catch (error) {
      console.error("Error al cargar el historial del cliente:", error);
    } finally {
      setIsLoadingComentarios(false); // Terminamos de cargar
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setIsSavingInfo(true);
    try {
      const payload = {
        nombre: editFormData.nombre,
        email: editFormData.email,
        telefono: editFormData.telefono
      };

      await api.put(`/clientes/${selectedCliente.id}`, payload);
      setSelectedCliente({ ...selectedCliente, ...payload });
      await fetchClientes(); 
      setIsEditingInfo(false);
    } catch (error) {
      console.error("Error al actualizar información del cliente:", error);
    } finally {
      setIsSavingInfo(false);
    }
  };

  const handleDirectStateChange = async (newEstadoId) => {
    setIsEditingEstado(false);
    const currentEstadoId = selectedCliente.estado?.id?.toString() || '';
    if(newEstadoId === currentEstadoId) return;

    setIsLoading(true);
    try {
      const payload = {
        nombre: selectedCliente.nombre, 
        estado_id: newEstadoId || null
      };
      await api.put(`/clientes/${selectedCliente.id}`, payload);
      
      const nuevoEstadoObj = estados.find(e => e.id.toString() === newEstadoId.toString()) || null;
      setSelectedCliente({ ...selectedCliente, estado_id: newEstadoId, estado: nuevoEstadoObj });
      await fetchClientes(); 
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const verificarCitaPendiente = (texto) => {
    if (!texto) return false;
    const txt = texto.toLowerCase();
    return txt.includes('agendada') || txt.includes('pendiente') || txt.includes('programada');
  };

  const getStatusBadge = (estado) => {
    if (!estado) return "bg-slate-100 text-slate-700";
    const est = estado.toLowerCase();
    if (est.includes('pendiente') || est.includes('agendada')) return "bg-amber-100 text-amber-700";
    if (est.includes('completada') || est.includes('asistió')) return "bg-emerald-100 text-emerald-700";
    if (est.includes('cancelada') || est.includes('no asistió')) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  // Preparar datos para los tabs
  const comentarios = selectedCliente?.comentarios || [];
  const comentariosNormales = comentarios.filter(c => c.tipo !== 'cita' && !c.es_cita);
  const historialCitas = comentarios.filter(c => c.tipo === 'cita' || c.es_cita);
  const datosPestañaActual = activeTab === 'gestion' ? comentariosNormales : historialCitas;

  const isAllFilteredSelected = clientesFiltrados.length > 0 && clientesFiltrados.every(c => selectedIds.includes(c.id));
  const hasActiveFilters = searchTerm || sortCliente || filterAgente || filterCampana || filterEstado;

  // ======================= LÓGICA DE NAVEGACIÓN =======================
  const currentIndex = selectedCliente ? clientesFiltrados.findIndex(c => c.id === selectedCliente.id) : -1;
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex !== -1 && currentIndex < clientesFiltrados.length - 1;

  const handlePrevCliente = () => {
    if (hasPrev) openDetailModal(clientesFiltrados[currentIndex - 1]);
  };

  const handleNextCliente = () => {
    if (hasNext) openDetailModal(clientesFiltrados[currentIndex + 1]);
  };

  return (
    <div className="animate-fadeIn w-full relative">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full relative z-0">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 bg-white w-full flex flex-col gap-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                Asignación de Clientes
                <span className="text-sm font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {clientesFiltrados.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                {hasActiveFilters 
                  ? `Filtrados: ${clientesFiltrados.length} de ${clientes.length} clientes en total` 
                  : `Selecciona clientes y asígnalos a tu equipo (${clientes.length} importados)`}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {selectedIds.length > 0 && (
                <button onClick={openUnassignModalBulk} className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0 border border-red-200 text-red-600 bg-red-50 hover:bg-red-100">
                  <FiUserMinus className="text-lg" /> Remover ({selectedIds.length})
                </button>
              )}
              <button onClick={openAssignModalBulk} disabled={selectedIds.length === 0} className={`flex items-center justify-center gap-2 px-5 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0 ${selectedIds.length > 0 ? 'bg-slate-800 text-white hover:bg-slate-900 shadow-md' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
                <FiCheckSquare className="text-lg" /> Asignar / Editar ({selectedIds.length})
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 w-full bg-slate-50/50 p-3 rounded-xl border border-slate-100">
            <div className="relative flex-1 min-w-[180px]">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input type="text" placeholder="Buscar por nombre o ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 box-border"/>
            </div>

            <select value={sortCliente} onChange={(e) => setSortCliente(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]">
              <option value="">Ordenar Clientes</option>
              <option value="asc">Ordenar A - Z</option>
              <option value="desc">Ordenar Z - A</option>
            </select>
            
            <select value={filterAgente} onChange={(e) => setFilterAgente(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]">
              <option value="">Todos los Agentes</option>
              <optgroup label="Ordenar Tabla">
                <option value="sort-asc">Ordenar A - Z</option>
                <option value="sort-desc">Ordenar Z - A</option>
              </optgroup>
              <optgroup label="Filtrar">
                <option value="unassigned">Sin Agente</option>
                {usuariosOrdenados.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
              </optgroup>
            </select>

            <select value={filterCampana} onChange={(e) => setFilterCampana(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]">
              <option value="">Todas las Campañas</option>
              <optgroup label="Ordenar Tabla">
                <option value="sort-asc">Ordenar A - Z</option>
                <option value="sort-desc">Ordenar Z - A</option>
              </optgroup>
              <optgroup label="Filtrar">
                <option value="unassigned">Sin Campaña</option>
                {campanasOrdenadas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </optgroup>
            </select>

            <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 font-medium focus:outline-none focus:ring-2 focus:ring-slate-500 min-w-[140px]">
              <option value="">Todos los Estados</option>
              <optgroup label="Ordenar Tabla">
                <option value="sort-asc">Ordenar A - Z</option>
                <option value="sort-desc">Ordenar Z - A</option>
              </optgroup>
              <optgroup label="Filtrar">
                <option value="unassigned">Sin Estado</option>
                {estadosOrdenados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
              </optgroup>
            </select>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors shrink-0">
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
              <th className="p-4 w-12 text-center"><input type="checkbox" onChange={handleSelectAll} checked={isAllFilteredSelected} className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" /></th>
              <th className="p-4 w-16 text-center">ID</th>
              <th className="p-4">Cliente</th>
              <th className="p-4">Email</th>
              <th className="p-4">Teléfono</th>
              <th className="p-4">Agente Asignado</th>
              <th className="p-4">Campaña</th>
              <th className="p-4">Estado</th>
              <th className="p-4">Fecha de Creación</th>
              <th className="p-4 text-center w-28">Acciones</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center p-8 text-slate-400">
                    {clientes.length === 0 ? 'No hay clientes importados.' : 'No se encontraron clientes con esos filtros o ese orden.'}
                  </td>
                </tr>
              ) : (
                clientesFiltrados.map((cliente) => (
                  <tr key={cliente.id} className={`hover:bg-slate-50/80 transition-colors ${selectedIds.includes(cliente.id) ? 'bg-slate-100/60' : ''}`}>
                    <td className="p-4 text-center"><input type="checkbox" onChange={(e) => handleSelectOne(e, cliente.id)} checked={selectedIds.includes(cliente.id)} className="w-4 h-4 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer" /></td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200">#{cliente.id}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-900">
                      <button onClick={() => openDetailModal(cliente)} className="text-blue-600 hover:text-blue-800 hover:underline transition-colors text-left font-bold" title="Ver Ficha del cliente">
                        {cliente.nombre}
                      </button>
                    </td>
                    
                    <td className="p-4 text-slate-600 font-medium">
                      {cliente.email || cliente.correo || <span className="text-slate-400 italic text-xs">N/A</span>}
                    </td>
                    <td className="p-4 text-slate-600 font-medium">
                      {cliente.telefono || <span className="text-slate-400 italic text-xs">N/A</span>}
                    </td>

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
                        <span className="flex items-center gap-2 px-2.5 py-1 rounded text-xs font-semibold w-fit text-slate-700" style={{ backgroundColor: `${cliente.estado.color || '#f59e0b'}26`, border: `1px solid ${cliente.estado.color || '#f59e0b'}40` }}>
                          <FiTag style={{ color: cliente.estado.color || '#f59e0b' }} /> {cliente.estado.nombre}
                        </span>
                      ) : <span className="text-slate-400 text-xs italic">-</span>}
                    </td>
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {cliente.created_at 
                        ? new Date(cliente.created_at).toLocaleDateString('es-ES', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : <span className="text-slate-400 italic">Sin fecha</span>
                      }
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => openAssignModalSingle(cliente)} className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 rounded-lg transition-colors" title="Editar Asignación"><FiEdit2 size={16} /></button>
                        <button onClick={() => openUnassignModalSingle(cliente.id)} className="p-2 text-red-500 bg-red-50 hover:bg-red-100 hover:text-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Remover Asignación" disabled={!cliente.user && !cliente.campana && !cliente.estado}><FiUserMinus size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL DEL CLIENTE ================= */}
      {isDetailModalOpen && selectedCliente && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-[200vw] max-w-[1600px] h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50 shrink-0">
              <h3 className="text-lg font-bold text-teal-900 m-0 flex items-center gap-2">
                <FiUser className="text-teal-600" /> Ficha del Cliente
              </h3>
              <button onClick={() => setIsDetailModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              
              {/* Columna Izquierda */}
              <div className="w-full md:w-4/12 p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-100">
                
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</h4>
                    {!isEditingInfo && <p className="text-slate-800 font-semibold text-xl">{selectedCliente.nombre}</p>}
                  </div>
                  {!isEditingInfo ? (
                    <button onClick={() => setIsEditingInfo(true)} className="text-xs flex items-center gap-1 text-teal-600 hover:text-teal-800 font-semibold px-3 py-1.5 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-100">
                      <FiEdit3 size={14} /> Editar
                    </button>
                  ) : (
                    <button 
                      onClick={() => {
                        setIsEditingInfo(false);
                        setEditFormData({ 
                          nombre: selectedCliente.nombre, 
                          email: selectedCliente.email || selectedCliente.correo, 
                          telefono: selectedCliente.telefono
                        });
                      }} 
                      className="text-xs flex items-center gap-1 text-slate-500 hover:text-slate-700 font-semibold"
                    >
                      Cancelar
                    </button>
                  )}
                </div>

                {isEditingInfo ? (
                  <form onSubmit={handleSaveInfo} className="flex flex-col gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Nombre</label>
                      <input type="text" required value={editFormData.nombre} onChange={e => setEditFormData({...editFormData, nombre: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Correo Electrónico</label>
                      <input type="email" value={editFormData.email || ''} onChange={e => setEditFormData({...editFormData, email: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1">Teléfono</label>
                      <input type="text" value={editFormData.telefono || ''} onChange={e => setEditFormData({...editFormData, telefono: e.target.value})} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"/>
                    </div>
                    <button type="submit" disabled={isSavingInfo} className="mt-2 w-full px-4 py-2.5 text-sm font-bold text-white bg-teal-600 rounded-xl hover:bg-teal-700 disabled:bg-teal-400 flex items-center justify-center gap-2 transition-colors">
                      {isSavingInfo ? 'Guardando...' : <><FiSave /> Guardar Cambios</>}
                    </button>
                  </form>
                ) : (
                  <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiMail/> Correo Electrónico</h4>
                      <p className="text-slate-700 font-medium break-all">{selectedCliente.email || selectedCliente.correo || 'No registrado'}</p>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiPhone/> Teléfono</h4>
                      <p className="text-slate-700 font-medium">{selectedCliente.telefono || 'No registrado'}</p>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                    <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiVolume2/> Campaña</h4>
                    <p className="text-blue-800 font-semibold text-sm">{selectedCliente.campana?.nombre || 'Ninguna'}</p>
                  </div>

                  {/* ================= RECUADRO ESTADO ACTUAL (EDITABLE) ================= */}
                  <div 
                    className="p-3 rounded-xl border relative transition-all"
                    style={{ 
                      backgroundColor: `${selectedCliente.estado?.color || '#f59e0b'}26`,
                      borderColor: `${selectedCliente.estado?.color || '#f59e0b'}40`
                    }}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <h4 
                        className="text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                        style={{ color: selectedCliente.estado?.color || '#f59e0b' }} 
                      >
                        <FiTag/> Estado Actual
                      </h4>
                      {!isEditingEstado && (
                        <button 
                          onClick={() => setIsEditingEstado(true)} 
                          className="text-slate-500 hover:text-slate-800 transition-colors p-1 rounded-md hover:bg-black/5"
                          title="Cambiar Estado Rápido"
                        >
                          <FiEdit2 size={12} />
                        </button>
                      )}
                    </div>
                    
                    {isEditingEstado ? (
                      <select 
                        autoFocus
                        value={selectedCliente.estado_id || ''}
                        onChange={(e) => handleDirectStateChange(e.target.value)}
                        onBlur={() => setIsEditingEstado(false)}
                        className="w-full text-xs p-1.5 rounded-md border border-slate-300 bg-white text-slate-700 outline-none focus:ring-1 focus:ring-teal-500 cursor-pointer mt-1 shadow-sm"
                      >
                        <option value="">-- Sin estado --</option>
                        {estadosOrdenados.map(e => (
                          <option key={e.id} value={e.id}>{e.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <p className="font-semibold text-sm text-slate-800">
                        {selectedCliente.estado?.nombre || 'Sin estado'}
                      </p>
                    )}
                  </div>
                </div>

                <button 
                  onClick={() => setIsAgendarModalOpen(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-xl font-bold transition-all shadow-sm"
                >
                  <FiCalendar size={18} />
                  Agendar Cita
                </button>

                {/* BOTONES DE NAVEGACIÓN ANTERIOR / SIGUIENTE */}
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <button 
                    onClick={handlePrevCliente}
                    disabled={!hasPrev}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cliente Anterior"
                  >
                    <FiChevronLeft size={18} />
                    Anterior
                  </button>
                  <button 
                    onClick={handleNextCliente}
                    disabled={!hasNext}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800 rounded-xl font-bold transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Cliente Siguiente"
                  >
                    Siguiente
                    <FiChevronRight size={18} />
                  </button>
                </div>
              </div>

              {/* Columna Derecha (Tabs) */}
              <div className="w-full md:w-7/12 flex flex-col bg-slate-50">
                
                <div className="flex border-b border-slate-200 bg-white shrink-0">
                  <button 
                    onClick={() => setActiveTab('gestion')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'gestion' ? 'border-teal-500 text-teal-700 bg-teal-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <FiMessageSquare className={activeTab === 'gestion' ? 'text-teal-500' : ''}/> 
                    Historial de Gestión ({comentariosNormales.length})
                  </button>
                  <button 
                    onClick={() => setActiveTab('citas')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'citas' ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <FiCalendar className={activeTab === 'citas' ? 'text-indigo-500' : ''}/> 
                    Citas ({historialCitas.length})
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50 min-h-[300px]">
                  {isLoadingComentarios ? ( 
                    <div className="m-auto text-center text-slate-400">
                      <p className="text-sm font-medium animate-pulse">Cargando historial...</p>
                    </div>
                  ) : datosPestañaActual.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      {activeTab === 'gestion' ? <FiMessageSquare size={32} className="opacity-20" /> : <FiCalendar size={32} className="opacity-20" />}
                      <p className="text-sm">
                        {activeTab === 'gestion' ? 'No hay gestiones registradas aún.' : 'No hay citas agendadas para este cliente.'}
                      </p>
                    </div>
                  ) : (
                    datosPestañaActual.map((comentario, index) => {
                      const agentName = comentario.user?.name || 'Agente';
                      const initials = agentName.substring(0, 2).toUpperCase();
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      const isCita = activeTab === 'citas';
                      const esPendiente = isCita ? verificarCitaPendiente(comentario.texto) : false;

                      return (
                        <div key={comentario.id || index} className="flex gap-3 animate-fadeIn">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border ${isCita ? 'bg-indigo-100 text-indigo-700 border-indigo-50' : 'bg-teal-100 text-teal-700 border-teal-50'}`}>
                              {initials}
                            </div>
                          </div>

                          <div className={`flex-1 bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${isCita ? 'border-indigo-100' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-bold text-slate-900">{agentName}</h4>
                                
                                <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(comentario.estado)}`}>
                                  {isCita && (
                                    esPendiente 
                                      ? <FiStar className="text-amber-500 animate-pulse" size={14} /> 
                                      : <FiCheckCircle className="text-emerald-500" size={14} />
                                  )}
                                  {comentario.estado || (isCita ? (esPendiente ? 'Cita Pendiente' : 'Completada / Pasada') : 'Gestión Registrada')}
                                </span>

                              </div>
                              <div className="text-right">
                                <div className="text-sm font-semibold text-slate-500 capitalize">{formattedDate}</div>
                                <div className="text-xs text-slate-400 mt-0.5 font-medium">{formattedTime}</div>
                              </div>
                            </div>
                            <p className="mt-4 text-base text-slate-800 leading-relaxed whitespace-pre-wrap">{comentario.texto}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={comentariosEndRef} />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL ASIGNAR / EDITAR (MASIVO Y SIMPLE) ================= */}
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
                  {usuariosOrdenados.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">2. Vincular a Campaña</label>
                <select value={formData.campana_id} onChange={(e) => setFormData({...formData, campana_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm">
                  <option value="">-- Sin cambios (Mantener actual) --</option>
                  {campanasOrdenadas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">3. Definir Estado</label>
                <select value={formData.estado_id} onChange={(e) => setFormData({...formData, estado_id: e.target.value})} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none text-sm">
                  <option value="">-- Sin cambios (Mantener actual) --</option>
                  {estadosOrdenados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                </select>
              </div>
              <div className="flex gap-3 mt-4 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading || (!formData.user_id && !formData.campana_id && !formData.estado_id)} className="flex-1 p-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:bg-slate-400">
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