import { useState, useEffect } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/Login';

function App() {
  // Guardamos el usuario (con su rol, nombre, etc) y el token
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);

  const handleLogin = (userData, authToken) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', authToken);
    setUser(userData);
    setToken(authToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  return (
    <>
      {user && token ? (
        // Le pasamos el usuario logueado al Dashboard
        <DashboardLayout onLogout={handleLogout} user={user} /> 
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;