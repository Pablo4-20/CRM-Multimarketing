import { useState } from 'react';
import { 
  FiSearch, FiPlus, FiX, FiUploadCloud, 
  FiEdit2, FiTrash2, FiVolume2, FiDownload
} from 'react-icons/fi';

const CampanasView = () => {
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  
  // Estado de las Campañas (Solo ID y Nombre limpio)
  const [campanas, setCampanas] = useState([
    { id: 1, nombre: 'Campaña Día de la Madre' },
    { id: 2, nombre: 'Reactivación Clientes Antiguos' },
    { id: 3, nombre: 'Promoción de Verano' },
  ]);

  // Estados para formularios
  const [formData, setFormData] = useState({ nombre: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [editingId, setEditingId] = useState(null);

  // 1. Abrir modal para Crear Manual
  const openCreateModal = () => {
    setEditingId(null);
    setFormData({ nombre: '' });
    setIsCreateModalOpen(true);
  };

  // 2. Abrir modal para Editar
  const openEditModal = (campana) => {
    setEditingId(campana.id);
    setFormData({ nombre: campana.nombre });
    setIsCreateModalOpen(true);
  };

  // 3. Abrir modal de Carga Masiva
  const openUploadModal = () => {
    setSelectedFile(null);
    setIsUploadModalOpen(true);
  };

  // Guardar Campaña Manual (Crear o Editar)
  const handleSaveManual = (e) => {
    e.preventDefault();
    if (!formData.nombre) return;

    if (editingId) {
      setCampanas(campanas.map(c => c.id === editingId ? { ...c, nombre: formData.nombre } : c));
    } else {
      const nueva = { id: Date.now(), nombre: formData.nombre };
      setCampanas([nueva, ...campanas]);
    }
    setIsCreateModalOpen(false);
  };

  // Guardar Carga Masiva (Extrae solo los nombres puros del archivo)
  const handleUploadSave = (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    // Simulación: Extraemos exactamente los nombres que vienen en las celdas del Excel/CSV, 
    // sin agregarle textos como "(De archivo.csv)"
    const campañasDesdeArchivo = [
      { id: Date.now() + 1, nombre: 'Campaña Navideña VIP' },
      { id: Date.now() + 2, nombre: 'Promoción Black Friday' },
      { id: Date.now() + 3, nombre: 'Leads Captados Mayo' },
    ];

    setCampanas([...campañasDesdeArchivo, ...campanas]);
    setSelectedFile(null);
    setIsUploadModalOpen(false);
  };

  // Eliminar Campaña
  const handleDelete = (id) => {
    if(window.confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
      setCampanas(campanas.filter(c => c.id !== id));
    }
  };

  // Descargar Plantilla de Ejemplo
  const handleDownloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,Nombre de la Campana\nCampaña de Navidad\nPromocion Black Friday\nReactivacion de Leads\n";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "plantilla_creacion_campanas.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        {/* CABECERA */}
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Gestión de Campañas</h3>
            <p className="text-xs text-slate-500 mt-1">Crea campañas manualmente o impórtalas masivamente</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input type="text" placeholder="Buscar campaña..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"/>
            </div>
            
            <button 
              onClick={openUploadModal}
              className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-4 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiUploadCloud className="text-lg" /> Carga Masiva (.csv)
            </button>

            <button 
              onClick={openCreateModal}
              className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiPlus className="text-lg" /> Nueva Campaña
            </button>
          </div>
        </div>

        {/* TABLA PRINCIPAL */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[500px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">Nombre de la Campaña</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {campanas.length === 0 ? (
                <tr><td colSpan="2" className="text-center p-8 text-slate-400">No hay campañas registradas.</td></tr>
              ) : campanas.map((camp) => (
                <tr key={camp.id} className="hover:bg-slate-50/80 transition-colors group">
                  
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg bg-blue-100 text-blue-600 shrink-0">
                        <FiVolume2 />
                      </div>
                      <span className="font-semibold text-slate-900">{camp.nombre}</span>
                    </div>
                  </td>
                  
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => openEditModal(camp)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors" title="Editar Nombre">
                        <FiEdit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(camp.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Eliminar">
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

      {/* ================= MODAL 1: CREAR/EDITAR MANUAL ================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-900 m-0 flex items-center gap-2">
                <FiVolume2 className="text-blue-600" /> {editingId ? 'Editar Campaña' : 'Nueva Campaña'}
              </h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSaveManual} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block mb-1.5 text-xs font-bold text-slate-500 uppercase">Nombre de la Campaña</label>
                <input 
                  type="text" placeholder="Ej. Promo Día de la Madre" required 
                  value={formData.nombre} onChange={(e) => setFormData({ nombre: e.target.value })} 
                  className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-500 outline-none text-sm box-border" 
                />
              </div>
              
              <div className="flex gap-3 mt-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 p-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-colors shadow-sm shadow-blue-200">
                  {editingId ? 'Guardar Cambios' : 'Crear Campaña'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: CARGA MASIVA DE CAMPAÑAS ================= */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-900 m-0 flex items-center gap-2">
                <FiUploadCloud className="text-emerald-600" /> Crear Campañas Masivamente
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSave} className="p-6 flex flex-col gap-4">
              
              <div className="border-2 border-dashed border-emerald-200 bg-emerald-50/30 rounded-2xl p-6 text-center hover:bg-emerald-50 transition-colors mt-2">
                <FiUploadCloud className="text-3xl text-emerald-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Sube el archivo con los nombres</p>
                <p className="text-xs text-slate-500 mb-3">Soporta Excel (.xlsx) y .CSV</p>
                
                <label className="bg-white border border-emerald-200 text-emerald-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-emerald-50 shadow-sm inline-block">
                  Seleccionar Archivo
                  <input type="file" required accept=".csv, .xlsx, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
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
                <button type="submit" disabled={!selectedFile} className={`flex-1 p-2.5 font-semibold rounded-xl text-sm transition-colors ${selectedFile ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200 hover:bg-emerald-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}>
                  Crear Campañas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default CampanasView;