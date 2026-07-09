import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiCheckSquare, FiX, FiUsers, FiTag, FiVolume2, FiUser,
  FiEdit2, FiUserMinus, FiPhone, FiMail, FiEdit3, FiSave, FiCalendar, 
  FiMessageSquare, FiStar, FiCheckCircle, FiChevronLeft, FiChevronRight,
  FiTrash2, FiAlertCircle 
} from 'react-icons/fi';
import api from '../api';

const AsignacionesView = () => {
  const [clientes, setClientes] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  
  // Modales Principales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUnassignModalOpen, setIsUnassignModalOpen] = useState(false);
  const [idsToUnassign, setIdsToUnassign] = useState([]); 
  
  // ================= SISTEMA DE ALERTAS Y CONFIRMACIONES =================
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, type: 'danger' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 3500);
  };
  // =========================================================================

  // ================= MODAL FICHA DE CLIENTE =================
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCliente, setSelectedCliente] = useState(null);
  
  // Estados de edición de información general
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingEstado, setIsEditingEstado] = useState(false);
  
  const [editFormData, setEditFormData] = useState({ nombre: '', email: '', telefono: '' });
  const [isSavingInfo, setIsSavingInfo] = useState(false);
  
  // Estados para la columna derecha del modal (Comentarios y Citas)
  const [activeTab, setActiveTab] = useState('gestion');
  const [busquedaComentario, setBusquedaComentario] = useState(''); 
  const comentariosEndRef = useRef(null);
  const [isLoadingComentarios, setIsLoadingComentarios] = useState(false);

  // Estados para edición de comentarios
  const [editingComentarioId, setEditingComentarioId] = useState(null);
  const [editingComentarioText, setEditingComentarioText] = useState('');
  const [isSavingComentario, setIsSavingComentario] = useState(false);

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

  // NUEVOS ESTADOS DE PAGINACIÓN DEL SERVIDOR
  const [currentPage, setCurrentPage] = useState(1);
  const [ultimaPagina, setUltimaPagina] = useState(1);
  const [totalClientes, setTotalClientes] = useState(0);
  const [mostrarTodos, setMostrarTodos] = useState(false);

  // Listas ordenadas alfabéticamente para los selectores
  const estadosOrdenados = [...estados].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const campanasOrdenadas = [...campanas].sort((a, b) => a.nombre.localeCompare(b.nombre));
  const usuariosOrdenados = [...usuarios].sort((a, b) => a.name.localeCompare(b.name));

  useEffect(() => {
    fetchClientes(1, false); 
    fetchDatosModal();
  }, []);
  
  useEffect(() => {
    const isSortingAgente = filterAgente.startsWith('sort-');
    const isSortingCampana = filterCampana.startsWith('sort-');
    const isSortingEstado = filterEstado.startsWith('sort-');

    if (!isSortingAgente && !isSortingCampana && !isSortingEstado) {
      fetchClientes(1, mostrarTodos); 
    }
  }, [filterAgente, filterCampana, filterEstado]);

  // EFECTO PARA AUTO-SCROLL AL ÚLTIMO COMENTARIO
  useEffect(() => {
    if (isDetailModalOpen && comentariosEndRef.current) {
      // Un pequeño timeout asegura que el DOM ya se pintó antes de hacer scroll
      const timeout = setTimeout(() => {
        comentariosEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isDetailModalOpen, selectedCliente?.comentarios, activeTab, busquedaComentario]);

  const fetchClientes = async (page = 1, fetchAll = false) => {
    try {
      const params = new URLSearchParams();
      if (!fetchAll) params.append('page', page);
      if (fetchAll) params.append('all', 'true');
      
      if (filterAgente && filterAgente !== 'sort-asc' && filterAgente !== 'sort-desc') {
        params.append('agente_id', filterAgente);
      }
      if (filterCampana && filterCampana !== 'sort-asc' && filterCampana !== 'sort-desc') {
        params.append('campana_id', filterCampana);
      }
      if (filterEstado && filterEstado !== 'sort-asc' && filterEstado !== 'sort-desc') {
        params.append('estado_id', filterEstado);
      }

      const response = await api.get(`/clientes?${params.toString()}`);
      
      if (response.data && Array.isArray(response.data.data)) {
        setClientes(response.data.data);
        setCurrentPage(response.data.current_page || 1);
        setUltimaPagina(response.data.last_page || 1);
        setTotalClientes(response.data.total || 0);
      } else if (Array.isArray(response.data)) {
        setClientes(response.data);
        setTotalClientes(response.data.length);
      } else {
        setClientes([]);
        setTotalClientes(0);
      }
    } catch (error) {
      console.error("Error al cargar clientes:", error);
      setClientes([]);
      showToast('Error al cargar la base de datos', 'error');
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

  const clientesFiltrados = (Array.isArray(clientes) ? clientes : [])
    .filter(cliente => {
      const matchSearch = 
        cliente.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        cliente.id?.toString().includes(searchTerm) ||
        cliente.telefono?.toString().includes(searchTerm);
      
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

      // AQUÍ SE ORDENA POR FECHA DE ÚLTIMA MODIFICACIÓN (los más recientes primero)
      const dateA = new Date(a.updated_at || a.created_at || a.id).getTime();
      const dateB = new Date(b.updated_at || b.created_at || b.id).getTime();
      return dateB - dateA;
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
      await fetchClientes(currentPage, mostrarTodos); 
      setSelectedIds([]); 
      setIsModalOpen(false);
      showToast('Asignación procesada y guardada exitosamente.', 'success');
      
      // Si el modal de detalle está abierto y modificamos ese cliente específico, lo refrescamos
      if (isDetailModalOpen && selectedCliente && selectedIds.includes(selectedCliente.id)) {
        openDetailModal({id: selectedCliente.id});
      }

    } catch (error) {
      console.error("Error en la asignación:", error);
      showToast('Ocurrió un error al procesar la asignación.', 'error');
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
      await fetchClientes(currentPage, mostrarTodos); 
      setSelectedIds([]);
      setIdsToUnassign([]);
      setIsUnassignModalOpen(false);
      showToast('Las asignaciones fueron removidas con éxito.', 'success');
    } catch (error) {
      console.error("Error al remover asignaciones:", error);
      showToast('Error al intentar remover asignaciones.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ======================= LÓGICA FICHA DE CLIENTE =======================
  
  const openDetailModal = async (clienteToLoad) => {
    // Si viene de la tabla tiene datos basicos, si viene de refresco puede ser solo el ID
    setSelectedCliente(clienteToLoad);
    setIsEditingInfo(false);
    setIsEditingEstado(false); 
    setActiveTab('gestion');
    setBusquedaComentario(''); 
    setIsDetailModalOpen(true);
    setIsLoadingComentarios(true);

    try {
      const response = await api.get(`/clientes/${clienteToLoad.id}`);
      const dataClienteCompleto = response.data.cliente || response.data;
      if (dataClienteCompleto) {
        setSelectedCliente(prev => ({ ...prev, ...dataClienteCompleto }));
        setEditFormData({
          nombre: dataClienteCompleto.nombre || '',
          email: dataClienteCompleto.email || dataClienteCompleto.correo || '',
          telefono: dataClienteCompleto.telefono || ''
        });
      }
    } catch (error) {
      console.error("Error al cargar el historial del cliente:", error);
    } finally {
      setIsLoadingComentarios(false);
    }
  };

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    
    setConfirmDialog({
      isOpen: true,
      title: '¿Guardar Cambios?',
      message: 'Estás a punto de actualizar la información de contacto de este cliente.',
      type: 'info',
      onConfirm: async () => {
        setIsSavingInfo(true);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          const payload = {
            nombre: editFormData.nombre,
            email: editFormData.email,
            telefono: editFormData.telefono
          };
          await api.put(`/clientes/${selectedCliente.id}`, payload);
          setSelectedCliente({ ...selectedCliente, ...payload });
          await fetchClientes(currentPage, mostrarTodos); 
          setIsEditingInfo(false);
          showToast('Información del cliente actualizada correctamente.', 'success');
        } catch (error) {
          console.error("Error al actualizar información del cliente:", error);
          showToast('Error al guardar la información.', 'error');
        } finally {
          setIsSavingInfo(false);
        }
      }
    });
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
      await fetchClientes(currentPage, mostrarTodos); 
      showToast('Estado del cliente modificado exitosamente.', 'success');
    } catch (error) {
      console.error("Error al actualizar el estado:", error);
      showToast('Ocurrió un error al cambiar el estado.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // ================= FUNCIONES PARA EDITAR / BORRAR COMENTARIOS =================
  const startEditingComentario = (comentario) => {
    setEditingComentarioId(comentario.id);
    setEditingComentarioText(comentario.texto);
  };

  const cancelEditingComentario = () => {
    setEditingComentarioId(null);
    setEditingComentarioText('');
  };

  const handleUpdateComentario = async (comentarioId) => {
    if (!editingComentarioText.trim()) return;
    setIsSavingComentario(true);
    try {
      const response = await api.put(`/comentarios/${comentarioId}`, { texto: editingComentarioText });
      const updatedComentarioData = response.data.comentario;
      
      const updatedComentarios = selectedCliente.comentarios.map(c => 
        c.id === comentarioId ? { ...c, texto: editingComentarioText, updated_at: updatedComentarioData?.updated_at || new Date().toISOString() } : c
      );
      
      setSelectedCliente({ ...selectedCliente, comentarios: updatedComentarios });
      setEditingComentarioId(null);
      setEditingComentarioText('');
      showToast('El comentario ha sido editado y guardado.', 'success');
    } catch (error) {
      console.error("Error al actualizar el comentario:", error);
      showToast('Error al intentar editar el comentario.', 'error');
    } finally {
      setIsSavingComentario(false);
    }
  };

  const handleDeleteComentario = (comentarioId) => {
    setConfirmDialog({
      isOpen: true,
      title: '¿Eliminar Gestión?',
      message: '¿Estás seguro de que deseas eliminar permanentemente este comentario o gestión? Esta acción no se puede deshacer.',
      type: 'danger',
      onConfirm: async () => {
        setIsLoadingComentarios(true);
        setConfirmDialog({ ...confirmDialog, isOpen: false });
        try {
          await api.delete(`/comentarios/${comentarioId}`);
          const updatedComentarios = selectedCliente.comentarios.filter(c => c.id !== comentarioId);
          setSelectedCliente({ ...selectedCliente, comentarios: updatedComentarios });
          showToast('Registro eliminado correctamente.', 'success');
        } catch (error) {
          console.error("Error al eliminar el comentario:", error);
          showToast('Ocurrió un error al intentar eliminar el registro.', 'error');
        } finally {
          setIsLoadingComentarios(false);
        }
      }
    });
  };

  const verificarCitaPendiente = (texto) => {
    if (!texto) return false;
    const txt = texto.toLowerCase();
    return txt.includes('agendada') || txt.includes('pendiente') || txt.includes('programada');
  };

  const getStatusBadge = (estado, texto = '') => {
    if (texto.includes('Asignado a:')) return "bg-indigo-100 text-indigo-700 border-indigo-200 border";
    
    if (!estado) return "bg-slate-100 text-slate-700";
    const est = estado.toLowerCase();
    if (est.includes('pendiente') || est.includes('agendada')) return "bg-amber-100 text-amber-700";
    if (est.includes('completada') || est.includes('asistió')) return "bg-emerald-100 text-emerald-700";
    if (est.includes('cancelada') || est.includes('no asistió')) return "bg-red-100 text-red-700";
    return "bg-slate-100 text-slate-700";
  };

  const comentarios = [...(selectedCliente?.comentarios || [])].sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
    const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
    return dateA - dateB; 
  });

  const comentariosNormales = comentarios.filter(c => c.tipo !== 'cita' && !c.es_cita);
  const historialCitas = comentarios.filter(c => c.tipo === 'cita' || c.es_cita);
  const datosPestañaActual = activeTab === 'gestion' ? comentariosNormales : historialCitas;

  // LÓGICA DE FILTRADO PARA COMENTARIOS
  const datosMostrados = datosPestañaActual.filter(c => {
    if (!busquedaComentario) return true;
    const searchLower = busquedaComentario.toLowerCase();
    return (
      c.texto?.toLowerCase().includes(searchLower) ||
      c.user?.name?.toLowerCase().includes(searchLower) ||
      (c.estado && c.estado.toLowerCase().includes(searchLower))
    );
  });

  const isAllFilteredSelected = clientesFiltrados.length > 0 && clientesFiltrados.every(c => selectedIds.includes(c.id));
  const hasActiveFilters = searchTerm || sortCliente || filterAgente || filterCampana || filterEstado;

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
      
      {/* ================= TOAST NOTIFICATION ================= */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-[80] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border animate-slideUp transition-all ${
          toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 
          toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : 
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          {toast.type === 'success' ? <FiCheckCircle size={22} className="text-emerald-500" /> : <FiAlertCircle size={22} className="text-red-500" />}
          <p className="text-sm font-bold">{toast.message}</p>
          <button onClick={() => setToast({...toast, show: false})} className="ml-3 text-slate-400 hover:text-slate-700 transition-colors">
            <FiX size={18}/>
          </button>
        </div>
      )}

      {/* ================= MODAL DE CONFIRMACIÓN CUSTOM ================= */}
      {confirmDialog.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[90] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm mx-auto border ${
                confirmDialog.type === 'danger' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-teal-50 text-teal-600 border-teal-100'
              }`}>
                {confirmDialog.type === 'danger' ? <FiTrash2 /> : <FiSave />}
              </div>
              <h3 className="text-xl font-bold text-slate-900 m-0">{confirmDialog.title}</h3>
              <p className="text-sm text-slate-500 mt-2 font-medium">{confirmDialog.message}</p>
            </div>
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })} 
                className="flex-1 p-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-sm transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDialog.onConfirm} 
                className={`flex-1 p-2.5 font-bold rounded-xl text-sm transition-colors text-white shadow-sm ${
                  confirmDialog.type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-teal-600 hover:bg-teal-700'
                }`}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= INTERFAZ PRINCIPAL ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full relative z-0 flex flex-col h-full">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 bg-white w-full flex flex-col gap-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                Asignación de Clientes
                <span className="text-sm font-semibold bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {clientesFiltrados.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 font-medium">
                {mostrarTodos 
                  ? "Viendo todos los registros de la base de datos"
                  : hasActiveFilters 
                    ? `Filtrados: ${clientesFiltrados.length} clientes en esta página` 
                    : `Gestión de asignaciones (Página ${currentPage} de ${ultimaPagina})`
                }
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
              <input type="text" placeholder="Buscar por nombre, ID o teléfono..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-500 box-border"/>
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

        {/* CONTROLES DE PAGINACIÓN CONECTADOS AL BACKEND */}
        <div className="p-3 px-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-slate-500">
            <div>
              Mostrando <span className="font-semibold text-slate-700">{clientesFiltrados.length}</span> resultados. 
              (Total Base de Datos: <span className="font-semibold text-indigo-600">{totalClientes}</span>)
            </div>

            <button 
              onClick={() => {
                const activar = !mostrarTodos;
                setMostrarTodos(activar);
                fetchClientes(1, activar);
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors border ${mostrarTodos ? 'bg-indigo-100 text-indigo-700 border-indigo-200 shadow-inner' : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100 shadow-sm'}`}
            >
              {mostrarTodos ? 'Desactivar "Ver Todos"' : 'Ver Todos los Registros'}
            </button>
          </div>

          {!mostrarTodos && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchClientes(currentPage - 1, false)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiChevronLeft /> Anterior
              </button>
              <span className="text-sm font-semibold text-slate-600 px-2">
                Página {currentPage} de {ultimaPagina}
              </span>
              <button
                onClick={() => fetchClientes(currentPage + 1, false)}
                disabled={currentPage === ultimaPagina}
                className="flex items-center gap-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm font-medium bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente <FiChevronRight />
              </button>
            </div>
          )}
        </div>

        {/* TABLA DE ASIGNACIONES */}
        <div className="w-full overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[1100px]">
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
              <th className="p-4">Última Modificación</th>
              <th className="p-4 text-center w-28">Acciones</th>
            </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientesFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="11" className="text-center p-8 text-slate-400">
                    {clientes.length === 0 ? 'No hay clientes para mostrar en esta página.' : 'No se encontraron clientes con esos filtros en esta página.'}
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
                    <td className="p-4 text-sm text-slate-600 font-medium">
                      {cliente.updated_at 
                        ? new Date(cliente.updated_at).toLocaleDateString('es-ES', {
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

                {/* ================= AGENTE ACTUAL ================= */}
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                        <FiUser/> Agente Actual
                      </h4>
                      <p className="text-indigo-900 font-bold text-base">
                        {selectedCliente.user ? selectedCliente.user.name : <span className="text-indigo-400 font-medium italic text-sm">Sin asignar</span>}
                      </p>
                    </div>
                  </div>
                </div>
                {/* ====================================================================== */}

                <label 
                  className={`mt-1 w-full flex items-center justify-between px-4 py-3 border rounded-xl cursor-pointer transition-all shadow-sm ${
                    selectedIds.includes(selectedCliente.id) 
                      ? 'bg-slate-800 border-slate-900 text-white' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <FiCheckSquare size={18} className={selectedIds.includes(selectedCliente.id) ? 'text-white' : 'text-slate-400'} />
                    {selectedIds.includes(selectedCliente.id) ? 'Cliente Seleccionado' : 'Seleccionar para Asignar'}
                  </div>
                  <input 
                    type="checkbox" 
                    checked={selectedIds.includes(selectedCliente.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(prev => [...prev, selectedCliente.id]);
                      } else {
                        setSelectedIds(prev => prev.filter(id => id !== selectedCliente.id));
                      }
                    }}
                    className="w-5 h-5 rounded border-slate-300 text-slate-800 focus:ring-slate-800 cursor-pointer"
                  />
                </label>

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

                {/* ================= NUEVO INPUT DE BÚSQUEDA ================= */}
                <div className="px-6 pt-4 shrink-0">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                    <input 
                      type="text" 
                      placeholder={activeTab === 'gestion' ? "Buscar asignación, agente, gestión..." : "Buscar en citas..."}
                      value={busquedaComentario}
                      onChange={(e) => setBusquedaComentario(e.target.value)}
                      className="w-full pl-10 pr-10 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 shadow-sm transition-shadow"
                    />
                    {busquedaComentario && (
                      <button 
                        onClick={() => setBusquedaComentario('')} 
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Limpiar búsqueda"
                      >
                        <FiX size={18} />
                      </button>
                    )}
                  </div>
                </div>
                {/* =========================================================== */}

                <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-slate-50 min-h-[300px]">
                  {isLoadingComentarios ? ( 
                    <div className="m-auto text-center text-slate-400">
                      <p className="text-sm font-medium animate-pulse">Cargando historial...</p>
                    </div>
                  ) : datosMostrados.length === 0 ? (
                    <div className="m-auto text-center text-slate-400 flex flex-col items-center gap-2">
                      {activeTab === 'gestion' ? <FiMessageSquare size={32} className="opacity-20" /> : <FiCalendar size={32} className="opacity-20" />}
                      <p className="text-sm">
                        {busquedaComentario 
                          ? 'No se encontraron resultados para tu búsqueda.' 
                          : (activeTab === 'gestion' ? 'No hay gestiones registradas aún.' : 'No hay citas agendadas para este cliente.')}
                      </p>
                    </div>
                  ) : (
                    datosMostrados.map((comentario, index) => {
                      const agentName = comentario.user?.name || 'Sistema';
                      const initials = agentName.substring(0, 2).toUpperCase();
                      const dateObj = comentario.created_at ? new Date(comentario.created_at) : new Date();
                      const formattedDate = dateObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                      const formattedTime = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      
                      const isCita = activeTab === 'citas';
                      const esPendiente = isCita ? verificarCitaPendiente(comentario.texto) : false;

                      // Lógica para detectar si el comentario fue editado
                      const isEdited = comentario.updated_at && comentario.updated_at !== comentario.created_at;
                      let editDateStr = '';
                      let editTimeStr = '';
                      if (isEdited) {
                        const editObj = new Date(comentario.updated_at);
                        editDateStr = editObj.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
                        editTimeStr = editObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                      }

                      return (
                        <div key={comentario.id || index} className="flex gap-3 animate-fadeIn">
                          <div className="flex-shrink-0">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm border ${isCita ? 'bg-indigo-100 text-indigo-700 border-indigo-50' : (comentario.estado === 'Sistema' ? 'bg-slate-200 text-slate-700 border-slate-300' : 'bg-teal-100 text-teal-700 border-teal-50')}`}>
                              {initials}
                            </div>
                          </div>

                          <div className={`flex-1 bg-white border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow ${isCita ? 'border-indigo-100' : (comentario.estado === 'Sistema' ? 'border-slate-300 bg-slate-50/50' : 'border-slate-200')}`}>
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="text-base font-bold text-slate-900">{agentName}</h4>
                                
                                <span className={`mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${getStatusBadge(comentario.estado, comentario.texto)}`}>
                                  {isCita && (
                                    esPendiente 
                                      ? <FiStar className="text-amber-500 animate-pulse" size={14} /> 
                                      : <FiCheckCircle className="text-emerald-500" size={14} />
                                  )}
                                  {comentario.estado || (isCita ? (esPendiente ? 'Cita Pendiente' : 'Completada / Pasada') : 'Gestión Registrada')}
                                </span>
                              </div>
                              <div className="text-right flex flex-col items-end">
                                <div className="text-sm font-semibold text-slate-500 capitalize">{formattedDate}</div>
                                <div className="text-xs text-slate-400 mt-0.5 font-medium">{formattedTime}</div>
                                
                                {/* Etiqueta de hora de edición */}
                                {isEdited && (
                                  <div className="text-[10px] text-teal-600 mt-1 font-medium italic bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100" title="Última modificación">
                                    Editado: {editDateStr} {editTimeStr}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* ================= ZONA DE TEXTO Y EDICIÓN ================= */}
                            {editingComentarioId === comentario.id ? (
                              <div className="mt-4 animate-fadeIn">
                                <textarea
                                  autoFocus
                                  value={editingComentarioText}
                                  onChange={(e) => setEditingComentarioText(e.target.value)}
                                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-sm text-slate-700 focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none resize-none min-h-[100px]"
                                />
                                <div className="flex gap-2 mt-3 justify-end">
                                  <button
                                    onClick={cancelEditingComentario}
                                    disabled={isSavingComentario}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleUpdateComentario(comentario.id)}
                                    disabled={isSavingComentario || !editingComentarioText.trim()}
                                    className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                  >
                                    {isSavingComentario ? 'Guardando...' : <><FiSave size={14}/> Guardar</>}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="group relative">
                                <p className="mt-4 text-base text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                                  {comentario.texto}
                                </p>
                                
                                {/* BOTONES DE EDICIÓN Y BORRADO (Ocultos para logs del sistema) */}
                                {comentario.estado !== 'Sistema' && (
                                  <div className="absolute -bottom-2 right-0 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 bg-white pl-4">
                                    <button
                                      onClick={() => startEditingComentario(comentario)}
                                      className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 font-semibold transition-colors bg-white px-2 py-1 rounded shadow-sm border border-slate-100"
                                      title="Editar comentario"
                                    >
                                      <FiEdit2 size={12} /> Editar
                                    </button>
                                    <button
                                      onClick={() => handleDeleteComentario(comentario.id)}
                                      className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 font-semibold transition-colors bg-white px-2 py-1 rounded shadow-sm border border-slate-100"
                                      title="Borrar comentario"
                                    >
                                      <FiTrash2 size={12} /> Borrar
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}

                          </div>
                        </div>
                      );
                    })
                  )}
                  {/* Este div invisible nos permite hacer el scroll al fondo */}
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