import axios from 'axios';

const api = axios.create({
  baseURL: 'http://192.168.100.90:8000/api', // <-- Aquí va tu IP
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Accept': 'application/json; charset=utf-8'
  }
});

// 1. Interceptor de PETICIONES: Agrega el token automáticamente a cada solicitud
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // O de donde guardes tu token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// 2. Interceptor de RESPUESTAS: Detecta si la sesión murió (Error 401)
api.interceptors.response.use(
  (response) => {
    // Si la respuesta es exitosa, simplemente la dejamos pasar
    return response;
  },
  (error) => {
    // Si el backend responde con error 401 (No autorizado / Token inválido)
    if (error.response && error.response.status === 401) {
      console.warn("Sesión expirada o inválida. Cerrando sesión...");
      
      // Borrar todos los rastros de la sesión "fantasma"
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.clear();
      
      // Expulsar al usuario a la pantalla de login
      window.location.href = '/login'; 
    }
    
    // Devolvemos el error para que el componente que hizo la petición también se entere
    return Promise.reject(error);
  }
);

export default api;