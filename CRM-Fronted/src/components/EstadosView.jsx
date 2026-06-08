import { useState, useEffect } from 'react';
import { 
  FiSearch, FiPlus, FiX, FiUploadCloud, FiFileText, 
  FiEdit2, FiTrash2, FiTag, FiDownload, FiAlertTriangle
} from 'react-icons/fi';
import api from '../api';

const EstadosView = () => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [errorMessage, setErrorMessage] = useState(null);

  const [estados, setEstados] = useState([]);
  const [formData, setFormData] = useState({ nombre: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [estadoToDelete, setEstadoToDelete] = useState(null); 
  const [isLoading, setIsLoading] = useState(false);

  // Estado para el filtro de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchEstados();
  }, []);

  const fetchEstados = async () => {
    try {
      const response = await api.get('/estados');
      setEstados(response.data);
    } catch (error) { console.error("Error:", error); }
  };

  // 1. Buscador inteligente que ignora tildes y mayúsculas al buscar
  const estadosFiltrados = estados.filter(est => {
    const nombreNormalizado = est.nombre.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    const busquedaNormalizada = searchTerm.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    return nombreNormalizado.includes(busquedaNormalizada);
  });

  const clearFilters = () => {
    setSearchTerm('');
  };

  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nombre: '' });
    setErrorMessage(null); // Limpiar errores al abrir
    setIsCreateModalOpen(true);
  };

  const openEditModal = (estado) => {
    setEditingId(estado.id);
    setFormData({ nombre: estado.nombre });
    setErrorMessage(null); // Limpiar errores al abrir
    setIsCreateModalOpen(true);
  };

  const openUploadModal = () => {
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  const openDeleteModal = (estado) => {
    setEstadoToDelete(estado);
    setIsDeleteModalOpen(true);
  };

  // 2. Validación robusta en tiempo real para evitar duplicados respetando el idioma español
  const handleNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, nombre: value }); 

    if (!value.trim()) {
      setErrorMessage(null);
      return;
    }

    // localeCompare con 'base' ignora mayúsculas/minúsculas pero entiende la diferencia entre 'n' y 'ñ'
    const isDuplicate = estados.some(
      est => est.nombre.trim().localeCompare(value.trim(), 'es', { sensitivity: 'base' }) === 0 && est.id !== editingId
    );

    if (isDuplicate) {
      setErrorMessage("Ya existe un estado con este nombre.");
    } else {
      setErrorMessage(null); 
    }
  };

  const handleSaveManual = async (e) => {
    e.preventDefault();
    if (!formData.nombre || errorMessage) return; 
    setErrorMessage(null); 
    setIsLoading(true);

    try {
      if (editingId) {
        await api.put(`/estados/${editingId}`, { nombre: formData.nombre });
      } else {
        await api.post('/estados', { nombre: formData.nombre });
      }
      await fetchEstados();
      setIsCreateModalOpen(false);
      
    } catch (error) {
      if (error.response && error.response.status === 422) {
        const errorData = error.response.data;
        const errorMessages = Object.values(errorData.errors).flat().join(' | ');
        setErrorMessage(errorMessages);
      } else {
        setErrorMessage("Hubo un error de conexión al guardar.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSave = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setIsLoading(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target.result;
      const lineas = text.split(/\r?\n/);
      const estadosAEnviar = [];

      for (let i = 1; i < lineas.length; i++) {
        const lineaLimpia = lineas[i].trim();
        if (lineaLimpia) {
          const nombreExtraido = lineaLimpia.replace(/(^"|"$)/g, '').trim();
          if (nombreExtraido) {
            estadosAEnviar.push({ nombre: nombreExtraido });
          }
        }
      }

      if (estadosAEnviar.length > 0) {
        try {
          await api.post('/estados/masivo', { estados: estadosAEnviar });
          await fetchEstados(); 
        } catch (error) {
          console.error("Error en carga masiva:", error);
        }
      } else {
        alert("El archivo no tiene nombres válidos.");
      }

      setSelectedFile(null);
      setIsUploadModalOpen(false);
      setIsLoading(false);
    };

    // 3. Leemos el CSV en ISO-8859-1 para soportar archivos de Excel con tildes y eñes
    reader.readAsText(selectedFile, 'ISO-8859-1');
  };

  const confirmDelete = async () => {
    if (!estadoToDelete) return;
    setIsLoading(true);
    try {
      await api.delete(`/estados/${estadoToDelete.id}`);
      await fetchEstados();
      setIsDeleteModalOpen(false);
      setEstadoToDelete(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "\uFEFFNombre del Estado\nNuevo\nEn Seguimiento\nAgendado\nVendido\nNo Contesta\n";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "plantilla_creacion_estados.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Gestión de Estados</h3>
            <p className="text-xs text-slate-500 mt-1">Configura las etapas del embudo de ventas</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative flex items-center w-full sm:w-64 gap-2">
              <div className="relative w-full">
                <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
                <input 
                  type="text" 
                  placeholder="Buscar estado..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 box-border"
                />
                {searchTerm && (
                  <button 
                    onClick={clearFilters}
                    className="absolute right-2 top-2.5 text-slate-400 hover:text-red-500 transition-colors"
                    title="Limpiar búsqueda"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>
            
            <button 
              onClick={openUploadModal}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiUploadCloud className="text-lg" /> Carga Masiva (.csv)
            </button>

            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiPlus className="text-lg" /> Nuevo Estado
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">Nombre del Estado</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {estadosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan="2" className="text-center p-8 text-slate-400">
                    {estados.length === 0 
                      ? 'No hay estados en la base de datos.' 
                      : 'No se encontraron estados con ese nombre.'}
                  </td>
                </tr>
              ) : estadosFiltrados.map((estado) => (
                <tr key={estado.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-amber-100 text-amber-600 shrink-0">
                        <FiTag />
                      </div>
                      <span className="font-semibold text-slate-900">{estado.nombre}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(estado)} className="p-2 text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors" title="Editar Nombre">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => openDeleteModal(estado)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiTag className="text-amber-500" /> {editingId ? 'Editar Estado' : 'Nuevo Estado'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveManual} className="p-6 flex flex-col gap-4">

              {errorMessage && (
                <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm font-medium animate-fadeIn">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Nombre del Estado</label>
                <input 
                  type="text" placeholder="Ej. En Seguimiento" required 
                  value={formData.nombre} onChange={handleNameChange}
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-amber-500 outline-none text-sm box-border" 
                />
              </div>
              
              <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button 
                  type="submit" 
                  disabled={isLoading || errorMessage !== null || !formData.nombre.trim()} 
                  className="flex-1 p-2.5 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-amber-200 disabled:bg-amber-300 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Guardando...' : (editingId ? 'Guardar Cambios' : 'Crear Estado')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 m-0 flex items-center gap-2">
                <FiUploadCloud className="text-emerald-600" /> Crear Estados Masivamente
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSave} className="p-6 flex flex-col gap-4">
              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-2xl p-6 text-center hover:bg-emerald-50 transition-colors mt-2">
                <FiFileText className="text-3xl text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Sube el archivo CSV con los nombres</p>
                <p className="text-xs text-slate-500 mb-3">Descarga nuestra plantilla para evitar errores</p>
                
                <label className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-emerald-50 shadow-sm inline-block">
                  Seleccionar Archivo
                  <input type="file" required accept=".csv, text/csv" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </label>
              </div>

              <div className="flex justify-center -mt-2 mb-2">
                <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  <FiDownload /> Descargar plantilla CSV de ejemplo
                </button>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                  <span className="truncate pr-4 font-medium">📄 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700"><FiX /></button>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={!selectedFile || isLoading} className={`flex-1 p-2.5 font-semibold rounded-xl text-sm transition-colors ${selectedFile ? 'bg-emerald-600 text-white shadow-md hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} disabled:bg-emerald-400`}>
                  {isLoading ? 'Procesando...' : 'Leer Archivo y Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && estadoToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-sm overflow-hidden animate-slideUp">
            
            <div className="p-6 bg-red-50 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm border border-red-200">
                <FiAlertTriangle />
              </div>
              <h3 className="text-xl font-bold text-red-900 m-0">¿Eliminar Estado?</h3>
              <p className="text-sm text-red-600 mt-2 font-medium">Esta acción no se puede deshacer.</p>
            </div>

            <div className="p-6 flex flex-col gap-5">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Estado seleccionado:</span>
                <p className="text-slate-800 font-semibold mt-1">{estadoToDelete.nombre}</p>
              </div>

              <div className="flex gap-3 mt-2">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)} 
                  disabled={isLoading}
                  className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete} 
                  disabled={isLoading}
                  className="flex-1 p-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-red-200 disabled:bg-red-400"
                >
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

export default EstadosView;