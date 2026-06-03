import { useState } from 'react';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/Login';

function App() {
  // Estado para controlar si el usuario está autenticado o no
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función que se ejecutará al llenar el formulario
  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  return (
    <>
      {/* Operador ternario: Si está autenticado muestra el Dashboard, si no, muestra el Login */}
      {isAuthenticated ? (
        <DashboardLayout />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </>
  );
}

export default App;