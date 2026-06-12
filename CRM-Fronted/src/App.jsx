 import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/Login';
import api from './api'; // Asegúrate de importar tu configuración de Axios

function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const handleLogin = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken || 'dummy-token');
    setUser(userData);
    setToken(authToken || 'dummy-token');
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  // ========================================================
  // VERIFICACIÓN DE SESIÓN FANTASMA AL CARGAR LA APLICACIÓN
  // ========================================================
  useEffect(() => {
    const validarUsuarioEnBaseDeDatos = async () => {
      // Si hay un usuario en el navegador, comprobamos si es real
      if (user) {
        try {
          const response = await api.get('/users');
          
          // Verificamos si el ID del usuario actual sigue en la base de datos
          const usuarioExiste = response.data.some(u => u.id === user.id);
          
          if (!usuarioExiste) {
            console.warn("Usuario fantasma detectado. La cuenta fue eliminada o la BD se vació.");
            handleLogout(); // Forzamos el cierre de sesión
          }
        } catch (error) {
          console.error("Error al validar la sesión fantasma:", error);
        }
      }
    };

    validarUsuarioEnBaseDeDatos();
  }, []); // El corchete vacío asegura que solo se ejecute al recargar la página

  return (
    <>
      {user ? (
        <DashboardLayout onLogout={handleLogout} user={user} /> 
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;