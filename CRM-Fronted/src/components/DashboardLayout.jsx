import { useState } from 'react';

const DashboardLayout = () => {
  // Estado para controlar si el menú está colapsado o no
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6', fontFamily: 'sans-serif' }}>
      
      {/* Sidebar (Menú lateral) */}
      <div style={{
        width: isCollapsed ? '60px' : '250px',
        backgroundColor: '#1f2937', // Color oscuro
        color: 'white',
        transition: 'width 0.3s ease', // Animación suave al colapsar
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Cabecera del Sidebar con el botón de hamburguesa */}
        <div style={{ 
            padding: '15px', 
            display: 'flex', 
            justifyContent: isCollapsed ? 'center' : 'space-between', 
            alignItems: 'center',
            borderBottom: '1px solid #374151'
        }}>
          {!isCollapsed && <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>CRM Multi</span>}
          <button 
            onClick={toggleSidebar} 
            style={{ 
                background: 'none', 
                border: 'none', 
                color: 'white', 
                cursor: 'pointer', 
                fontSize: '24px',
                padding: '0 5px'
            }}
          >
            ☰
          </button>
        </div>
        
        {/* Ítems del menú */}
        <ul style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
          <li style={{ padding: '15px', borderBottom: '1px solid #374151', cursor: 'pointer' }}>
            {isCollapsed ? '🏠' : '🏠 Inicio'}
          </li>
          <li style={{ padding: '15px', borderBottom: '1px solid #374151', cursor: 'pointer' }}>
            {isCollapsed ? '👥' : '👥 Clientes'}
          </li>
          <li style={{ padding: '15px', borderBottom: '1px solid #374151', cursor: 'pointer' }}>
            {isCollapsed ? '📊' : '📊 Reportes'}
          </li>
          <li style={{ padding: '15px', borderBottom: '1px solid #374151', cursor: 'pointer' }}>
            {isCollapsed ? '⚙️' : '⚙️ Configuración'}
          </li>
        </ul>
      </div>

      {/* Contenido Principal */}
      <div style={{ flex: 1, padding: '30px' }}>
        <h1 style={{ color: '#111827' }}>Bienvenido al Dashboard</h1>
        <p style={{ color: '#4b5563', marginTop: '10px' }}>
          Este es el panel principal. Aquí mostraremos las estadísticas y componentes que vayamos creando.
        </p>
        
        {/* Tarjeta de ejemplo */}
        <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: 'white', 
            borderRadius: '8px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)' 
        }}>
           <h2>Resumen de Ventas</h2>
           <p>Próximamente conectaremos esto con Laravel y PostgreSQL.</p>
        </div>
      </div>

    </div>
  );
};

export default DashboardLayout;