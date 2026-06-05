import axios from 'axios';

// Creamos la instancia de axios con la IP de tu computadora en la red local
const api = axios.create({
  baseURL: 'http://192.168.100.50:8000/api', // <-- Aquí va tu IP
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Opcional: Si luego usas tokens de autenticación (Sanctum/JWT), 
// puedes interceptar las peticiones aquí para agregar el token automáticamente.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // O de donde guardes tu token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;