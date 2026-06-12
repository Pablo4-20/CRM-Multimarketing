import { useState, useEffect } from 'react';
import { 
  FiSearch, FiX, FiUploadCloud, 
  FiEdit2, FiTrash2, FiUsers, FiDownload, FiAlertTriangle, FiMail, FiPhone, FiVolume2,
  FiTag, FiUser, FiChevronLeft, FiChevronRight, FiChevronDown, FiCheckCircle
} from 'react-icons/fi';
import * as XLSX from 'xlsx';
import api from '../api';

const ClientesView = ({ user }) => {
  const storedUser = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const activeUser = user || storedUser;
  const isSuperAdmin = activeUser?.role === 'super-admin';

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // NUEVO: Estados para el modal de resultados de carga
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [uploadResult, setUploadResult] = useState({ creados: 0, omitidos_conteo: 0 });
  const [omitidosList, setOmitidosList] = useState([]);       

  const [errorMessage, setErrorMessage] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]); 
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [estados, setEstados] = useState([]);
  const [agentes, setAgentes] = useState([]);
  const [importData, setImportData] = useState({ campana_id: '', estado_id: '', agente_id: '' });
  const [importError, setImportError] = useState(null);

  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', campana_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCampana, setFiltroCampana] = useState('');
  const [sortOrder, setSortOrder] = useState('newest'); 

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50); 

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
    
    if (!isSuperAdmin) {
      fetchEstados();
      fetchAgentes();
    }
  }, [isSuperAdmin]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filtroCampana, sortOrder, itemsPerPage]);

  const fetchClientes = async () => {
    try {
      const response = await api.get('/clientes');
      setClientes(response.data);
    } catch (error) { console.error("Error:", error); }
  };

  const fetchCampanas = async () => {
    try {
      const response = await api.get('/campanas');
      setCampanas(response.data);
    } catch (error) { console.error("Error:", error); }
  };

  const fetchEstados = async () => {
    try {
      const response = await api.get('/estados');
      setEstados(response.data);
    } catch (error) { console.error("Error:", error); }
  };

  const fetchAgentes = async () => {
    try {
      const response = await api.get('/users');
      setAgentes(response.data);
    } catch (error) { console.error("Error:", error); }
  };

  const openUploadModal = () => {
    setSelectedFile(null);
    setImportError(null);
    setImportData({ campana_id: '', estado_id: '', agente_id: '' });
    setIsUploadModalOpen(true);
  };

  const openEditModal = (cliente) => {
    setEditingId(cliente.id);
    setFormData({ 
      nombre: cliente.nombre, 
      email: cliente.email || '', 
      telefono: cliente.telefono || '',
      campana_id: cliente.campana_id || ''
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (cliente) => {
    setClienteToDelete(cliente);
    setIsDeleteModalOpen(true);
  };

  const handleUploadSave = (e) => {
    e.preventDefault();
    setImportError(null);
    setOmitidosList([]);

    if (!selectedFile) {
      setImportError("Debes seleccionar un archivo Excel para continuar.");
      return; 
    }

    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const clientesAEnviar = [];

        jsonData.forEach((row) => {
          const nombre = row['Nombre'] || row['nombre'] || row['NOMBRE'] || '';
          const email = row['Email'] || row['email'] || row['EMAIL'] || '';
          const telefono = row['Telefono'] || row['telefono'] || row['Teléfono'] || row['teléfono'] || '';
          
          if (nombre) {
            if (isSuperAdmin) {
              const campana = row['Campaña'] || row['campaña'] || row['Campana'] || row['campana'] || '';
              const estadoExcel = row['Estado'] || row['estado'] || ''; 
              
              clientesAEnviar.push({ 
                nombre: String(nombre).trim(), 
                email: String(email).trim(), 
                telefono: String(telefono).trim(),
                campana: String(campana).trim(), 
                estado: String(estadoExcel).trim(),
                user_id: activeUser?.id 
              });
            } else {
              clientesAEnviar.push({ 
                nombre: String(nombre).trim(), 
                email: String(email).trim(), 
                telefono: String(telefono).trim(),
                campana_id: importData.campana_id || null,
                estado_id: importData.estado_id || null,
                user_id: importData.agente_id || activeUser?.id 
              });
            }
          }
        });

        if (clientesAEnviar.length > 0) {
          const response = await api.post('/clientes/masivo', { clientes: clientesAEnviar });
          await fetchClientes(); 
          if (isSuperAdmin) await fetchCampanas(); 
          
          // Guardar resultados para el modal de resumen
          setUploadResult({
            creados: response.data.creados,
            omitidos_conteo: response.data.omitidos_conteo
          });
          setOmitidosList(response.data.omitidos || []);
          
          setIsUploadModalOpen(false); // Cierra el modal de carga
          setSelectedFile(null);
          setIsResultModalOpen(true);  // Abre el modal de resultados

        } else {
          setImportError("El archivo Excel está vacío o le falta la columna 'Nombre'.");
        }
      } catch (error) {
        console.error("Error leyendo Excel:", error);
        setImportError("Hubo un error de lectura o procesamiento con el archivo Excel enviado.");
      } finally {
        setIsLoading(false);
      }
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const datosEjemplo = isSuperAdmin
      ? [
          { Nombre: "Juan Perez", Email: "juan@ejemplo.com", Telefono: "0991234567", Campaña: "Promoción Black Friday", Estado: "Nuevo" },
          { Nombre: "Maria Lopez", Email: "maria@ejemplo.com", Telefono: "0987654321", Campaña: "Reactivación Clientes", Estado: "En Seguimiento" }
        ]
      : [
          { Nombre: "Juan Perez", Email: "juan@ejemplo.com", Telefono: "0991234567" },
          { Nombre: "Maria Lopez", Email: "maria@ejemplo.com", Telefono: "0987654321" }
        ];

    const hoja = XLSX.utils.json_to_sheet(datosEjemplo);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Clientes");
    XLSX.writeFile(libro, "Plantilla_Clientes.xlsx");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.nombre) return;
    setIsLoading(true);
    try {
      await api.put(`/clientes/${editingId}`, formData);
      await fetchClientes();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error("Error al editar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!clienteToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/clientes/${clienteToDelete.id}`);
      await fetchClientes();
      setIsDeleteModalOpen(false);
      setClienteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroCampana('');
    setSortOrder('newest'); 
  };

  const clientesFiltrados = clientes.filter(cliente => {
    const searchLower = searchTerm.toLowerCase();
    const matchTexto = 
      (cliente.nombre && cliente.nombre.toLowerCase().includes(searchLower)) ||
      (cliente.telefono && cliente.telefono.includes(searchTerm));

    const matchCampana = filtroCampana ? 
      (cliente.campana?.id.toString() === filtroCampana.toString() || cliente.campana_id?.toString() === filtroCampana.toString()) 
      : true;

    return matchTexto && matchCampana;
  });

  const clientesOrdenados = [...clientesFiltrados].sort((a, b) => {
    if (sortOrder === 'az') return a.nombre.localeCompare(b.nombre);
    if (sortOrder === 'za') return b.nombre.localeCompare(a.nombre);
    if (sortOrder === 'newest') return b.id - a.id;
    if (sortOrder === 'oldest') return a.id - b.id;
    return 0;
  });

  const isAll = itemsPerPage === 'all';
  const indexOfLastItem = isAll ? clientesOrdenados.length : currentPage * itemsPerPage;
  const indexOfFirstItem = isAll ? 0 : indexOfLastItem - itemsPerPage;
  const currentItems = clientesOrdenados.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = isAll ? 1 : Math.ceil(clientesOrdenados.length / itemsPerPage);

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full flex flex-col h-full">
        
        {/* HEADER Y FILTROS */}
        <div className="p-5 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white w-full shrink-0">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Clientes</h3>
            <p className="text-xs text-slate-500 mt-1">Gestiona y filtra la base de datos general</p>
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

            {(searchTerm !== '' || filtroCampana !== '' || sortOrder !== 'newest') && (
              <button 
                onClick={limpiarFiltros}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 text-red-600 hover:bg-red-100 border border-red-100 rounded-lg text-sm font-semibold transition-colors shrink-0"
                title="Borrar filtros"
              >
                <FiX size={16} /> Limpiar
              </button>
            )}
            
            <button 
              onClick={openUploadModal}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 px-5 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiUploadCloud className="text-lg" /> Importar Excel
            </button>
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
                className="bg-white border border-slate-300 text-slate-700 text-xs rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-1.5 outline-none cursor-pointer"
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
                <th className="p-4">Nombre del Cliente</th>
                <th className="p-4">Email</th>
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
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-indigo-100 text-indigo-600 shrink-0 font-bold">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{cliente.nombre}</span>
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
                    ) : <span className="italic text-slate-400 text-xs">Sin campaña</span>}
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
                        <FiTag style={{ color: cliente.estado.color || '#f59e0b' }} /> {cliente.estado.nombre}
                      </span>
                    ) : (
                      <span className="italic text-slate-400 text-xs">Sin estado</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(cliente)} className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors" title="Editar">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(cliente)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* MODALES */}
      
      {/* MODAL: RESUMEN DE RESULTADOS DE IMPORTACIÓN */}
      {isResultModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slideUp flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50 shrink-0">
              <h3 className="text-lg font-bold text-emerald-900 m-0 flex items-center gap-2">
                <FiCheckCircle className="text-emerald-600" /> Resumen de Importación
              </h3>
              <button onClick={() => setIsResultModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
              <div className="flex flex-col gap-5">
                
                {/* Estadísticas Visuales */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl text-center shadow-sm">
                    <p className="text-4xl font-black text-emerald-600">{uploadResult.creados}</p>
                    <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider mt-1.5">Clientes Nuevos</p>
                  </div>
                  <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl text-center shadow-sm">
                    <p className="text-4xl font-black text-amber-600">{uploadResult.omitidos_conteo}</p>
                    <p className="text-xs font-bold text-amber-800 uppercase tracking-wider mt-1.5">Omitidos</p>
                  </div>
                </div>

                <p className="text-sm text-slate-600 text-center font-medium">
                  {uploadResult.omitidos_conteo === 0 
                    ? "¡Todos los clientes del archivo fueron importados con éxito!" 
                    : "Algunos registros fueron saltados automáticamente para evitar duplicar información o alterar la asignación de agentes actuales."}
                </p>

                {/* Lista de Detalles */}
                {omitidosList.length > 0 && (
                  <div className="mt-2 border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Detalle de registros omitidos:</p>
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex flex-col gap-2">
                      {omitidosList.map((item, idx) => (
                        <div key={idx} className="bg-white p-3 rounded-lg border border-slate-200 flex items-start gap-3 shadow-sm">
                          <FiAlertTriangle className="shrink-0 mt-0.5 text-amber-500 text-lg" /> 
                          <span className="text-sm font-medium text-slate-700 leading-snug">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50 shrink-0">
              <button 
                onClick={() => setIsResultModalOpen(false)} 
                className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-sm text-sm uppercase tracking-wide"
              >
                Entendido, Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: CARGA MASIVA DE EXCEL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-lg overflow-hidden animate-slideUp max-h-[95vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50 shrink-0">
              <h3 className="text-lg font-bold text-indigo-900 m-0 flex items-center gap-2">
                <FiUploadCloud className="text-indigo-600" /> Importar Excel
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSave} className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar">
              {importError && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md text-sm font-medium flex gap-2 items-start">
                  <FiAlertTriangle className="text-lg shrink-0 mt-0.5" />
                  <span>{importError}</span>
                </div>
              )}

              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-6 text-center hover:bg-indigo-50 transition-colors">
                <FiUsers className="text-3xl text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Sube el archivo Excel</p>
                <p className="text-xs text-slate-500 mb-3">
                  {isSuperAdmin 
                    ? "Soporta columnas: Nombre, Email, Telefono, Campaña y Estado" 
                    : "Soporta columnas: Nombre, Email y Teléfono"
                  }
                </p>
                
                <label className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-50 shadow-sm inline-block">
                  Seleccionar Archivo
                  <input type="file" required accept=".xlsx, .xls" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </label>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                  <span className="truncate pr-4 font-medium">📄 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700"><FiX /></button>
                </div>
              )}

              {!isSuperAdmin && (
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                    Configuración de la Base de Datos (Opcional)
                  </h4>
                  <p className="text-[11px] text-slate-500 -mt-2 mb-3">
                    Si dejas esto vacío, los clientes se asignarán automáticamente a tu cuenta.
                  </p>
                  
                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-500">Asignar a Campaña</label>
                    <div className="relative">
                      <FiVolume2 className="absolute left-3 top-2.5 text-slate-400" />
                      <select 
                        value={importData.campana_id} 
                        onChange={(e) => setImportData({...importData, campana_id: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm text-slate-700 appearance-none"
                      >
                        <option value="">-- Sin campaña específica --</option>
                        {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-500">Estado Inicial</label>
                    <div className="relative">
                      <FiTag className="absolute left-3 top-2.5 text-slate-400" />
                      <select 
                        value={importData.estado_id} 
                        onChange={(e) => setImportData({...importData, estado_id: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm text-slate-700 appearance-none"
                      >
                        <option value="">-- Sin estado inicial --</option>
                        {estados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold text-slate-500">Agente Responsable</label>
                    <div className="relative">
                      <FiUser className="absolute left-3 top-2.5 text-slate-400" />
                      <select 
                        value={importData.agente_id} 
                        onChange={(e) => setImportData({...importData, agente_id: e.target.value})}
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-300 bg-white focus:border-indigo-500 outline-none text-sm text-slate-700 appearance-none"
                      >
                        <option value="">-- Asignarme a mí mismo --</option>
                        {agentes.map(a => <option key={a.id} value={a.id}>{a.name} ({a.role})</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center mb-1">
                <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  <FiDownload /> Descargar plantilla Excel oficial
                </button>
              </div>

              <div className="flex gap-3 border-t border-slate-100 pt-4 shrink-0">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isLoading || !selectedFile} 
                  className={`flex-1 p-2.5 font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed ${selectedFile ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}`}
                >
                  {isLoading ? 'Importando Datos...' : 'Importar Contactos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDITAR CLIENTE */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiEdit2 className="text-indigo-600" /> Editar Cliente
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm"><FiX size={18} /></button>
            </div>
            
            <form onSubmit={handleUpdate} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Nombre</label>
                <input type="text" required value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm box-border" />
              </div>
              
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Campaña Asignada</label>
                <select value={formData.campana_id} onChange={(e) => setFormData({ ...formData, campana_id: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm box-border">
                  <option value="">-- Sin Campaña --</option>
                  {campanas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm box-border" />
                </div>
                <div>
                  <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Teléfono</label>
                  <input type="text" value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-indigo-500 outline-none text-sm box-border" />
                </div>
              </div>

              <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={isLoading} className="flex-1 p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm disabled:bg-indigo-400">
                  {isLoading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ELIMINAR CLIENTE */}
      {isDeleteModalOpen && clienteToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slideUp">
            <div className="p-6 bg-red-50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-200"><FiAlertTriangle /></div>
              <h3 className="text-xl font-bold text-red-900 m-0">¿Eliminar Cliente?</h3>
            </div>
            <div className="p-6 flex flex-col gap-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <p className="text-slate-800 font-semibold">{clienteToDelete.nombre}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} disabled={isLoading} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm">Cancelar</button>
                <button onClick={confirmDelete} disabled={isLoading} className="flex-1 p-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm disabled:bg-red-400">
                  {isLoading ? 'Eliminando...' : 'Sí, eliminar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientesView;