import { useState } from 'react';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // Validación temporal para poder probar la interfaz
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen w-full bg-slate-100 font-sans">
      <div className="bg-white p-10 rounded-xl shadow-lg w-full max-w-sm border border-slate-100">
        
        <h2 className="text-center text-2xl font-bold mb-8 text-slate-800">
          Iniciar Sesión
        </h2>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-600">
              Correo Electrónico
            </label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@crm.com"
              className="w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required 
            />
          </div>
          
          <div>
            <label className="block mb-2 text-sm font-bold text-slate-600">
              Contraseña
            </label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-3 rounded-lg border border-slate-300 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              required 
            />
          </div>
          
          <button 
            type="submit" 
            className="w-full mt-2 p-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors text-lg"
          >
            Ingresar
          </button>
        </form>

      </div>
    </div>
  );
};

export default Login;