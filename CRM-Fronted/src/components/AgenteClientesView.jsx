import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiX, FiUser, FiMail, FiPhone, FiVolume2, 
  FiTag, FiSend, FiMessageSquare, FiChevronLeft, FiChevronRight,
  FiCalendar, FiClock, FiCheckCircle, FiBell, FiStar, FiChevronDown
} from 'react-icons/fi';
import api from '../api';

// --- FUNCIÓN PARA DETECTAR SI LA CITA ES FUTURA (PENDIENTE) O PASADA (COMPLETADA) ---
const verificarCitaPendiente = (texto) => {
  if (!texto) return false;
  try {
    const matchNumerico = texto.match(/para el (\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}),?\s+(\d{1,2}):(\d{2})/);
    if (matchNumerico) {
      const dia = parseInt(matchNumerico[1]);
      const mes = parseInt(matchNumerico[2]) - 1; 
      const anio = parseInt(matchNumerico[3]);
      const hora = parseInt(matchNumerico[4]);
      const min = parseInt(matchNumerico[5]);
      return new Date(anio, mes, dia, hora, min) > new Date();
    }

    const matchTexto = texto.match(/para el (\d{1,2})\s+(?:de\s+)?([a-zA-Z]{3})[a-zA-Z\.]*\s+(?:de\s+)?(\d{4}),?\s+(\d{1,2}):(\d{2})/i);
    if (matchTexto) {
      const meses = {"ene":0,"feb":1,"mar":2,"abr":3,"may":4,"jun":5,"jul":6,"ago":7,"sep":8,"oct":9,"nov":10,"dic":11};
      const dia = parseInt(matchTexto[1]);
      const mes = meses[matchTexto[2].toLowerCase()] !== undefined ? meses[matchTexto[2].toLowerCase()] : 0;
      const anio = parseInt(matchTexto[3]);
      const hora = parseInt(matchTexto[4]);
      const min = parseInt(matchTexto[5]);
      return new Date(anio, mes, dia, hora, min) > new Date();
    }
  } catch (e) {
    console.error("Error parseando fecha:", e);
  }
  
  return false;
};

const AgenteClientesView = ({ user }) => {
  const [clientes, setClientes] = useState([]);
  const [estados, setEstados] = useState([]);
  const [campanas, setCampanas] = useState([]); 
  
  const [selectedCliente, setSelectedCliente] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [nuevoEstadoId, setNuevoEstadoId] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // NOTIFICACIONES
  const [notificacion, setNotificacion] = useState({ show: false, mensaje: '' });
  const [alertaCita, setAlertaCita] = useState({ show: false, mensaje: '' });
  
  // ESTADOS DE AGENDAMIENTO
  const [isAgendarModalOpen, setIsAgendarModalOpen] = useState(false);
  const [fechaCita, setFechaCita] = useState('');
  const [notaCita, setNotaCita] = useState('');
  const [minDateTime, setMinDateTime] = useState('');
  const [citasProgramadas, setCitasProgramadas] = useState([]);
  
  // ESTADOS DE PESTAÑAS (TABS)
  const [activeTab, setActiveTab] = useState('gestion'); 

  const comentariosEndRef = useRef(null);

  // ESTADOS PARA FILTROS, ORDEN Y PAGINACIÓN
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCampana, setFiltroCampana] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); // NUEVO: Estado de ordenamiento
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); 

  useEffect(() => {
    if (user?.id) {
      fetchMisClientes();
      fetchEstados();
      fetchCampanas();
    }
  }, [user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCampana, filtroEstado, sortOrder, itemsPerPage]);

  useEffect(() => {
    if (comentariosEndRef.current) {
      comentariosEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios, activeTab]);

  useEffect(() => {
    if (isAgendarModalOpen) {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setMinDateTime(now.toISOString().slice(0, 16));
    }
  }, [isAgendarModalOpen]);

  // Sincronizar citas
  useEffect(() => {
    if (clientes.length > 0) {
      const citasDetectadas = [];
      clientes.forEach(cliente => {
        if (cliente.comentarios) {
          cliente.comentarios.forEach(comentario => {
            if (comentario.texto && comentario.texto.includes('📅 Cita agendada')) {
              // Preparado para futuro
            }
          });
        }
      });
    }
  }, [clientes]);

  // Revisor de citas
  useEffect(() => {
    const interval = setInterval(() => {
      const ahora = new Date().getTime();
      const diezMinutosMs = 10 * 60 * 1000;

      setCitasProgramadas(prevCitas => {
        let hayCambios = false;
        const citasActualizadas = prevCitas.map(cita => {
          if (!cita.notificada) {
            const tiempoRestante = cita.fecha - ahora;
            
            if (tiempoRestante > 0 && tiempoRestante <= diezMinutosMs) {
              hayCambios = true;
              
              try {
                const sonidoDeAlerta = new Audio('/alerta.mp3');
                sonidoDeAlerta.play().catch(error => console.log("Navegador bloqueó autoplay:", error));
              } catch (error) {
                console.error("Error al instanciar audio:", error);
              }

              setAlertaCita({
                show: true,
                mensaje: `Tienes una cita agendada con el cliente ${cita.clienteNombre} en menos de 10 minutos.`
              });
              
              return { ...cita, notificada: true };
            }
          }
          return cita;
        });
        return hayCambios ? citasActualizadas : prevCitas;
      });
    }, 20000); 

    return () => clearInterval(interval);
  }, []);

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
    setActiveTab('gestion');
    setIsModalOpen(true);
  };

  const lanzarNotificacionExito = (mensaje) => {
    setNotificacion({ show: true, mensaje });
    setTimeout(() => {
      setNotificacion({ show: false, mensaje: '' });
    }, 5000);
  };

  const handleGuardarCita = async (e) => {
    e.preventDefault();
    if (!fechaCita) return;

    const fechaSeleccionada = new Date(fechaCita);
    if (fechaSeleccionada <= new Date()) {
      setAlertaCita({ show: true, mensaje: "No puedes agendar una cita en una fecha u hora pasada." });
      return;
    }

    setIsLoading(true);

    try {
      const fechaFormateada = fechaSeleccionada.toLocaleString('es-ES', { 
        dateStyle: 'medium', 
        timeStyle: 'short' 
      });
      
      const textoComentario = `📅 Cita agendada para el ${fechaFormateada}.\n${notaCita ? `Nota: ${notaCita}` : ''}`;
      
      const responseComentario = await api.post(`/agente/clientes/${selectedCliente.id}/comentarios`, {
        texto: textoComentario,
        user_id: user.id,
        estado_id: nuevoEstadoId || selectedCliente.estado?.id
      });

      setComentarios([...comentarios, responseComentario.data.comentario]);
      
      setCitasProgramadas(prev => [...prev, {
        id: Date.now(),
        clienteNombre: selectedCliente.nombre,
        fecha: fechaSeleccionada.getTime(),
        notificada: false
      }]);

      await fetchMisClientes(); 
      
      setIsAgendarModalOpen(false);
      setFechaCita('');
      setNotaCita('');
      setActiveTab('citas'); 
      lanzarNotificacionExito(`Cita programada con éxito para el ${fechaFormateada}`);

    } catch (error) {
      console.error("Error al agendar la cita:", error);
      lanzarNotificacionExito("Hubo un error al guardar la cita.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setIsLoading(true);
    
    const estadoSeleccionado = estados.find(est => est.id.toString() === nuevoEstadoId.toString());

    try {
      const response = await api.post(`/agente/clientes/${selectedCliente.id}/comentarios`, {
        texto: nuevoComentario,
        user_id: user.id,
        estado_id: nuevoEstadoId
      });

      setComentarios([...comentarios, response.data.comentario]);
      setNuevoComentario('');
      await fetchMisClientes(); 
      
      setSelectedCliente(prev => ({
        ...prev,
        estado: estadoSeleccionado || prev.estado
      }));

      lanzarNotificacionExito("Gestión guardada correctamente.");

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

  const comentariosNormales = comentarios.filter(c => !c.texto?.includes('📅 Cita agendada'));
  const historialCitas = comentarios.filter(c => c.texto?.includes('📅 Cita agendada'));
  const datosPestañaActual = activeTab === 'gestion' ? comentariosNormales : historialCitas;

  // Lógica de Filtrado
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

  // NUEVO: Lógica de Ordenamiento
  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (sortOrder === 'az') return a.nombre.localeCompare(b.nombre);
    if (sortOrder === 'za') return b.nombre.localeCompare(a.nombre);
    if (sortOrder === 'newest') return b.id - a.id;
    if (sortOrder === 'oldest') return a.id - b.id;
    return 0;
  });

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroCampana('');
    setFiltroEstado('');
    setSortOrder('newest'); // Reinicia el orden
  };

  // Lógica de Paginación aplicando el arreglo ordenado
  const isAll = itemsPerPage === 'all';
  const indexOfLastItem = isAll ? clientesOrdenados.length : currentPage * itemsPerPage;
  const indexOfFirstItem = isAll ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = clientesOrdenados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = isAll ? 1 : Math.ceil(clientesOrdenados.length / itemsPerPage);

  return (
    <div className="animate-fadeIn w-full flex flex-col h-full relative">
      
      {/* 1. NOTIFICACIONES DE ÉXITO COMUNES */}
      {notificacion.show && (
        <div className="fixed bottom-6 right-6 px-5 py-4 rounded-xl shadow-2xl flex items-center gap-3 z-[100] animate-slideUp text-white bg-teal-600">
          <FiCheckCircle size={24} className="text-teal-200" />
          <span className="font-semibold text-sm max-w-[300px]">{notificacion.mensaje}</span>
        </div>
      )}

      {/* 2. ALERTA CRÍTICA INDEPENDIENTE */}
      {alertaCita.show && (
        <div className="fixed bottom-6 right-6 p-5 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-5 z-[110] animate-slideUp text-white bg-amber-600 border border-amber-500 max-w-md border-box">
          <div className="flex items-start gap-3">
            <FiBell size={28} className="text-amber-100 animate-bounce mt-0.5 shrink-0" />
            <div>
              <h5 className="text-xs font-bold text-amber-100 uppercase tracking-wider m-0">Recordatorio importante</h5>
              <p className="font-semibold text-sm leading-snug mt-1 m-0">{alertaCita.mensaje}</p>
            </div>
          </div>
          <button 
            onClick={() => setAlertaCita({ show: false, mensaje: '' })}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-800 hover:bg-amber-900 border border-amber-700 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 tracking-wide"
          >
            Entendido, Aceptar
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full flex flex-col h-full">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white w-full shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Mis Clientes Asignados</h3>
            <p className="text-xs text-slate-500 mt-1">Revisa los detalles y agrega comentarios a tu gestión</p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
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

            {/* NUEVO: SELECTOR DE ORDENAMIENTO */}
            <div className="relative w-full sm:w-44">
              <select 
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-full pl-3 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 appearance-none box-border text-slate-600 font-medium"
              >
                <option value="newest">Más recientes</option>
                <option value="oldest">Más antiguos</option>
                <option value="az">Nombre (A - Z)</option>
                <option value="za">Nombre (Z - A)</option>
              </select>
              <FiChevronDown className="absolute right-3 top-2.5 text-slate-500 pointer-events-none" />
            </div>

            {(searchTerm !== '' || filtroCampana !== '' || filtroEstado !== '' || sortOrder !== 'newest') && (
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

        {/* CONTROLES DE PAGINACIÓN */}
        <div className="p-3 px-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{clientesOrdenados.length === 0 ? 0 : indexOfFirstItem + 1}</span> a <span className="font-semibold text-slate-700">{Math.min(indexOfLastItem, clientesOrdenados.length)}</span> de <span className="font-semibold text-slate-700">{clientesOrdenados.length}</span> clientes
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6 w-20">ID</th>
                <th className="p-4">Cliente</th>
                <th className="p-4">Correo</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4">Campaña</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {currentItems.length === 0 ? (
                <tr><td colSpan="7" className="text-center p-8 text-slate-400">No se encontraron clientes con esos filtros.</td></tr>
              ) : currentItems.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400">
                    #{cliente.id}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-teal-100 text-teal-600 shrink-0 font-bold">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{cliente.nombre}</div>
                        {cliente.comentarios && cliente.comentarios.length > 0 && (
                          <div className="text-[10px] text-teal-600 font-medium flex items-center gap-1 mt-0.5">
                            <FiMessageSquare/> {cliente.comentarios.length} registros
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {cliente.email ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <FiMail className="text-slate-400 shrink-0" /> <span className="truncate">{cliente.email}</span>
                      </div>
                    ) : <span className="italic text-slate-400 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    {cliente.telefono ? (
                      <div className="flex items-center gap-2 text-slate-600">
                        <FiPhone className="text-slate-400 shrink-0" /> {cliente.telefono}
                      </div>
                    ) : <span className="italic text-slate-400 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    {cliente.campana ? (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-medium w-fit"><FiVolume2/> {cliente.campana.nombre}</span>
                    ) : <span className="italic text-slate-400 text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    {cliente.estado ? (
                      <span 
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold w-fit text-slate-700"
                        style={{ 
                          backgroundColor: `${cliente.estado.color || '#f59e0b'}26`, 
                          border: `1px solid ${cliente.estado.color || '#f59e0b'}40` 
                        }}
                      >
                        <FiTag style={{ color: cliente.estado.color || '#f59e0b' }} /> 
                        {cliente.estado.nombre}
                      </span>
                    ) : (
                      <span className="italic text-slate-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openDetalleModal(cliente)} 
                      className="px-3 py-1.5 text-teal-700 bg-teal-50 border border-teal-100 hover:bg-teal-100 rounded-lg transition-colors text-xs font-bold whitespace-nowrap"
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
                  <div 
                    className="p-3 rounded-xl border"
                    style={{ 
                      backgroundColor: `${selectedCliente.estado?.color || '#f59e0b'}26`,
                      borderColor: `${selectedCliente.estado?.color || '#f59e0b'}40`
                    }}
                  >
                    <h4 
                      className="text-[10px] font-bold uppercase tracking-wider mb-1 flex items-center gap-1"
                      style={{ color: selectedCliente.estado?.color || '#f59e0b' }} 
                    >
                      <FiTag/> Estado Actual
                    </h4>
                    <p className="font-semibold text-sm text-slate-800">
                      {selectedCliente.estado?.nombre || 'Sin estado'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={() => setIsAgendarModalOpen(true)}
                  className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 rounded-xl font-bold transition-all shadow-sm"
                >
                  <FiCalendar size={18} />
                  Agendar Cita
                </button>
              </div>

              {/* Columna Derecha (Tabs) */}
              <div className="w-full md:w-7/12 flex flex-col bg-slate-50">
                
                <div className="flex border-b border-slate-200 bg-white shrink-0">
                  <button 
                    onClick={() => setActiveTab('gestion')}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'gestion' ? 'border-teal-500 text-teal-700 bg-teal-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <FiMessageSquare className={activeTab === 'gestion' ? 'text-teal-500' : ''}/> 
                    Gestión ({comentariosNormales.length})
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
                  {datosPestañaActual.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      {activeTab === 'gestion' ? <FiMessageSquare size={32} className="opacity-20" /> : <FiCalendar size={32} className="opacity-20" />}
                      <p className="text-sm">
                        {activeTab === 'gestion' ? 'No hay gestiones registradas aún.' : 'No hay citas agendadas para este cliente.'}
                      </p>
                    </div>
                  ) : (
                    datosPestañaActual.map((comentario, index) => {
                      const agentName = comentario.user?.name || user?.name || 'Agente';
                      const initials = agentName.substring(0, 2).toUpperCase();
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      const isCita = activeTab === 'citas';
                      // Verificamos el estado de la cita usando la función inteligente
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

                {activeTab === 'gestion' && (
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
                            className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:teal-500 focus:bg-white resize-none max-h-32 min-h-[50px]"
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE AGENDAR CITA */}
      {isAgendarModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-slideUp">
            
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-900 m-0 flex items-center gap-2">
                <FiCalendar className="text-indigo-600" /> Nueva Cita
              </h3>
              <button 
                onClick={() => setIsAgendarModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm"
              >
                <FiX size={18} />
              </button>
            </div>

            <form onSubmit={handleGuardarCita} className="p-6">
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiClock /> Fecha y Hora
                </label>
                <input 
                  type="datetime-local" 
                  value={fechaCita}
                  min={minDateTime}
                  onChange={(e) => setFechaCita(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <FiMessageSquare /> Nota para la cita (Opcional)
                </label>
                <textarea 
                  value={notaCita}
                  onChange={(e) => setNotaCita(e.target.value)}
                  placeholder="Ej: Llamar para confirmar presupuesto..."
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none h-24"
                ></textarea>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button"
                  onClick={() => setIsAgendarModalOpen(false)}
                  className="flex-1 py-3 px-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={!fechaCita || isLoading}
                  className="flex-1 py-3 px-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:bg-slate-300 flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Guardando...' : 'Confirmar Cita'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default AgenteClientesView;