import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api'; // Tu instancia de Axios configurada

const FichaCliente = () => {
    const { id } = useParams();
    const [cliente, setCliente] = useState({
        nombre: '',
        telefono: '',
        correo: '',
        notas: ''
    });

    useEffect(() => {
        // Cargar los datos del cliente al montar el componente
        const fetchCliente = async () => {
            try {
                const response = await api.get(`/clientes/${id}`);
                setCliente(response.data);
            } catch (error) {
                console.error("Error al cargar la ficha del cliente", error);
            }
        };
        fetchCliente();
    }, [id]);

    const handleInputChange = (e) => {
        setCliente({ ...cliente, [e.target.name]: e.target.value });
    };

    const handleActualizarDatos = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/clientes/${id}`, cliente);
            alert('Datos del cliente actualizados con éxito');
        } catch (error) {
            console.error("Error al actualizar", error);
        }
    };

    return (
        <div className="p-6 bg-gray-50 min-h-screen">
            <h1 className="text-2xl font-bold mb-6">Ficha del Cliente #{id}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Panel de Datos Básicos */}
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-semibold mb-4">Datos Generales</h2>
                    <form onSubmit={handleActualizarDatos} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nombre</label>
                            <input 
                                type="text" name="nombre" value={cliente.nombre} onChange={handleInputChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Teléfono</label>
                            <input 
                                type="text" name="telefono" value={cliente.telefono} onChange={handleInputChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Correo</label>
                            <input 
                                type="email" name="correo" value={cliente.correo} onChange={handleInputChange} 
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2"
                            />
                        </div>
                        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                            Guardar Cambios
                        </button>
                    </form>
                </div>

                {/* Panel de Comentarios y Citas */}
                <div className="bg-white p-6 rounded shadow flex flex-col space-y-6">
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Gestión de Comentarios</h2>
                        {/* Aquí puedes mapear los comentarios o integrar tu componente existente de comentarios */}
                        <p className="text-sm text-gray-500">Módulo de comentarios en construcción...</p>
                    </div>
                    <hr />
                    <div>
                        <h2 className="text-lg font-semibold mb-4">Gestión de Citas</h2>
                        {/* Aquí integras la lógica para agendar o editar citas */}
                        <p className="text-sm text-gray-500">Módulo de citas en construcción...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FichaCliente;