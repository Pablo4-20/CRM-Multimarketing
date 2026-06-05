import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX, FiUser, FiMail, FiPhone, FiVolume2, FiTag, FiSend, FiClock, FiMessageSquare } from 'react-icons/fi';

const AgenteClientesView = ({ user }) => {
  const [clientes, setClientes] = useState([]);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Nuevos estados para el manejo de comentarios
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Referencia para hacer scroll automático al último comentario
  const comentariosEndRef = useRef(null);

  useEffect(() => {
    if (user?.id) {
      fetchMisClientes();
    }
  }, [user]);

  // Hacer scroll automático hacia abajo cuando se cargan o añaden comentarios
  useEffect(() => {
    if (comentariosEndRef.current) {
      comentariosEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comentarios]);

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
    // Asumimos que el backend retorna los comentarios en la relación "comentarios"
    setComentarios(cliente.comentarios || []); 
    setNuevoComentario('');
    setIsModalOpen(true);
  };

  const handleEnviarComentario = async (e) => {
    e.preventDefault();
    if (!nuevoComentario.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`http://127.0.0.1:8000/api/agente/clientes/${selectedCliente.id}/comentarios`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          texto: nuevoComentario, // Tu controlador espera "texto"
          user_id: user.id
        })
      });

      if (response.ok) {
        const data = await response.json();
        setComentarios([...comentarios, data.comentario]);
        setNuevoComentario('');
        await fetchMisClientes(); 
      }
    } catch (error) {
      console.error("Error al guardar el comentario:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Diseño visual de las etiquetas de estado del historial
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
                        {/* Muestra un icono si el cliente tiene comentarios */}
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

      {/* MODAL DE DETALLE Y COMENTARIOS */}
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
              
              {/* Columna Izquierda: Información del Cliente */}
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
                    <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1"><FiTag/> Estado</h4>
                    <p className="text-amber-800 font-semibold text-sm">{selectedCliente.estado?.nombre || 'Sin estado'}</p>
                  </div>
                </div>
              </div>

              {/* Columna Derecha: NUEVO DISEÑO TIMELINE */}
              <div className="w-full md:w-7/12 flex flex-col bg-slate-50">
                
                {/* Cabecera del muro */}
                <div className="p-4 border-b border-slate-200 bg-white shrink-0">
                  <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <FiMessageSquare className="text-teal-500"/> Historial de Gestión
                  </h4>
                </div>

                {/* Lista de comentarios (Scrollable) */}
                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50 min-h-[300px]">
                  {comentarios.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      <FiMessageSquare size={32} className="opacity-20" />
                      <p className="text-sm">No hay gestiones registradas aún. Sé el primero en escribir.</p>
                    </div>
                  ) : (
                    comentarios.map((comentario, index) => {
                      // Extraemos las iniciales del agente
                      const agentName = comentario.user?.name || user?.name || 'Agente';
                      const initials = agentName.substring(0, 2).toUpperCase();
                      
                      // Formateo de Fecha
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

                      return (
                        <div key={comentario.id || index} className="flex gap-3 animate-fadeIn">
                          
                          {/* AVATAR EXTERNO */}
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center font-bold text-sm shadow-sm border border-teal-50">
                              {initials}
                            </div>
                          </div>

                          {/* TARJETA DE GESTIÓN */}
<div className="flex-1 bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
  
  {/* Cabecera (Nombre, Etiqueta, Fecha y Hora) */}
  <div className="flex justify-between items-start">
    <div>
      {/* Nombre del Agente: Cambiado de text-sm a text-base (más grande) */}
      <h4 className="text-base font-bold text-slate-900">{agentName}</h4>
      
      {/* Etiqueta de estado: Cambiado de text-[10px] a text-xs */}
      <span className={`mt-1.5 inline-block px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(comentario.estado)}`}>
        {comentario.estado || 'Gestión Registrada'}
      </span>
    </div>
    
    <div className="text-right">
      {/* Fecha: Cambiado de text-xs a text-sm */}
      <div className="text-sm font-semibold text-slate-500 capitalize">
        {formattedDate}
      </div>
      {/* Hora: Cambiado de text-[11px] a text-xs */}
      <div className="text-xs text-slate-400 mt-0.5 font-medium">
        {formattedTime}
      </div>
    </div>
  </div>

  {/* Texto del comentario: Cambiado de text-sm a text-base (16px) y un gris más oscuro (slate-800) para mejor lectura */}
  <p className="mt-4 text-base text-slate-800 leading-relaxed whitespace-pre-wrap">
    {comentario.texto}
  </p>

</div>
                        </div>
                      );
                    })
                  )}
                  <div ref={comentariosEndRef} />
                </div>

                {/* Caja para escribir nuevo comentario */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <form onSubmit={handleEnviarComentario} className="flex items-end gap-2">
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
                      <div className="absolute right-2 bottom-[-20px] text-[10px] text-slate-400">
                        Presiona Enter para enviar, Shift+Enter para nueva línea
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      disabled={isLoading || !nuevoComentario.trim()} 
                      className="p-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl transition-colors shadow-sm disabled:bg-teal-300 disabled:cursor-not-allowed shrink-0 h-[50px] w-[50px] flex items-center justify-center"
                    >
                      <FiSend className={isLoading ? "animate-pulse" : ""} />
                    </button>
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