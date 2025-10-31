import { Outlet, Link, useNavigate } from 'react-router-dom';
import { clearSession, getUser, hasRole } from '@/lib/auth';
import AppIcon from '@/components/AppIcon';

export default function AuthLayout() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    clearSession();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header style={{
        backgroundColor: '#3b1e1e',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.4)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', rowGap: '1rem' }}>
          
          {/* marca / logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AppIcon />
            <h1 style={{ margin: 0, fontSize: '1.5rem', lineHeight: 1, fontWeight: 600, color: '#fff' }}>
              MOTEKA
            </h1>
          </div>

          {/* nav */}
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/home" style={{ color: 'white', textDecoration: 'none' }}>Inicio</Link>
            <Link to="/marcas" style={{ color: 'white', textDecoration: 'none' }}>Marcas</Link>
            <Link to="/modelos" style={{ color: 'white', textDecoration: 'none' }}>Modelos</Link>
            <Link to="/clientes" style={{ color: 'white', textDecoration: 'none' }}>Clientes</Link>
            <Link to="/motos" style={{ color: 'white', textDecoration: 'none' }}>Motocicletas</Link>
            <Link to="/ordenes" style={{ color: 'white', textDecoration: 'none' }}>Órdenes</Link>

            {hasRole('gerente', 'encargado') && (
              <Link to="/usuarios" style={{ color: 'white', textDecoration: 'none' }}>Usuarios</Link>
            )}

            <div style={{ borderLeft: '1px solid #694747', paddingLeft: '1.5rem', display:'flex', alignItems:'center', gap:'0.75rem' }}>
              <span style={{ fontSize: '0.9rem', color:'#fff' }}>
                {user?.usuario} <span style={{ opacity:0.7 }}>({user?.rol})</span>
              </span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                Salir
              </button>
            </div>
          </nav>
        </div>
      </header>

      <main style={{ flex: 1, padding: '2rem', backgroundColor: '#f1f5f9' }}>
        <Outlet />
      </main>
    </div>
  );
}
