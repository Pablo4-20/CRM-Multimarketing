import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/Login';

function App() {
  // Estado que verifica si hay una sesión guardada en localStorage al iniciar
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuth') === 'true';
  });

  // Función para iniciar sesión
  const handleLogin = () => {
    localStorage.setItem('isAuth', 'true');
    setIsAuthenticated(true);
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    localStorage.removeItem('isAuth');
    setIsAuthenticated(false);
  };

  return (
    <>
      {isAuthenticated ? (
        <DashboardLayout onLogout={handleLogout} />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;