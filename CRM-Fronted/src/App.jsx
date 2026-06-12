import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/Login';
import FichaCliente from './components/FichaCliente'; // Importamos el nuevo componente

import api from './api';

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
      if (user) {
        try {
          const response = await api.get('/users');
          
          const usuarioExiste = response.data.some(u => u.id === user.id);
          
          if (!usuarioExiste) {
            console.warn("Usuario fantasma detectado. La cuenta fue eliminada o la BD se vació.");
            handleLogout(); 
          }
        } catch (error) {
          console.error("Error al validar la sesión fantasma:", error);
        }
      }
    };

    validarUsuarioEnBaseDeDatos();
  }, []); 

  return (
    <Router>
      <Routes>
        {/* Ruta principal: Carga tu sistema de pestañas (DashboardLayout) */}
        <Route 
          path="/" 
          element={user ? <DashboardLayout onLogout={handleLogout} user={user} /> : <Navigate to="/login" />} 
        />

        {/* Ruta del Login */}
        <Route 
          path="/login" 
          element={!user ? <Login onLogin={handleLogin} /> : <Navigate to="/" />} 
        />

        {/* Ruta específica para la Ficha del Cliente */}
        <Route 
          path="/clientes/ficha/:id" 
          element={
            user ? (
              // Usamos el DashboardLayout como "envoltura" y le pasamos la ficha adentro
              <DashboardLayout onLogout={handleLogout} user={user}>
                <FichaCliente />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" />
            )
          } 
        />

        {/* Redirección por defecto si la ruta no existe */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;