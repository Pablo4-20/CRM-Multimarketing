import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.18.39:8000/api', // <-- Aquí va tu IP
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8'
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