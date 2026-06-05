import { useState } from 'react';
import logoImg from '../assets/logo.png';
import api from "../api";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Usamos Axios en lugar de fetch. 
      // Ya no necesitamos escribir toda la IP ni los headers, solo la ruta '/login'
      const response = await api.post('/login', { email, password });

      // Axios guarda los datos de respuesta dentro de 'response.data'
      const data = response.data;
      
      onLogin(data.user, data.token);

    } catch (err) {
      // Axios captura los errores de estado (ej: 401 Credenciales incorrectas) aquí
      if (err.response) {
        // El backend respondió con un error (ej. mensaje de error de Laravel)
        setError(err.response.data.message || 'Error al iniciar sesión');
      } else if (err.request) {
        // La petición se hizo pero no hubo respuesta (El error ERR_CONNECTION_TIMED_OUT cae aquí)
        setError('No se pudo conectar con el servidor. Verifica tu red.');
      } else {
        // Otro tipo de error
        setError('Ocurrió un error inesperado.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-slate-100 font-sans p-4">
      
      <div className="bg-white p-10 md:p-12 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        
        <div className="text-center mb-8">
          {/* AQUÍ ESTÁ EL CAMBIO: Se quitó mb-4 y se agregó -mb-4 para acercar el texto */}
          <img 
            src={logoImg} 
            alt="Logo CRM" 
            className="w-80 h-80 object-contain mx-auto drop-shadow-sm -mb-10 relative z-10" 
          />
          <h2 className="text-2xl font-bold text-slate-800">Bienvenido</h2>
          <p className="text-slate-500 text-sm mt-1">Ingresa tus credenciales para continuar</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">Correo Electrónico</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="usuario@crm.com"
              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium box-border"
              required 
            />
          </div>
          
          <div>
            <label className="block mb-2 text-xs font-bold text-slate-500 uppercase">Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all text-sm font-medium box-border"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full mt-4 p-3 text-white font-bold rounded-xl shadow-md transition-all text-sm ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
          >
            {isLoading ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;