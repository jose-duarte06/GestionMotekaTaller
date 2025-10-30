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
        backgroundColor: '#3b1e1eff',
        color: 'white',
        padding: '1rem 2rem',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AppIcon />
            <h1 style={{ margin: 0, fontSize: '1.5rem' }}>MOTEKA</h1>
          </div>
          <nav style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
            <Link to="/home" style={{ color: 'white', textDecoration: 'none' }}>Inicio</Link>
            <Link to="/marcas" style={{ color: 'white', textDecoration: 'none' }}>Marcas</Link>
            <Link to="/modelos" style={{ color: 'white', textDecoration: 'none' }}>Modelos</Link>
            <Link to="/clientes" style={{ color: 'white', textDecoration: 'none' }}>Clientes</Link>
            <Link to="/motos" style={{ color: 'white', textDecoration: 'none' }}>Motocicletas</Link>
            <Link to="/ordenes" style={{ color: 'white', textDecoration: 'none' }}>Órdenes</Link>
            <div style={{ borderLeft: '1px solid #694747ff', paddingLeft: '1.5rem' }}>
              <span style={{ marginRight: '1rem' }}>{user?.usuario}</span>
              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#dc2626',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer'
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
