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
      {/* HEADER / NAV */}
      <header
        style={{
          backgroundColor: '#ba0000d3', // <- rojo vino, no negro
          color: 'white',
          padding: '1rem 2rem',
          boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            rowGap: '1rem',
            width: '100%',
          }}
        >
          {/* Marca / logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <AppIcon />
            <h1
              style={{
                margin: 0,
                fontSize: '1.5rem',
                lineHeight: 1,
                fontWeight: 600,
                color: '#fff',
              }}
            >
              MOTEKA
            </h1>
          </div>

          {/* NAV */}
          <nav
            style={{
              display: 'flex',
              gap: '1.5rem',
              alignItems: 'center',
              flexWrap: 'wrap',
              color: '#fff',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            {/* Siempre visible */}
            <NavItem to="/home" label="Inicio" />

            {/* Órdenes: gerente / encargado / mecánico */}
            {hasRole('gerente', 'encargado', 'mecanico') && (
              <NavItem to="/ordenes" label="Órdenes" />
            )}

            {/* Herramientas: gerente / encargado / mecánico */}
            {hasRole('gerente', 'encargado', 'mecanico') && (
              <NavItem to="/herramientas" label="Herramientas" />
            )}

            {/* Solo gerente / encargado */}
            {hasRole('gerente', 'encargado') && (
              <>
                <NavItem to="/marcas" label="Marcas" />
                <NavItem to="/modelos" label="Modelos" />
                <NavItem to="/clientes" label="Clientes" />
                <NavItem to="/motos" label="Motocicletas" />
                <NavItem to="/usuarios" label="Usuarios" />
              </>
            )}

            {/* Separador visual */}
            <div
              style={{
                width: '1px',
                alignSelf: 'stretch',
                backgroundColor: '#694747',
                margin: '0 0.5rem',
              }}
            />

            {/* Usuario + salir */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                color: '#fff',
              }}
            >
              <span style={{ fontSize: '0.9rem', color: '#fff' }}>
                {user?.usuario}{' '}
                <span style={{ opacity: 0.7 }}>({user?.rol})</span>
              </span>

              <button
                onClick={handleLogout}
                style={{
                  backgroundColor: '#581414ff', // botoncito vino oscuro
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                }}
              >
                Salir
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* CONTENIDO */}
      <main
        style={{
          flex: 1,
          padding: '2rem',
          backgroundColor: '#f1f5f9', // fondo gris claro del contenido
        }}
      >
        <Outlet />
      </main>
    </div>
  );
}

/* --- Link limpio del navbar --- */
function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      style={{
        color: 'white',
        textDecoration: 'none',
        padding: '0.25rem 0.5rem',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = '#ffb3b3';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLAnchorElement).style.color = 'white';
      }}
    >
      {label}
    </Link>
  );
}