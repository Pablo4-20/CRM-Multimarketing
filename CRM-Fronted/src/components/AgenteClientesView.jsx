import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiX, FiUser, FiMail, FiPhone, FiVolume2, 
  FiTag, FiSend, FiMessageSquare, FiChevronLeft, FiChevronRight 
} from 'react-icons/fi';
import api from '../api';

const AgenteClientesView = ({ user }) => {
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [campanas, setCampanas] = useState([]); // Nuevo: Para el filtro de campañas
  
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoEstadoId, setNuevoEstadoId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const comentariosEndRef = useRef(null);

  // NUEVOS: ESTADOS PARA FILTROS Y PAGINACIÓN
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCampana, setFiltroCampana] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); // 50 por defecto

  useEffect(() => {
    if (user?.id) {
      fetchMisClientes();
      fetchEstados();
      fetchCampanas();
    }
  }, [user]);

  // Si el usuario cambia algún filtro, lo regresamos a la página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCampana, filtroEstado, itemsPerPage]);

  useEffect(() => {
    if (comentariosEndRef.current) {
      comentariosEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios]);

  const fetchMisClientes = async () => {
    try {
      const response = await api.get(`/agente/clientes/${user.id}`);
      setClientes(response.data);
    } catch (error) {
      console.error("Error al cargar mis clientes:", error);
    }
  };

  const fetchEstados = async () => {
    try {
      const response = await api.get('/estados');
      setEstados(response.data);
    } catch (error) {
      console.error("Error al cargar estados:", error);
    }
  };

  const fetchCampanas = async () => {
    try {
      const response = await api.get('/campanas');
      setCampanas(response.data);
    } catch (error) {
      console.error("Error al cargar campañas:", error);
    }
  };

  const openDetalleModal = (cliente) => {
    setSelectedCliente(cliente);
    setComentarios(cliente.comentarios || []); 
    setNuevoComentario('');
    setNuevoEstadoId(cliente.estado?.id || ''); 
    setIsModalOpen(true);
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setIsLoading(true);
    
    const estadoSeleccionado = estados.find(est => est.id.toString() === nuevoEstadoId.toString());
    const estadoNombre = estadoSeleccionado ? estadoSeleccionado.nombre : '';

    try {
      const response = await api.post(`/agente/clientes/${selectedCliente.id}/comentarios`, {
        texto: nuevoComentario,
        user_id: user.id,
        estado_id: nuevoEstadoId,
        estado_nombre: estadoNombre
      });

      setComentarios([...comentarios, response.data.comentario]);
      setNuevoComentario('');
      await fetchMisClientes(); 
      
      setSelectedCliente(prev => ({
        ...prev,
        estado: estadoSeleccionado || prev.estado
      }));

    } catch (error) {
      console.error("Error al guardar el comentario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (estado) => {
    if (!estado) return 'bg-slate-100 text-slate-600 border border-slate-200';
    switch (estado.toLowerCase()) {
      case 'en seguimiento': return 'bg-blue-50 text-blue-600 border border-blue-200';
      case 'no contesta': return 'bg-red-50 text-red-600 border border-red-200';
      case 'agendado': return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
      case 'vendido': return 'bg-purple-50 text-purple-600 border border-purple-200';
      default: return 'bg-slate-50 text-slate-600 border border-slate-200';
    }
  };

  // 1. Lógica de Filtrado General
  const clientesFiltrados = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    const matchTexto = 
      (cliente.nombre && cliente.nombre.toLowerCase().includes(searchLower)) ||
      (cliente.telefono && cliente.telefono.includes(searchTerm));

    const matchCampana = filtroCampana ? 
      (cliente.campana?.id.toString() === filtroCampana.toString() || cliente.campana_id?.toString() === filtroCampana.toString()) 
      : true;

    const matchEstado = filtroEstado ? 
      (cliente.estado?.id.toString() === filtroEstado.toString() || cliente.estado_id?.toString() === filtroEstado.toString()) 
      : true;

    return matchTexto && matchCampana && matchEstado;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroCampana('');
    setFiltroEstado('');
  };

  // 2. Lógica de Paginación (Sobre los filtrados)
  const isAll = itemsPerPage === 'all';
  const indexOfLastItem = isAll ? clientesFiltrados.length : currentPage * itemsPerPage;
  const indexOfFirstItem = isAll ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = clientesFiltrados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = isAll ? 1 : Math.ceil(clientesFiltrados.length / itemsPerPage);

  return (
    <div className="animate-fadeIn w-full flex flex-col h-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full flex flex-col h-full">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white w-full shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Mis Clientes Asignados</h3>
            <p className="text-xs text-slate-500 mt-1">Revisa los detalles y agrega comentarios a tu gestión</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            {/* Buscador */}
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input 
                type="text" 
                placeholder="Buscar nombre o número..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 box-border"
              />
            </div>

            {/* Filtro Campaña */}
            <select
              value={filtroCampana}
              onChange={(e) => setFiltroCampana(e.target.value)}
              className="w-full sm:w-40 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="">Todas las Campañas</option>
              {campanas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>

            {/* Filtro Estado */}
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className="w-full sm:w-40 py-2 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium"
            >
              <option value="">Todos los Estados</option>
              {estados.map(e => (
                <option key={e.id} value={e.id}>{e.nombre}</option>
              ))}
            </select>

            {/* Botón Limpiar */}
            {(searchTerm !== '' || filtroCampana !== '' || filtroEstado !== '') && (
              <button 
                onClick={limpiarFiltros}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-sm font-semibold transition-colors shrink-0"
                title="Borrar filtros"
              >
                <FiX size={16} /> Limpiar
              </button>
            )}
          </div>
        </div>

        {/* CONTROLES DE PAGINACIÓN (SUPERIOR) */}
        <div className="p-3 px-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{clientesFiltrados.length === 0 ? 0 : indexOfFirstItem + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(indexOfLastItem, clientesFiltrados.length)}</span> de <span className="font-semibold text-slate-700">{clientesFiltrados.length}</span> clientes
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-300 pl-4">
              <span className="font-medium text-slate-600">Mostrar:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-teal-500 focus:border-teal-500 block p-1.5 outline-none cursor-pointer"
              >
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>

          {!isAll && totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft /> Anterior
              </button>
              <span className="text-sm font-semibold text-slate-600 px-2">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* TABLA DE DATOS */}
        <div className="w-full overflow-x-auto flex-1">
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
              {currentItems.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-slate-400">No se encontraron clientes con esos filtros.</td></tr>
              ) : currentItems.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-teal-100 text-teal-600 shrink-0 font-bold">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{cliente.nombre}</div>
                        {cliente.comentarios && cliente.comentarios.length > 0 && (
                          <div className="text-[10px] text-teal-600 font-medium flex items-center gap-1 mt-0.5">
                            <FiMessageSquare/> {cliente.comentarios.length} comentarios
                          </div>
                        )}
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

      {/* MODAL DEL CLIENTE */}
      {isModalOpen && selectedCliente && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-[200vw] max-w-[1600px] h-[90vh] overflow-hidden animate-slideUp flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-teal-50 shrink-0">
              <h3 className="text-lg font-bold text-teal-900 m-0 flex items-center gap-2">
                <FiUser className="text-teal-600" /> Ficha del Cliente
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              
              {/* Columna Izquierda */}
              <div className="w-full md:w-4/12 p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-100">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre Completo</h4>
                  <p className="text-slate-800 font-semibold text-xl">{selectedCliente.nombre}</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1"><FiMail/> Correo Electrónico</h4>
                    <p className="text-slate-700 font-medium break-all">{selectedCliente.email || 'No registrado'}</p>
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
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiTag/> Estado Actual</h4>
                    <p className="text-amber-800 font-semibold text-sm">{selectedCliente.estado?.nombre || 'Sin estado'}</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha */}
              <div className="w-full md:w-7/12 flex flex-col bg-slate-50">
                
                <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FiMessageSquare className="text-teal-500"/> Historial de Gestión
                  </h4>
                </div>

                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50 min-h-[300px]">
                  {comentarios.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      <FiMessageSquare size={32} className="opacity-20" />
                      <p className="text-sm">No hay gestiones registradas aún.</p>
                    </div>
                  ) : (
                    comentarios.map((comentario, index) => {
                      const agentName = comentario.user?.name || user?.name || 'Agente';
                      const initials = agentName.substring(0, 2).toUpperCase();
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={comentario.id || index} className="flex gap-3 animate-fadeIn">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shadow-sm border border-teal-50">
                              {initials}
                            </div>
                          </div>

                          <div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-bold text-slate-900">{agentName}</h4>
                                <span className={`mt-1.5 inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(comentario.estado)}`}>
                                  {comentario.estado || 'Gestión Registrada'}
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

                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <form onSubmit={handleEnviarComentario} className="flex flex-col gap-2">
                    
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1"><FiTag/> Estado del cliente:</span>
                      <select
                        value={nuevoEstadoId}
                        onChange={(e) => setNuevoEstadoId(e.target.value)}
                        className="text-xs font-semibold p-1.5 rounded-md border border-slate-300 bg-slate-50 text-slate-700 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 cursor-pointer"
                      >
                        <option value="">-- Seleccionar estado --</option>
                        {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>

                    <div className="flex items-end gap-2">
                      <div className="flex-1 relative">
                        <textarea 
                          value={nuevoComentario}
                          onChange={(e) => setNuevoComentario(e.target.value)}
                          placeholder="Escribe una nueva gestión o nota de seguimiento..."
                          className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white resize-none max-h-32 min-h-[50px]"
                          rows="2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleEnviarComentario(e);
                            }
                          }}
                        ></textarea>
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={isLoading || !nuevoComentario.trim() || !nuevoEstadoId} 
                        title={!nuevoEstadoId ? "Selecciona un estado primero" : "Enviar"}
                        className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-sm disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0 h-[50px] w-[50px] flex items-center justify-center"
                      >
                        <FiSend className={isLoading ? "animate-pulse" : ""} />
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgenteClientesView;