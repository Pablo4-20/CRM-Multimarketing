import { useState, useEffect } from 'react';
import { 
  FiSearch, FiX, FiUser, FiMessageSquare, FiCalendar, 
  FiClock, FiCheckCircle, FiStar, FiActivity, FiMail, FiTarget,
  FiEdit2, FiTrash2, FiSave, FiAlertTriangle
} from 'react-icons/fi';
import api from '../api';

const verificarCitaPendiente = (texto) => {
  if (!texto) return false;
  try {
    const matchNumerico = texto.match(/para el (\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4}),?\s+(\d{1,2}):(\d{2})/);
    if (matchNumerico) {
      return new Date(matchNumerico[3], matchNumerico[2] - 1, matchNumerico[1], matchNumerico[4], matchNumerico[5]) > new Date();
    }
    const matchTexto = texto.match(/para el (\d{1,2})\s+(?:de\s+)?([a-zA-Z]{3})[a-zA-Z\.]*\s+(?:de\s+)?(\d{4}),?\s+(\d{1,2}):(\d{2})/i);
    if (matchTexto) {
      const meses = {"ene":0,"feb":1,"mar":2,"abr":3,"may":4,"jun":5,"jul":6,"ago":7,"sep":8,"oct":9,"nov":10,"dic":11};
      return new Date(matchTexto[3], meses[matchTexto[2].toLowerCase()] || 0, matchTexto[1], matchTexto[4], matchTexto[5]) > new Date();
    }
  } catch (e) { console.error("Error parseando fecha:", e); }
  return false; 
};

