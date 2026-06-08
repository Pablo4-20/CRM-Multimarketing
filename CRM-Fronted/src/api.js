import axios from 'axios';

// DETECCIÓN DINÁMICA: 
// Si un usuario entra desde la VPN (ej. 10.6.12.5), usará esa IP para el backend.
// Si entra desde la red local (192.168.18.39), usará la local.
const serverIP = window.location.hostname;

const api = axios.create({
  baseURL: `http://${serverIP}:8000/api`, 
  headers: {
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