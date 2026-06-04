import { useState, useEffect } from 'react';
import { 
  FiSearch, FiX, FiUploadCloud, 
  FiEdit2, FiTrash2, FiUsers, FiDownload, FiAlertTriangle, FiMail, FiPhone, FiVolume2
} from 'react-icons/fi';
import * as XLSX from 'xlsx';

const ClientesView = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [clientes, setClientes] = useState([]);
  const [campanas, setCampanas] = useState([]); // <-- Nuevo para el Edit Modal
  const [selectedFile, setSelectedFile] = useState(null);
  
  const [formData, setFormData] = useState({ nombre: '', email: '', telefono: '', campana_id: '' });
  const [editingId, setEditingId] = useState(null);
  const [clienteToDelete, setClienteToDelete] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const API_URL = 'http://127.0.0.1:8000/api/clientes';

  useEffect(() => {
    fetchClientes();
    fetchCampanas();
  }, []);

  const fetchClientes = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      setClientes(data);
    } catch (error) {
      console.error("Error al cargar clientes:", error);
    }
  };

  const fetchCampanas = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/api/campanas');
      const data = await response.json();
      setCampanas(data);
    } catch (error) {
      console.error("Error al cargar campañas:", error);
    }
  };

  const openUploadModal = () => {
    setSelectedFile(null);
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

  // ==============================================================
  // LECTURA DE EXCEL MODIFICADA PARA LEER CAMPAÑA
  // ==============================================================
  const handleUploadSave = (e) => {
    e.preventDefault();
    if (!selectedFile) return;
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
          // NUEVO: Lee la columna de Campaña
          const campana = row['Campaña'] || row['campaña'] || row['Campana'] || row['campana'] || '';

          if (nombre) {
            clientesAEnviar.push({ 
              nombre: String(nombre).trim(), 
              email: String(email).trim(), 
              telefono: String(telefono).trim(),
              campana: String(campana).trim() 
            });
          }
        });

        if (clientesAEnviar.length > 0) {
          await fetch(`${API_URL}/masivo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientes: clientesAEnviar })
          });
          await fetchClientes(); 
          await fetchCampanas(); // Refrescamos por si se crearon campañas nuevas automáticamente
        } else {
          alert("El archivo Excel está vacío o le falta la columna 'Nombre'.");
        }
      } catch (error) {
        console.error("Error leyendo Excel:", error);
      }

      setSelectedFile(null);
      setIsUploadModalOpen(false);
      setIsLoading(false);
    };
    reader.readAsArrayBuffer(selectedFile);
  };

  const handleDownloadTemplate = () => {
    const datosEjemplo = [
      { Nombre: "Juan Perez", Email: "juan@ejemplo.com", Telefono: "0991234567", Campaña: "Promoción Black Friday" },
      { Nombre: "Maria Lopez", Email: "maria@ejemplo.com", Telefono: "0987654321", Campaña: "Reactivación Clientes" }
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
      await fetch(`${API_URL}/${editingId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
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
      await fetch(`${API_URL}/${clienteToDelete.id}`, { method: 'DELETE' });
      await fetchClientes();
      setIsDeleteModalOpen(false);
      setClienteToDelete(null);
    } catch (error) {
      console.error("Error al eliminar:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="animate-fadeIn w-full">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden w-full">
        
        <div className="p-5 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white w-full">
          <div>
            <h3 className="text-lg font-bold text-slate-900 m-0">Directorio de Clientes</h3>
            <p className="text-xs text-slate-500 mt-1">Importa tu base de datos desde Microsoft Excel</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-56">
              <FiSearch className="absolute left-3 top-2.5 text-slate-400 text-lg" />
              <input type="text" placeholder="Buscar cliente..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 box-border"/>
            </div>
            
            <button 
              onClick={openUploadModal}
              className="flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm shadow-indigo-200 px-5 py-2 rounded-lg font-medium transition-all text-sm w-full sm:w-auto shrink-0"
            >
              <FiUploadCloud className="text-lg" /> Importar Excel
            </button>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200">
                <th className="p-4 pl-6">Nombre del Cliente</th>
                <th className="p-4">Campaña</th>
                <th className="p-4">Email</th>
                <th className="p-4">Teléfono</th>
                <th className="p-4 text-center w-32">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
              {clientes.length === 0 ? (
                <tr><td colSpan="5" className="text-center p-8 text-slate-400">No hay clientes importados.</td></tr>
              ) : clientes.map((cliente) => (
                <tr key={cliente.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-indigo-100 text-indigo-600 shrink-0 font-bold">
                        {cliente.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-semibold text-slate-900">{cliente.nombre}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {cliente.campana ? (
                      <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-100 px-2 py-1 rounded text-xs font-medium w-fit"><FiVolume2/> {cliente.campana.nombre}</span>
                    ) : <span className="italic text-slate-400 text-xs">Sin campaña</span>}
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

      {/* MODAL: CARGA MASIVA DE EXCEL */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-md overflow-hidden animate-slideUp">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="text-lg font-bold text-indigo-900 m-0 flex items-center gap-2">
                <FiUploadCloud className="text-indigo-600" /> Importar Excel
              </h3>
              <button onClick={() => setIsUploadModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-white border border-slate-200 rounded-md shadow-sm">
                <FiX size={18} />
              </button>
            </div>
            
            <form onSubmit={handleUploadSave} className="p-6 flex flex-col gap-4">
              <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/30 rounded-2xl p-6 text-center hover:bg-indigo-50 transition-colors mt-2">
                <FiUsers className="text-3xl text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Sube el archivo Excel</p>
                <p className="text-xs text-slate-500 mb-3">Soporta columnas: Nombre, Email, Telefono y <strong>Campaña</strong></p>
                
                <label className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg text-sm font-bold cursor-pointer hover:bg-indigo-50 shadow-sm inline-block">
                  Seleccionar Archivo
                  <input type="file" required accept=".xlsx, .xls" className="hidden" onChange={(e) => setSelectedFile(e.target.files[0])} />
                </label>
              </div>

              <div className="flex justify-center -mt-2 mb-2">
                <button type="button" onClick={handleDownloadTemplate} className="flex items-center gap-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                  <FiDownload /> Descargar plantilla Excel oficial
                </button>
              </div>

              {selectedFile && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 flex items-center justify-between">
                  <span className="truncate pr-4 font-medium">📄 {selectedFile.name}</span>
                  <button type="button" onClick={() => setSelectedFile(null)} className="text-red-500 hover:text-red-700"><FiX /></button>
                </div>
              )}

              <div className="flex gap-3 border-t border-slate-100 pt-4">
                <button type="button" onClick={() => setIsUploadModalOpen(false)} className="flex-1 p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl text-sm transition-colors">Cancelar</button>
                <button type="submit" disabled={!selectedFile || isLoading} className={`flex-1 p-2.5 font-semibold rounded-xl text-sm transition-colors ${selectedFile ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-slate-200 text-slate-400 cursor-not-allowed'} disabled:bg-indigo-400`}>
                  {isLoading ? 'Leyendo Excel...' : 'Importar Contactos'}
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
              
              {/* NUEVO: Select de Campaña */}
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