const SeguimientoAgentesView = ({ user }) => {
  const [agentes, setAgentes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // ESTADO: ORDENAMIENTO
  const [orden, setOrden] = useState('');
  
  // Estados para el Modal Principal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAgente, setSelectedAgente] = useState(null);
  const [actividad, setActividad] = useState([]);
  const [activeTab, setActiveTab] = useState('gestion');
  const [isLoading, setIsLoading] = useState(false);

  // ESTADOS: EDICIÓN Y ELIMINACIÓN DE COMENTARIOS
  const [editingComentarioId, setEditingComentarioId] = useState(null);
  const [editText, setEditText] = useState('');
  const [comentarioToDelete, setComentarioToDelete] = useState(null);
  const [isDeleteComentarioModalOpen, setIsDeleteComentarioModalOpen] = useState(false);

  // ESTADO: ALERTA (TOAST)
  const [alerta, setAlerta] = useState(null);

  // Función para mostrar alertas temporalmente
  const mostrarAlerta = (tipo, mensaje) => {
    setAlerta({ tipo, mensaje });
    setTimeout(() => setAlerta(null), 3000);
  };

  useEffect(() => {
    fetchAgentes();
  }, []);

  const fetchAgentes = async () => {
    try {
      const response = await api.get('/users');
      const soloAgentes = response.data.filter(u => u.role === 'agente');
      setAgentes(soloAgentes);
    } catch (error) { console.error("Error al cargar agentes:", error); }
  };

  const openDetalleModal = async (agente) => {
    setSelectedAgente(agente);
    setActiveTab('gestion');
    setIsModalOpen(true);
    setIsLoading(true);
    setEditingComentarioId(null);
    
    try {
      const response = await api.get(`/users/${agente.id}/actividad`);
      setActividad(response.data);
    } catch (error) { console.error("Error al cargar actividad:", error); }
    finally { setIsLoading(false); }
  };

  // Guardar cambios del comentario editado
  const handleSaveEdit = async (comentarioId) => {
    if (!editText.trim()) return;
    try {
      const response = await api.put(`/comentarios/${comentarioId}`, { texto: editText });
      setActividad(prev => prev.map(c => 
        c.id === comentarioId 
          ? { ...c, texto: editText, updated_at: response.data.comentario.updated_at } 
          : c
      ));
      setEditingComentarioId(null);
      mostrarAlerta('success', 'Gestión actualizada correctamente');
    } catch (error) { 
      console.error("Error al editar:", error); 
      mostrarAlerta('error', 'Error al actualizar la gestión');
    }
  };

  // Confirmar eliminación del comentario
  const handleConfirmDeleteComentario = async () => {
    if (!comentarioToDelete) return;
    try {
      await api.delete(`/comentarios/${comentarioToDelete.id}`);
      setActividad(prev => prev.filter(c => c.id !== comentarioToDelete.id));
      setIsDeleteComentarioModalOpen(false);
      setComentarioToDelete(null);
      mostrarAlerta('success', 'Registro eliminado permanentemente');
    } catch (error) { 
      console.error("Error al eliminar:", error); 
      mostrarAlerta('error', 'Error al eliminar el registro');
    }
  };

  // LÓGICA DE FILTRADO Y ORDENAMIENTO COMBINADA
  const agentesFiltrados = agentes
    .filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (a.email && a.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => {
      if (orden === 'az') return a.name.localeCompare(b.name);
      if (orden === 'za') return b.name.localeCompare(a.name);
      if (orden === 'reciente') {
        return b.created_at && a.created_at 
          ? new Date(b.created_at) - new Date(a.created_at) 
          : b.id - a.id; 
      }
      if (orden === 'antiguo') {
        return a.created_at && b.created_at 
          ? new Date(a.created_at) - new Date(b.created_at) 
          : a.id - b.id; 
      }
      return 0;
    });

  const comentariosNormales = actividad.filter(c => !c.texto?.includes('📅 Cita agendada'));
  const historialCitas = actividad.filter(c => c.texto?.includes('📅 Cita agendada'));
  const datosPestañaActual = activeTab === 'gestion' ? comentariosNormales : historialCitas;

  const getBadgeStyle = (estadoText) => {
    if (!estadoText) return 'bg-slate-100 text-slate-600 border border-slate-200';
    const text = estadoText.toLowerCase();
    if (text.includes('seguimiento')) return 'bg-blue-50 text-blue-600 border border-blue-200';
    if (text.includes('agendado')) return 'bg-emerald-50 text-emerald-600 border border-emerald-200';
    if (text.includes('vendido')) return 'bg-purple-50 text-purple-600 border border-purple-200';
    if (text.includes('contesta') || text.includes('rechaza')) return 'bg-red-50 text-red-600 border border-red-200';
    return 'bg-amber-50 text-amber-600 border border-amber-200';
  };

  return (
    <div className="animate-fadeIn w-full flex flex-col h-full relative">
      
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full flex flex-col h-full">
        {/* HEADER */}
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white w-full shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Auditoría y Seguimiento de Agentes</h3>
            <p className="text-xs text-slate-500 mt-1">Supervisa el trabajo, gestiones y citas programadas por tu equipo</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input 
                type="text" placeholder="Buscar agente por nombre..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 box-border"
              />
            </div>
            
            {/* SELECT DE ORDENAMIENTO */}
            <select
              value={orden}
              onChange={(e) => setOrden(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-600 outline-none cursor-pointer"
            >
              <option value="">Ordenar por...</option>
              <option value="reciente">Más reciente</option>
              <option value="antiguo">Más antiguo</option>
              <option value="az">Nombre (A-Z)</option>
              <option value="za">Nombre (Z-A)</option>
            </select>
          </div>
        </div>

        {/* TABLA */}
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6 w-20">ID</th>
                <th className="p-4">Datos del Agente</th>
                <th className="p-4">Rol</th>
                <th className="p-4 text-center w-40">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {agentesFiltrados.length === 0 ? (
                <tr><td colSpan="4" className="text-center p-8 text-slate-400">No se encontraron agentes.</td></tr>
              ) : agentesFiltrados.map((agente) => (
                <tr key={agente.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6 font-mono text-xs font-bold text-slate-400">#{agente.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-indigo-100 text-indigo-600 shrink-0 font-bold">
                        {agente.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900">{agente.name}</div>
                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><FiMail/> {agente.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="bg-slate-100 text-slate-600 border border-slate-200 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider">
                      {agente.role}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button 
                      onClick={() => openDetalleModal(agente)} 
                      className="px-4 py-2 text-indigo-700 bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 rounded-lg transition-colors text-xs font-bold flex items-center gap-2 justify-center w-full"
                    >
                      <FiActivity /> Ver Actividad
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PRINCIPAL DE ACTIVIDAD */}
      {isModalOpen && selectedAgente && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-[200vw] max-w-[1200px] h-[85vh] overflow-hidden animate-slideUp flex flex-col">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
              <h3 className="text-lg font-bold text-indigo-900 m-0 flex items-center gap-2">
                <FiActivity className="text-indigo-600" /> Historial de Gestiones: {selectedAgente.name}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <div className="flex-1 flex flex-col md:flex-row min-h-0">
              {/* Stats Lateral Izquierdo */}
              <div className="w-full md:w-3/12 p-6 flex flex-col gap-4 overflow-y-auto border-r border-slate-100 bg-white">
                <div className="flex flex-col items-center text-center p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl bg-indigo-100 text-indigo-600 font-bold mb-3 shadow-sm border-2 border-white">
                    {selectedAgente.name.charAt(0).toUpperCase()}
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg leading-tight">{selectedAgente.name}</h4>
                  <p className="text-xs text-slate-500 mt-1">{selectedAgente.email}</p>
                </div>

                <div className="grid grid-cols-1 gap-3 mt-2">
                  <div className="bg-teal-50 p-4 rounded-xl border border-teal-100">
                    <h4 className="text-[10px] font-bold text-teal-600 uppercase tracking-wider mb-1 flex items-center gap-1"><FiMessageSquare/> Gestiones Totales</h4>
                    <p className="text-teal-900 font-bold text-2xl">{comentariosNormales.length}</p>
                  </div>
                  <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <h4 className="text-[10px] font-bold text-purple-600 uppercase tracking-wider mb-1 flex items-center gap-1"><FiCalendar/> Citas Agendadas</h4>
                    <p className="text-purple-900 font-bold text-2xl">{historialCitas.length}</p>
                  </div>
                </div>
              </div>

              {/* Contenido / Timeline */}
              <div className="w-full md:w-9/12 flex flex-col bg-slate-50">
                <div className="flex border-b border-slate-200 bg-white shrink-0">
                  <button 
                    onClick={() => { setActiveTab('gestion'); setEditingComentarioId(null); }}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'gestion' ? 'border-teal-500 text-teal-700 bg-teal-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <FiMessageSquare /> Registro de Gestiones
                  </button>
                  <button 
                    onClick={() => { setActiveTab('citas'); setEditingComentarioId(null); }}
                    className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 border-b-2 transition-colors ${activeTab === 'citas' ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                  >
                    <FiCalendar /> Citas Programadas
                  </button>
                </div>

                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50 relative">
                  {isLoading ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400 font-medium animate-pulse">Cargando actividad...</div>
                  ) : datosPestañaActual.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      {activeTab === 'gestion' ? <FiMessageSquare size={32} className="opacity-20" /> : <FiCalendar size={32} className="opacity-20" />}
                      <p className="text-sm">El agente no tiene {activeTab === 'gestion' ? 'gestiones registradas' : 'citas agendadas'} todavía.</p>
                    </div>
                  ) : (
                    datosPestañaActual.map((comentario, index) => {
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      const isModificado = comentario.updated_at && comentario.created_at !== comentario.updated_at;
                      let formattedUpdateDate = '';
                      let formattedUpdateTime = '';
                      if (isModificado) {
                        const updateObj = new Date(comentario.updated_at);
                        formattedUpdateDate = updateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                        formattedUpdateTime = updateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      }

                      const isCita = activeTab === 'citas';
                      const esPendiente = isCita ? verificarCitaPendiente(comentario.texto) : false;
                      const nombreCliente = comentario.cliente?.nombre || 'Cliente Eliminado';

                      return (
                        <div key={comentario.id || index} className="flex gap-4 animate-fadeIn group/card">
                          <div className="flex flex-col items-center relative">
                            <div className={`w-3 h-3 rounded-full mt-1.5 z-10 ${isCita ? (esPendiente ? 'bg-amber-400 ring-4 ring-amber-100' : 'bg-emerald-400 ring-4 ring-emerald-100') : 'bg-teal-400 ring-4 ring-teal-100'}`}></div>
                            {index !== datosPestañaActual.length - 1 && <div className="w-0.5 h-full bg-slate-200 absolute top-4"></div>}
                          </div>

                          <div className={`flex-1 bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-all relative ${isCita ? 'border-indigo-100' : 'border-slate-200'}`}>
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                  <FiTarget className="text-slate-400" /> Cliente: <span className="text-slate-800">{nombreCliente}</span>
                                </h4>
                                
                                <span className={`mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${getBadgeStyle(comentario.estado)}`}>
                                  {isCita && (
                                    esPendiente 
                                      ? <FiStar className="text-amber-500 animate-pulse" size={12} /> 
                                      : <FiCheckCircle className="text-emerald-500" size={12} />
                                  )}
                                  {comentario.estado || (isCita ? (esPendiente ? 'Cita Pendiente' : 'Completada / Pasada') : 'Gestión Registrada')}
                                </span>
                              </div>

                              <div className="text-right shrink-0 flex flex-col items-end">
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Creado</div>
                                <div className="text-xs font-semibold text-slate-600 capitalize mt-0.5">{formattedDate} - {formattedTime}</div>
                                
                                {isModificado && (
                                  <div className="mt-2 text-right">
                                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">Modificado</div>
                                    <div className="text-[11px] font-medium text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded mt-0.5 flex items-center gap-1">
                                      <FiClock size={10}/> {formattedUpdateDate} - {formattedUpdateTime}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                              {editingComentarioId === comentario.id ? (
                                <div className="flex flex-col gap-2">
                                  <textarea 
                                    value={editText} onChange={(e) => setEditText(e.target.value)}
                                    className="w-full p-2.5 text-sm border border-indigo-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                                    rows="3"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button onClick={() => setEditingComentarioId(null)} className="px-3 py-1.5 bg-slate-200 text-slate-600 rounded-lg text-xs font-bold">Cancelar</button>
                                    <button onClick={() => handleSaveEdit(comentario.id)} className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"><FiSave/> Guardar</button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">{comentario.texto}</p>
                              )}
                            </div>

                            {editingComentarioId !== comentario.id && (
                              <div className="absolute bottom-3 right-4 flex items-center gap-1.5 opacity-0 group-hover/card:opacity-100 transition-opacity bg-white/90 p-1 rounded-lg shadow-sm border border-slate-100">
                                <button 
                                  onClick={() => { setEditingComentarioId(comentario.id); setEditText(comentario.texto); }} 
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors" title="Editar Registro"
                                >
                                  <FiEdit2 size={13} />
                                </button>
                                <button 
                                  onClick={() => { setComentarioToDelete(comentario); setIsDeleteComentarioModalOpen(true); }} 
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors" title="Eliminar Registro"
                                >
                                  <FiTrash2 size={13} />
                                </button>
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INTERNO: CONFIRMAR ELIMINACIÓN DE COMENTARIO */}
      {isDeleteComentarioModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 bg-red-50 flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-xl mb-3 border border-red-200">
                <FiAlertTriangle />
              </div>
              <h4 className="text-lg font-bold text-red-900 m-0">¿Eliminar registro de gestión?</h4>
              <p className="text-xs text-red-600 mt-1.5 font-medium">Esta acción auditable borrará el comentario del historial permanentemente.</p>
            </div>
            <div className="p-4 flex gap-3 bg-slate-50 border-t border-slate-100">
              <button onClick={() => { setIsDeleteComentarioModalOpen(false); setComentarioToDelete(null); }} className="flex-1 py-2 px-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs">Cancelar</button>
              <button onClick={handleConfirmDeleteComentario} className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm">Confirmar y Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENTE FLOTANTE DE ALERTA (TOAST) - AHORA SUPERIOR */}
      {alerta && (
        <div className={`fixed top-6 right-6 z-[200] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-fadeIn transition-all duration-300 ${
          alerta.tipo === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
            alerta.tipo === 'success' ? 'bg-emerald-100' : 'bg-red-100'
          }`}>
            {alerta.tipo === 'success' 
              ? <FiCheckCircle size={18} className="text-emerald-600" /> 
              : <FiAlertTriangle size={18} className="text-red-600" />
            }
          </div>
          <p className="text-sm font-bold m-0">{alerta.mensaje}</p>
          <button 
            onClick={() => setAlerta(null)} 
            className="ml-4 opacity-50 hover:opacity-100 transition-opacity"
          >
            <FiX size={16} />
          </button>
        </div>
      )}

    </div>
  );
};

export default SeguimientoAgentesView;